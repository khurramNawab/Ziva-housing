import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submit a new purchase/rent offer or counter-offer
   */
  async createOffer(
    userId: string,
    role: string,
    dto: { leadId: string; offerAmount: number; validUntil: string; message?: string; parentOfferId?: string },
  ) {
    // 1. Verify lead exists and user is part of the lead
    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.customerId !== userId && lead.ownerId !== userId) {
      throw new ForbiddenException('You must be a participant of this lead to submit offers.');
    }

    const offeredPrice = dto.offerAmount;
    const validUntil = new Date(dto.validUntil);

    // 2. Handle parent offer if it's a counter-offer
    if (dto.parentOfferId) {
      const parent = await this.prisma.offer.findUnique({
        where: { id: dto.parentOfferId },
      });
      if (!parent) throw new NotFoundException('Parent offer not found');
      if (parent.leadId !== dto.leadId) {
        throw new BadRequestException('Parent offer does not belong to this lead');
      }

      // Mark parent offer as COUNTERED and log the counter price
      await this.prisma.offer.update({
        where: { id: dto.parentOfferId },
        data: {
          status: 'COUNTERED',
          counterPrice: offeredPrice,
        },
      });
    }

    // 3. Create the new offer
    const offer = await this.prisma.offer.create({
      data: {
        leadId: dto.leadId,
        propertyId: lead.propertyId,
        customerId: lead.customerId,
        offerAmount: offeredPrice,
        validUntil,
        status: 'PENDING',
        createdByRole: role,
        parentOfferId: dto.parentOfferId || null,
        message: dto.message,
      },
    });

    // 4. Update lead status to NEGOTIATION (with status history log)
    const oldStatus = lead.status;
    if (!['NEGOTIATION', 'BOOKING', 'COMPLETED', 'LOST'].includes(oldStatus)) {
      await this.prisma.$transaction([
        this.prisma.lead.update({
          where: { id: lead.id },
          data: { status: 'NEGOTIATION' },
        }),
        this.prisma.leadStatusHistory.create({
          data: {
            leadId: lead.id,
            oldStatus,
            newStatus: 'NEGOTIATION',
            changedById: userId,
            reason: 'Offer / counter-offer submitted.',
          },
        }),
      ]);
    }

    // 5. Inject timeline system message into chat
    const label = dto.parentOfferId ? 'Counter-Offer' : 'Offer';
    const senderName = role === 'OWNER' ? 'Owner' : 'Customer';
    const msgText = `[${label} Submitted by ${senderName}] Amount: ₹ ${Number(offeredPrice).toLocaleString('en-IN')}. Valid until: ${validUntil.toLocaleDateString()}. Notes: ${dto.message || 'None.'}`;

    await this.prisma.leadMessage.create({
      data: {
        leadId: lead.id,
        senderId: userId,
        contentRaw: msgText,
        contentSanitized: msgText,
      },
    });

    return offer;
  }

  /**
   * Get negotiation offers log for a lead
   */
  async getOffersByLead(userId: string, leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.customerId !== userId && lead.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.offer.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Accept an offer
   */
  async acceptOffer(userId: string, offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { lead: true },
    });

    if (!offer) throw new NotFoundException('Offer not found');
    
    // Check rights: usually owner accepts customer offer, customer accepts owner counter-offer
    if (offer.lead.ownerId !== userId && offer.lead.customerId !== userId) {
      throw new ForbiddenException('Only participants of this lead can respond to offers.');
    }

    // Update status to ACCEPTED
    const updatedOffer = await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        isAccepted: true,
        isRejected: false,
      },
    });

    // Mark other pending/countered offers for this lead as REJECTED
    await this.prisma.offer.updateMany({
      where: {
        leadId: offer.leadId,
        id: { not: offerId },
        isAccepted: false,
      },
      data: {
        isRejected: true,
        isAccepted: false,
      },
    });

    // Advance Lead to BOOKING stage
    await this.prisma.lead.update({
      where: { id: offer.leadId },
      data: { status: 'BOOKING' },
    });

    // Send chat system message
    const msgText = `[Offer Accepted] The offer of ₹ ${Number(offer.offerAmount).toLocaleString('en-IN')} has been accepted. Moving to Booking phase.`;
    await this.prisma.leadMessage.create({
      data: {
        leadId: offer.leadId,
        senderId: userId,
        contentRaw: msgText,
        contentSanitized: msgText,
      },
    });

    return updatedOffer;
  }

  /**
   * Reject an offer
   */
  async rejectOffer(userId: string, offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { lead: true },
    });

    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.lead.ownerId !== userId && offer.lead.customerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedOffer = await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        isRejected: true,
        isAccepted: false,
      },
    });

    // Send chat message
    const msgText = `[Offer Rejected] The offer of ₹ ${Number(offer.offerAmount).toLocaleString('en-IN')} has been rejected.`;
    await this.prisma.leadMessage.create({
      data: {
        leadId: offer.leadId,
        senderId: userId,
        contentRaw: msgText,
        contentSanitized: msgText,
      },
    });

    return updatedOffer;
  }
}
