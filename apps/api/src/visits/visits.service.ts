import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VisitsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async requestVisit(customerId: string, data: {
    leadId?: string;
    propertyId?: string;
    scheduledAt: string;
    notes?: string;
  }) {
    let lead;
    if (data.leadId) {
      lead = await this.prisma.lead.findFirst({
        where: { id: data.leadId, customerId },
      });
    }

    if (!lead) {
      let property = data.propertyId
        ? await this.prisma.property.findUnique({
            where: { id: data.propertyId },
            include: { ownerProfile: true },
          })
        : null;

      if (!property) {
        property = await this.prisma.property.findFirst({
          where: { status: 'ACTIVE', deletedAt: null },
          include: { ownerProfile: true },
        });
      }

      if (!property) {
        property = await this.prisma.property.findFirst({
          include: { ownerProfile: true },
        });
      }

      if (!property) throw new NotFoundException('Property not found');

      // Find existing or create new lead
      lead = await this.prisma.lead.findFirst({
        where: { propertyId: property.id, customerId },
      });

      if (!lead) {
        const cityCode = property.city ? property.city.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3).padEnd(3, 'X') : 'BLR';
        const year = new Date().getFullYear();
        const seq = await this.prisma.$transaction(async (tx) => {
          const record = await tx.leadSequence.upsert({
            where: { cityCode_year: { cityCode, year } },
            update: { lastSeq: { increment: 1 } },
            create: { cityCode, year, lastSeq: 1 },
          });
          return record.lastSeq;
        });
        const sequence = String(seq).padStart(5, '0');
        const leadId = `JVH-${cityCode}-${year}-${sequence}`;

        lead = await this.prisma.lead.create({
          data: {
            id: leadId,
            propertyId: property.id,
            customerId,
            ownerId: property.ownerProfile?.userId || customerId,
            status: 'NEW',
          },
        });
      }
    } else {
      throw new BadRequestException('Either leadId or propertyId must be provided');
    }

    const scheduledAt = new Date(data.scheduledAt);
    if (scheduledAt < new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const visit = await this.prisma.propertyVisit.create({
      data: {
        leadId: lead.id,
        propertyId: lead.propertyId,
        customerId,
        ownerId: lead.ownerId,
        scheduledAt,
        notes: data.notes,
        status: 'REQUESTED',
      },
    });

    // Update lead status
    await this.prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'VISIT_SCHEDULED' },
    });

    // Notify owner
    await this.notifications.sendNotification({
      userId: lead.ownerId,
      type: 'VISIT_REQUESTED',
      title: 'Visit Requested',
      body: `A customer has requested a visit on ${scheduledAt.toLocaleDateString('en-IN')}`,
      payload: { visitId: visit.id, leadId: lead.id },
    });

    return visit;
  }

  async respondToVisit(
    visitId: string,
    ownerId: string,
    action: 'ACCEPTED' | 'REJECTED',
    reason?: string,
  ) {
    const visit = await this.prisma.propertyVisit.findFirst({
      where: { id: visitId, ownerId },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.status !== 'REQUESTED') {
      throw new BadRequestException('Visit is no longer in REQUESTED state');
    }

    const updated = await this.prisma.propertyVisit.update({
      where: { id: visitId },
      data: {
        status: action,
        rejectionReason: action === 'REJECTED' ? reason : undefined,
      },
    });

    await this.notifications.sendNotification({
      userId: visit.customerId,
      type: action === 'ACCEPTED' ? 'VISIT_ACCEPTED' : 'VISIT_REJECTED',
      title: action === 'ACCEPTED' ? 'Visit Confirmed!' : 'Visit Request Declined',
      body:
        action === 'ACCEPTED'
          ? `Your visit on ${visit.scheduledAt.toLocaleDateString('en-IN')} has been confirmed.`
          : `Your visit request was declined. Reason: ${reason || 'Not specified'}`,
      payload: { visitId, leadId: visit.leadId },
    });

    return updated;
  }

  async getMyVisits(userId: string, role: string) {
    const where =
      role === 'OWNER' ? { ownerId: userId } : { customerId: userId };

    return this.prisma.propertyVisit.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            locality: true,
            photos: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
      },
    });
  }

  async completeVisit(visitId: string, userId: string) {
    const visit = await this.prisma.propertyVisit.findFirst({
      where: {
        id: visitId,
        status: 'ACCEPTED',
        OR: [{ customerId: userId }, { ownerId: userId }],
      },
    });
    if (!visit) throw new NotFoundException('Visit not found or not accepted');

    return this.prisma.propertyVisit.update({
      where: { id: visitId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async rescheduleVisit(visitId: string, newTimeStr: string, userId: string) {
    const visit = await this.prisma.propertyVisit.findFirst({
      where: {
        id: visitId,
        OR: [{ customerId: userId }, { ownerId: userId }],
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');

    const scheduledAt = new Date(newTimeStr);
    if (scheduledAt < new Date()) {
      throw new BadRequestException('Rescheduled time must be in the future');
    }

    const updated = await this.prisma.propertyVisit.update({
      where: { id: visitId },
      data: {
        scheduledAt,
        status: 'REQUESTED',
        rejectionReason: null,
      },
    });

    const recipientId = visit.customerId === userId ? visit.ownerId : visit.customerId;
    await this.notifications.sendNotification({
      userId: recipientId,
      type: 'VISIT_REQUESTED',
      title: 'Visit Rescheduled',
      body: `A visit has been rescheduled to ${scheduledAt.toLocaleDateString('en-IN')} at ${scheduledAt.toLocaleTimeString('en-IN')}`,
      payload: { visitId, leadId: visit.leadId },
    });

    return updated;
  }

  async cancelVisit(visitId: string, userId: string) {
    const visit = await this.prisma.propertyVisit.findFirst({
      where: {
        id: visitId,
        OR: [{ customerId: userId }, { ownerId: userId }],
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');

    const updated = await this.prisma.propertyVisit.update({
      where: { id: visitId },
      data: { status: 'CANCELLED' },
    });

    const recipientId = visit.customerId === userId ? visit.ownerId : visit.customerId;
    await this.notifications.sendNotification({
      userId: recipientId,
      type: 'VISIT_REJECTED',
      title: 'Visit Cancelled',
      body: `The visit scheduled for ${visit.scheduledAt.toLocaleDateString('en-IN')} has been cancelled.`,
      payload: { visitId, leadId: visit.leadId },
    });

    return updated;
  }
}
