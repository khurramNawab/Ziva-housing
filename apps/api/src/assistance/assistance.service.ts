import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssistanceService {
  constructor(private prisma: PrismaService) {}

  async applyAssistance(
    userId: string,
    dto: { leadId: string; type: 'HOME_LOAN' | 'LEGAL_ASSISTANCE'; notes?: string },
  ) {
    // 1. Verify lead exists and user is part of the lead
    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
    });
    if (!lead) throw new BadRequestException('Lead negotiation room not found');

    if (lead.customerId !== userId && lead.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this lead');
    }

    const typeLabel = dto.type === 'HOME_LOAN' ? 'Home Loan Assistance' : 'Legal Verification Assistance';

    // 2. Inject system notice message inside lead's chat thread
    await this.prisma.leadMessage.create({
      data: {
        leadId: dto.leadId,
        senderId: userId, // Record request trace
        contentRaw: `[Assistance Requested] Applied for: ${typeLabel}. Notes: ${dto.notes || 'No extra requirements specified.'}`,
        contentSanitized: `[Assistance Requested] Applied for: ${typeLabel}. Notes: ${dto.notes || 'No extra requirements specified.'}`,
      },
    });

    return { success: true, message: `Application for ${typeLabel} recorded in chat thread.` };
  }

  // ─── Support Tickets API ───────────────────────────────────────────────────
  async createTicket(
    userId: string,
    dto: { subject: string; description: string; category: string; priority?: string },
  ) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        description: dto.description,
        category: dto.category,
        priority: dto.priority || 'LOW',
        status: 'OPEN',
      },
    });
  }

  async getTickets(userId: string, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.supportTicket.findMany({
        include: { user: { select: { firstName: true, lastName: true, phone: true } } },
        orderBy: { updatedAt: 'desc' },
      });
    }
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getTicketDetails(ticketId: string, userId: string, role: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        messages: {
          include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Support ticket not found');

    if (role !== 'ADMIN' && ticket.userId !== userId) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    return ticket;
  }

  async addMessage(ticketId: string, userId: string, role: string, message: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Support ticket not found');

    if (role !== 'ADMIN' && ticket.userId !== userId) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    const [supportMessage] = await this.prisma.$transaction([
      this.prisma.supportMessage.create({
        data: {
          ticketId,
          senderId: userId,
          message,
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      }),
      this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return supportMessage;
  }

  async updateTicketStatus(ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED', userId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Support ticket not found');

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() },
    });
  }
}
