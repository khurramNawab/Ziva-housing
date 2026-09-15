import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class PayoutsService implements OnModuleInit {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private payments: PaymentsService,
  ) {}

  async onModuleInit() {
    if (this.prisma.isDbAvailable()) {
      await this.seedPremiumPlans().catch((err) => {
        this.logger.warn(`Could not seed premium plans on init: ${err?.message}`);
      });
    }
  }

  /**
   * GET /payouts/my/earnings
   * Earnings summary for a provider or agent
   * Returns: total earned, pending payouts, completed payouts, recent history
   */
  async getEarningsSummary(userId: string) {
    const allPayouts = await this.prisma.payout.findMany({
      where: { userId },
      include: {
        commission: {
          include: {
            transaction: { select: { id: true, leadId: true, serviceBookingId: true, createdAt: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = allPayouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pending = allPayouts
      .filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const onHold = allPayouts
      .filter((p) => p.status === 'ON_HOLD')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalEarned: total,
      pendingPayout: pending,
      onHoldAmount: onHold,
      payoutCount: allPayouts.length,
      recentPayouts: allPayouts.slice(0, 10),
    };
  }

  /**
   * GET /payouts/admin/pending
   * Admin: get all pending payouts
   */
  async getPendingPayouts() {
    return this.prisma.payout.findMany({
      where: { status: { in: ['PENDING', 'PROCESSING'] } },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        commission: { include: { transaction: { select: { amount: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * PATCH /payouts/:id/process
   * Admin: mark payout as processed
   */
  async processPayout(adminId: string, payoutId: string, gatewayRef?: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { user: true },
    });
    if (!payout) throw new NotFoundException('Payout not found');

    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'COMPLETED',
        gatewayRef,
        processedAt: new Date(),
        notes: `Processed by admin ${adminId}`,
      },
    });

    // Notify user
    await this.notifications.sendNotification({
      userId: payout.userId,
      type: 'PAYOUT_PROCESSED',
      title: '💰 Payout Processed',
      body: `₹${Number(payout.amount).toLocaleString('en-IN')} has been transferred to your bank account.`,
    }).catch(() => {});

    return updated;
  }

  /**
   * Premium Listings — GET /premium/plans
   * Get available premium listing plans
   */
  async getPremiumPlans() {
    return this.prisma.premiumListingPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * POST /premium/subscribe
   * Subscribe a property to a premium plan via payment gateway
   */
  async subscribePropertyToPremium(
    userId: string,
    dto: { propertyId: string; planId: string },
  ) {
    const plan = await this.prisma.premiumListingPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Premium plan not found');

    // Check property belongs to user
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: { ownerProfile: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerProfile.userId !== userId) {
      throw new NotFoundException('Property not found for this user');
    }

    // 1. Create Razorpay Payment Order via PaymentsService
    const order = await this.payments.createPremiumOrder(
      userId,
      dto.propertyId,
      dto.planId,
      Number(plan.price),
    );

    // 2. Create pending PropertyPremium entry (activated upon webhook payment confirmation)
    const startsAt = new Date();
    const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

    const premium = await this.prisma.propertyPremium.create({
      data: {
        propertyId: dto.propertyId,
        planId: dto.planId,
        userId,
        startsAt,
        expiresAt,
        isActive: false, // Activated only upon verified gateway payment
        transactionId: order.transactionId,
      },
    });

    return {
      premium,
      paymentOrder: order,
    };
  }

  /**
   * Seed premium plans (called on startup if plans don't exist)
   */
  async seedPremiumPlans() {
    const count = await this.prisma.premiumListingPlan.count();
    if (count > 0) return;

    await this.prisma.premiumListingPlan.createMany({
      data: [
        {
          name: 'Basic',
          price: 999,
          durationDays: 30,
          boostScore: 10,
          features: ['Featured badge', 'Top placement in search', 'Priority support'],
        },
        {
          name: 'Pro',
          price: 1999,
          durationDays: 60,
          boostScore: 25,
          features: ['Featured badge', 'Top placement in search', 'Homepage banner slot', 'Priority support', 'Analytics dashboard'],
        },
        {
          name: 'Elite',
          price: 4999,
          durationDays: 90,
          boostScore: 50,
          features: ['Featured badge', '#1 search placement', 'Homepage banner slot', 'Dedicated account manager', 'Analytics dashboard', 'Social media promotion'],
        },
      ],
    });

    this.logger.log('✅ Premium listing plans seeded');
  }
}
