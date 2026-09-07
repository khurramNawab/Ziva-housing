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

@WebSocketGateway({
  cors: {
    origin: process.env.APP_URL || 'http://localhost:3000',
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
    const userId = client.data.userId;
    if (!userId) return;

    // Verify user is part of this lead
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: data.leadId,
        OR: [{ customerId: userId }, { ownerId: userId }],
      },
    });

    if (!lead) {
      client.emit('error', { message: 'Lead not found or unauthorized' });
      return;
    }

    await client.join(`lead:${data.leadId}`);
    client.emit('joined_lead', { leadId: data.leadId });

    // Mark messages as read
    await this.prisma.leadMessage.updateMany({
      where: { leadId: data.leadId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // ─── Send Message ────────────────────────────────────────────────────────
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { leadId: string; content: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Validate lead access
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: data.leadId,
        OR: [{ customerId: userId }, { ownerId: userId }],
      },
    });

    if (!lead) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    if (!data.content?.trim()) {
      client.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    // ─── Enforce Terms-Acceptance Gate ───────────────────────────────────
    const hasAccepted = await this.prisma.termsAcceptance.findUnique({
      where: { userId_version: { userId, version: 'v1.0' } },
    });
    if (!hasAccepted) {
      client.emit('error', { message: 'Terms acceptance required. Please accept lead/commission terms.' });
      return;
    }

    // ─── CORE: Scan message for contact info ─────────────────────────────
    const scanResult = this.scanner.scan(data.content.trim());

    let policy = 'MASK';
    if (scanResult.hasFlaggedContent) {
      const policySetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'bypassPolicy' },
      });
      policy = policySetting?.value || 'MASK';

      // Log the bypass incident
      await this.prisma.bypassIncident.create({
        data: {
          leadId: data.leadId,
          senderId: userId,
          messageRaw: scanResult.contentRaw,
          detectedPatterns: scanResult.flaggedPatterns as any,
          policyApplied: policy,
        },
      });

      // Push alert to Admin Alerts
      await this.prisma.adminAlert.create({
        data: {
          type: 'CONTACT_INFO_SHARING',
          severity: policy === 'BLOCK' ? 'HIGH' : 'MEDIUM',
          details: `User ${userId} attempted to share contact info in lead ${data.leadId}. Policy: ${policy}. Message: ${scanResult.contentRaw}`,
          entityType: 'Lead',
          entityId: data.leadId,
        },
      });

      if (policy === 'BLOCK') {
        client.emit('error', {
          message: 'Message blocked: Sharing contact information (phone, email, links) is against platform policy.',
        });
        return;
      }
    }

    const contentToSave = (scanResult.hasFlaggedContent && policy === 'WARN')
      ? scanResult.contentRaw
      : scanResult.contentSanitized;

    // Store message with both raw (admin) and sanitized (users) versions
    const message = await this.prisma.leadMessage.create({
      data: {
        leadId: data.leadId,
        senderId: userId,
        contentRaw: scanResult.contentRaw,       // Admin sees original
        contentSanitized: contentToSave,         // Users see processed
        hasFlaggedContent: scanResult.hasFlaggedContent,
        flaggedPatterns: scanResult.flaggedPatterns as any,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, profilePictureUrl: true },
        },
      },
    });

    // Update lead status to CONTACTED if still NEW
    if (lead.status === 'NEW') {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'CONTACTED' },
      });
    }

    // Determine recipient
    const recipientId = lead.customerId === userId ? lead.ownerId : lead.customerId;

    // Broadcast sanitized message to lead room
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

    // Notify sender of flagging (extra UI warning)
    if (scanResult.hasFlaggedContent) {
      client.emit('message_flagged', {
        messageId: message.id,
        reason:
          policy === 'WARN'
            ? 'Warning: Your message contained contact information. Please note that sharing contact info outside the platform is against our terms.'
            : 'Your message contained contact information that has been masked for platform policy compliance.',
        patterns: scanResult.flaggedPatterns.map((p) => p.type),
      });
    }

    // Push notification to recipient (async)
    this.notifications
      .sendNotification({
        userId: recipientId,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        body: scanResult.hasFlaggedContent && policy === 'MASK'
          ? 'You have a new message (some content was filtered)'
          : `New message: ${contentToSave.substring(0, 80)}`,
        payload: { leadId: data.leadId, messageId: message.id },
      })
      .catch((e) => this.logger.error('Notification failed', e));
  }

  // ─── Mark as Read ────────────────────────────────────────────────────────
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { leadId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.prisma.leadMessage.updateMany({
      where: { leadId: data.leadId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
