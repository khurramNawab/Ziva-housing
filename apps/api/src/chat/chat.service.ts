import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(leadId: string, userId: string, page = 1, limit = 50) {
    // Verify user is part of lead
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        OR: [{ customerId: userId }, { ownerId: userId }],
      },
    });
    if (!lead) return null;

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
  }
}
