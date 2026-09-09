import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  async getMessages(leadId: string, userId: string, page = 1, limit = 50) {
    if (!this.prisma.isDbAvailable()) {
      return { messages: [], total: 0, page, limit };
    }

    try {
      // Verify user is part of lead
      const lead = await this.prisma.lead.findFirst({
        where: {
          id: leadId,
          OR: [{ customerId: userId }, { ownerId: userId }],
        },
      });
      if (!lead) return { messages: [], total: 0, page, limit };

      const [messages, total] = await Promise.all([
        this.prisma.leadMessage.findMany({
          where: { leadId, isDeleted: false },
          orderBy: { createdAt: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            leadId: true,
            senderId: true,
            contentSanitized: true, // NEVER return contentRaw to regular users
            hasFlaggedContent: true,
            isRead: true,
            readAt: true,
            createdAt: true,
            sender: {
              select: { id: true, firstName: true, profilePictureUrl: true },
            },
          },
        }),
        this.prisma.leadMessage.count({ where: { leadId } }),
      ]);

      return { messages, total, page, limit };
    } catch (err: any) {
      this.logger.warn(`Remote DB unreachable in getMessages: ${err?.message}`);
      return { messages: [], total: 0, page, limit };
    }
  }
}
