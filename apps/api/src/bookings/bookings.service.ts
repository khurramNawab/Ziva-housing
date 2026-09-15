import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
    private notifications: NotificationsService,
  ) {}

  // Generate booking reference: ZIVA-BKG-{YYYYMMDD}-{SEQ}
  private async generateBookingRef(): Promise<string> {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.propertyBooking.count();
    return `ZIVA-BKG-${date}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * POST /bookings
   * Create a property booking after offer acceptance.
   * Integrates with existing PaymentsService for Razorpay order creation.
   */
  async createBooking(
    buyerId: string,
    dto: {
      propertyId: string;
      offerId?: string;
      agreedPrice: number;
      tokenAmount: number;
      notes?: string;
    },
  ) {
    // 1. Validate property exists and is active
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: { ownerProfile: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== 'ACTIVE') {
      throw new BadRequestException('Property is not available for booking');
    }

    // 2. If offerId provided, verify it's accepted and belongs to this buyer
    if (dto.offerId) {
      const offer = await this.prisma.offer.findUnique({
        where: { id: dto.offerId },
        include: { lead: true },
      });
      if (!offer) throw new NotFoundException('Offer not found');
      if (offer.lead.customerId !== buyerId) {
        throw new ForbiddenException('Offer does not belong to you');
      }
      if (!offer.isAccepted) {
        throw new BadRequestException('Offer must be accepted before booking');
      }
    }

    // 3. Check no existing active booking for this property+buyer
    const existing = await this.prisma.propertyBooking.findFirst({
      where: {
        propertyId: dto.propertyId,
        buyerId,
        status: { in: ['PENDING_PAYMENT', 'CONFIRMED'] },
      },
    });
    if (existing) {
      throw new BadRequestException('You already have an active booking for this property');
    }

    // 4. Create Razorpay order for token amount via existing PaymentsService
    let gatewayOrderId: string | null = null;
    let transactionId: string | null = null;

    try {
      // Find or create a lead for this property+buyer pairing for the payment record
      const lead = await this.prisma.lead.findFirst({
        where: { propertyId: dto.propertyId, customerId: buyerId },
      });

      if (lead) {
        const orderResult = await this.payments.createOrder(lead.id, buyerId, dto.tokenAmount);
        transactionId = orderResult.transactionId;
        gatewayOrderId = orderResult.razorpayOrderId;
      }
    } catch (e) {
      this.logger.warn(`Payment order creation failed: ${e.message} — booking still created in PENDING_PAYMENT state`);
    }

    // 5. Create the PropertyBooking record
    const bookingRef = await this.generateBookingRef();
    const sellerId = property.ownerProfile.userId;

    const booking = await this.prisma.propertyBooking.create({
      data: {
        bookingRef,
        propertyId: dto.propertyId,
        buyerId,
        sellerId,
        agreedPrice: dto.agreedPrice,
        tokenAmount: dto.tokenAmount,
        status: 'PENDING_PAYMENT',
        offerId: dto.offerId || null,
        transactionId: transactionId || null,
        notes: dto.notes,
      },
      include: {
        property: { select: { title: true, locality: true, city: true } },
        buyer: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    // 6. Notify seller
    try {
      await this.notifications.sendNotification({
        userId: sellerId,
        type: 'BOOKING_CONFIRMED',
        title: 'Property Booking Request',
        body: `${booking.buyer.firstName} has initiated a booking for "${booking.property.title}". Booking ref: ${bookingRef}`,
      });
    } catch (e) {
      this.logger.warn(`Notification failed: ${e.message}`);
    }

    return { booking, gatewayOrderId };
  }

  /**
   * GET /bookings/my
   * Get all bookings for current user (as buyer or seller)
   */
  async getMyBookings(userId: string) {
    const [asBuyer, asSeller] = await Promise.all([
      this.prisma.propertyBooking.findMany({
        where: { buyerId: userId },
        include: {
          property: { select: { title: true, locality: true, city: true, photos: { where: { isPrimary: true }, take: 1 } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.propertyBooking.findMany({
        where: { sellerId: userId },
        include: {
          property: { select: { title: true, locality: true, city: true } },
          buyer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { asBuyer, asSeller };
  }

  /**
   * GET /bookings/:id
   */
  async getBookingById(userId: string, id: string) {
    const booking = await this.prisma.propertyBooking.findUnique({
      where: { id },
      include: {
        property: { select: { title: true, locality: true, city: true, state: true } },
        buyer: { select: { firstName: true, lastName: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.buyerId !== userId && booking.sellerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return booking;
  }

  /**
   * PATCH /bookings/:id/confirm
   * Confirm booking after verified payment success (called from webhook or seller after payment)
   */
  async confirmBooking(userId: string, id: string) {
    const booking = await this.prisma.propertyBooking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.sellerId !== userId) {
      throw new ForbiddenException('Only the seller can confirm a booking');
    }
    if (booking.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(`Booking is in ${booking.status} state, cannot confirm`);
    }

    // MANDATORY SECURITY GATE: Verify payment transaction actually succeeded
    if (!booking.transactionId) {
      throw new BadRequestException(
        'Cannot confirm booking: No payment transaction record is linked to this booking.',
      );
    }

    const txn = await this.prisma.transaction.findUnique({
      where: { id: booking.transactionId },
    });

    if (!txn || txn.status !== 'SUCCESS') {
      throw new BadRequestException(
        'Cannot confirm booking: Payment transaction has not been completed successfully or is pending gateway verification.',
      );
    }

    const updated = await this.prisma.propertyBooking.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });

    // Notify buyer
    await this.notifications.sendNotification({
      userId: booking.buyerId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed! 🎉',
      body: `Your booking (${booking.bookingRef}) has been confirmed. Token payment verified.`,
    }).catch(() => {});

    return updated;
  }

  /**
   * PATCH /bookings/:id/cancel
   */
  async cancelBooking(userId: string, id: string, reason?: string) {
    const booking = await this.prisma.propertyBooking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.buyerId !== userId && booking.sellerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (booking.status === 'CONFIRMED') {
      throw new BadRequestException('Confirmed bookings cannot be cancelled directly. Contact support.');
    }

    return this.prisma.propertyBooking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  }
}
