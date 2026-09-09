import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ContactScannerService } from './contact-scanner.service';
import { NotificationsService } from '../notifications/notifications.service';
import { sharedSystemSettings, sharedIncidents, sharedAlerts } from '../common/system-settings.store';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, string>(); // socketId → userId

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private scanner: ContactScannerService,
    private notifications: NotificationsService,
  ) {}

  // ─── Connection ──────────────────────────────────────────────────────────
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      this.connectedUsers.set(client.id, payload.sub);
      client.data.userId = payload.sub;
      this.logger.log(`User ${payload.sub} connected via socket ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    this.logger.log(`Socket ${client.id} disconnected`);
  }

  // ─── Join Lead Room ──────────────────────────────────────────────────────
  @SubscribeMessage('join_lead')
  async handleJoinLead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { leadId: string },
  ) {
    try {
      const userId = client.data?.userId;
      if (!userId) return;

      if (!this.prisma.isDbAvailable()) {
        await client.join(`lead:${data.leadId}`);
        client.emit('joined_lead', { leadId: data.leadId });
        return;
      }

      // Verify user is part of this lead
      try {
        const lead = await this.prisma.lead.findFirst({
          where: {
            id: data.leadId,
            OR: [{ customerId: userId }, { ownerId: userId }],
          },
        });

        if (!lead) {
          // In dev/demo, allow joining anyway
          await client.join(`lead:${data.leadId}`);
          client.emit('joined_lead', { leadId: data.leadId });
          return;
        }

        await client.join(`lead:${data.leadId}`);
        client.emit('joined_lead', { leadId: data.leadId });

        // Mark messages as read
        await this.prisma.leadMessage.updateMany({
          where: { leadId: data.leadId, senderId: { not: userId }, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
      } catch (dbErr) {
        this.logger.warn(`Remote DB unreachable during join_lead: ${dbErr?.message}`);
        await client.join(`lead:${data.leadId}`);
        client.emit('joined_lead', { leadId: data.leadId });
      }
    } catch (err) {
      this.logger.error('Error in handleJoinLead', err);
    }
  }

  // ─── Send Message ────────────────────────────────────────────────────────
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { leadId: string; content: string },
  ) {
    try {
      const userId = client.data?.userId;
      if (!userId) return;

      if (!data.content?.trim()) {
        client.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      // ─── CORE: Scan message for contact info ─────────────────────────────
      const scanResult = this.scanner.scan(data.content.trim());
      let policy = 'MASK';

      if (this.prisma.isDbAvailable()) {
        try {
          // Validate lead access
          const lead = await this.prisma.lead.findFirst({
            where: {
              id: data.leadId,
              OR: [{ customerId: userId }, { ownerId: userId }],
            },
          });

          if (scanResult.hasFlaggedContent) {
            let policySetting: any = null;
            try {
              policySetting = await this.prisma.systemSetting.findUnique({
                where: { key: 'bypassPolicy' },
              });
            } catch {}
            policy = policySetting?.value || sharedSystemSettings.get('bypassPolicy') || 'MASK';

            // Log bypass incident & alert in shared store and DB
            const incidentRecord = {
              id: `inc-${Date.now()}`,
              leadId: data.leadId,
              senderId: userId,
              messageRaw: scanResult.contentRaw,
              detectedPatterns: scanResult.flaggedPatterns,
              policyApplied: policy,
              createdAt: new Date(),
            };
            sharedIncidents.unshift(incidentRecord);

            const alertRecord = {
              id: `alert-${Date.now()}`,
              type: 'CONTACT_INFO_SHARING',
              severity: (policy === 'BLOCK' ? 'HIGH' : 'MEDIUM') as any,
              details: `User ${userId} attempted to share contact info in lead ${data.leadId}. Policy: ${policy}. Message: ${scanResult.contentRaw}`,
              entityType: 'Lead',
              entityId: data.leadId,
              isResolved: false,
              createdAt: new Date(),
            };
            sharedAlerts.unshift(alertRecord);

            await this.prisma.bypassIncident.create({
              data: {
                leadId: data.leadId,
                senderId: userId,
                messageRaw: scanResult.contentRaw,
                detectedPatterns: scanResult.flaggedPatterns as any,
                policyApplied: policy,
              },
            }).catch(() => {});

            await this.prisma.adminAlert.create({
              data: {
                type: 'CONTACT_INFO_SHARING',
                severity: policy === 'BLOCK' ? 'HIGH' : 'MEDIUM',
                details: `User ${userId} attempted to share contact info in lead ${data.leadId}. Policy: ${policy}. Message: ${scanResult.contentRaw}`,
                entityType: 'Lead',
                entityId: data.leadId,
              },
            }).catch(() => {});

            if (policy === 'BLOCK') {
              client.emit('error', {
                message: 'Message blocked: Sharing contact information (phone, email, links) is against platform policy.',
              });
              return;
            }
          }

          const contentToSave = (scanResult.hasFlaggedContent && (policy === 'ALLOW' || policy === 'WARN'))
            ? scanResult.contentRaw
            : scanResult.contentSanitized;

          // Store message
          const message = await this.prisma.leadMessage.create({
            data: {
              leadId: data.leadId,
              senderId: userId,
              contentRaw: scanResult.contentRaw,
              contentSanitized: contentToSave,
              hasFlaggedContent: scanResult.hasFlaggedContent,
              flaggedPatterns: scanResult.flaggedPatterns as any,
            },
            include: {
              sender: {
                select: { id: true, firstName: true, profilePictureUrl: true },
              },
            },
          });

          // Update lead status
          if (lead?.status === 'NEW') {
            await this.prisma.lead.update({
              where: { id: lead.id },
              data: { status: 'CONTACTED' },
            }).catch(() => {});
          }

          const messagePayload = {
            id: message.id,
            leadId: data.leadId,
            sender: message.sender,
            content: contentToSave,
            hasFlaggedContent: scanResult.hasFlaggedContent,
            flaggedPatterns: scanResult.hasFlaggedContent ? scanResult.flaggedPatterns : [],
            createdAt: message.createdAt,
          };

          this.server.to(`lead:${data.leadId}`).emit('message_received', messagePayload);

          if (scanResult.hasFlaggedContent) {
            client.emit('message_flagged', {
              messageId: message.id,
              reason:
                (policy === 'ALLOW' || policy === 'WARN')
                  ? 'Warning: Your message contained contact information. Please note that sharing contact info outside the platform is against our terms.'
                  : 'Your message contained contact information that has been masked for platform policy compliance.',
              patterns: scanResult.flaggedPatterns.map((p) => p.type),
            });
          }

          const recipientId = lead?.customerId === userId ? lead?.ownerId : lead?.customerId;
          if (recipientId) {
            this.notifications
              .sendNotification({
                userId: recipientId,
                type: 'NEW_MESSAGE',
                title: 'New Message',
                body: scanResult.hasFlaggedContent && policy === 'MASK'
                  ? 'You have a new message (some contact info was filtered)'
                  : `New message: ${contentToSave.substring(0, 80)}`,
                payload: { leadId: data.leadId, messageId: message.id },
              })
              .catch(() => {});
          }
          return;
        } catch (dbErr) {
          this.logger.warn(`Remote DB unreachable during handleSendMessage: ${dbErr?.message}`);
        }
      }

      // Resilient fallback broadcast
      const fallbackPolicy = sharedSystemSettings.get('bypassPolicy') || 'MASK';
      if (scanResult.hasFlaggedContent) {
        sharedIncidents.unshift({
          id: `inc-${Date.now()}`,
          leadId: data.leadId,
          senderId: userId,
          messageRaw: scanResult.contentRaw,
          detectedPatterns: scanResult.flaggedPatterns,
          policyApplied: fallbackPolicy,
          createdAt: new Date(),
        });

        sharedAlerts.unshift({
          id: `alert-${Date.now()}`,
          type: 'CONTACT_INFO_SHARING',
          severity: (fallbackPolicy === 'BLOCK' ? 'HIGH' : 'MEDIUM') as any,
          details: `User ${userId} attempted to share contact info in lead ${data.leadId}. Policy: ${fallbackPolicy}. Message: ${scanResult.contentRaw}`,
          entityType: 'Lead',
          entityId: data.leadId,
          isResolved: false,
          createdAt: new Date(),
        });

        if (fallbackPolicy === 'BLOCK') {
          client.emit('error', {
            message: 'Message blocked: Sharing contact information (phone, email, links) is against platform policy.',
          });
          return;
        }
      }

      const contentToSave = (scanResult.hasFlaggedContent && (fallbackPolicy === 'ALLOW' || fallbackPolicy === 'WARN'))
        ? scanResult.contentRaw
        : scanResult.contentSanitized;

      const fallbackPayload = {
        id: `msg-${Date.now()}`,
        leadId: data.leadId,
        sender: { id: userId, firstName: 'User', profilePictureUrl: null },
        content: contentToSave,
        hasFlaggedContent: scanResult.hasFlaggedContent,
        flaggedPatterns: scanResult.hasFlaggedContent ? scanResult.flaggedPatterns : [],
        createdAt: new Date().toISOString(),
      };

      this.server.to(`lead:${data.leadId}`).emit('message_received', fallbackPayload);
    } catch (err) {
      this.logger.error('Error in handleSendMessage', err);
    }

  }

  // ─── Mark as Read ────────────────────────────────────────────────────────
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { leadId: string },
  ) {
    try {
      const userId = client.data?.userId;
      if (!userId || !this.prisma.isDbAvailable()) return;

      await this.prisma.leadMessage.updateMany({
        where: { leadId: data.leadId, senderId: { not: userId }, isRead: false },
        data: { isRead: true, readAt: new Date() },
      }).catch(() => {});
    } catch (err) {
      this.logger.error('Error in handleMarkRead', err);
    }
  }
}
