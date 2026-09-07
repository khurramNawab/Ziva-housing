import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // Reviews can ONLY be created from verified completed interactions
  async createReview(reviewerId: string, data: {
    leadId?: string;
    serviceBookingId?: string;
    reviewedUserId?: string;
    targetType: string;
    rating: number;
    comment?: string;
  }) {
    if (!data.leadId && !data.serviceBookingId) {
      throw new BadRequestException('Review requires a lead or service booking ID');
    }

    // Verify the interaction is COMPLETED
    if (data.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: data.leadId, customerId: reviewerId, status: 'COMPLETED' },
      });
      if (!lead) {
        throw new ForbiddenException('You can only review after a completed lead interaction');
      }
    }

    if (data.serviceBookingId) {
      const booking = await this.prisma.serviceBooking.findFirst({
        where: { id: data.serviceBookingId, customerId: reviewerId, status: 'COMPLETED' },
      });
      if (!booking) {
        throw new ForbiddenException('You can only review after a completed service booking');
      }
    }

    return this.prisma.review.create({
      data: {
        reviewerId,
        reviewedUserId: data.reviewedUserId,
        targetType: data.targetType as any,
        leadId: data.leadId,
        serviceBookingId: data.serviceBookingId,
        rating: data.rating,
        comment: data.comment,
        isVerified: true, // Interaction was verified above
      },
    });
  }
}
