import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Lazy-load Razorpay only if keys configured
    const keyId = config.get('RAZORPAY_KEY_ID');
    const keySecret = config.get('RAZORPAY_KEY_SECRET');
    if (keyId && keySecret) {
      const Razorpay = require('razorpay');
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  // ─── Generate Transaction ID ───────────────────────────────────────────────
  // Format: JVH-PAY-{YYYYMMDD}-{SEQ_5DIGITS}
  private async generateTransactionId(): Promise<string> {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = await this.prisma.$transaction(async (tx) => {
      const record = await tx.transactionSequence.upsert({
        where: { date },
        update: { lastSeq: { increment: 1 } },
        create: { date, lastSeq: 1 },
      });
      return record.lastSeq;
    });
    return `JVH-PAY-${date}-${String(seq).padStart(5, '0')}`;
  }

  // ─── Commission Calculator ────────────────────────────────────────────────
  async calculateCommission(
    amount: number,
    applicableTo: 'PROPERTY_SELL' | 'PROPERTY_RENT' | 'SERVICE_BOOKING',
  ) {
    const rule = await this.prisma.commissionRule.findFirst({
      where: { applicableTo, isActive: true },
    });
    if (!rule) throw new BadRequestException('No commission rule found');

    const commissionAmount =
      rule.type === 'PERCENTAGE'
        ? (amount * Number(rule.rate)) / 100
        : Number(rule.rate);

    const gstRate = Number(this.config.get('GST_RATE', 18));
    const gstAmount = (commissionAmount * gstRate) / 100;
    const netPayoutAmount = amount - commissionAmount - gstAmount;

    return {
      grossAmount: amount,
      commissionRate: Number(rule.rate),
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      netPayoutAmount: Math.round(netPayoutAmount * 100) / 100,
      ruleId: rule.id,
    };
  }

  // ─── Create Payment Order ─────────────────────────────────────────────────
  async createOrder(leadId: string, customerId: string, amount: number) {
    const txnId = await this.generateTransactionId();

    let gatewayOrderId: string | null = null;
    if (this.razorpay) {
      const order = await this.razorpay.orders.create({
        amount: Math.round(amount * 100), // Razorpay uses paise
        currency: 'INR',
        receipt: txnId,
        notes: { leadId, txnId },
      });
      gatewayOrderId = order.id;
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        id: txnId,
        leadId,
        amount,
        gatewayOrderId,
        status: 'CREATED',
      },
    });

    return {
      transactionId: txnId,
      razorpayOrderId: gatewayOrderId,
      amount,
      currency: 'INR',
      keyId: this.config.get('RAZORPAY_KEY_ID'),
    };
  }

  // ─── Webhook Handler ──────────────────────────────────────────────────────
  async handleWebhook(payload: string, signature: string) {
    const secret = this.config.get('RAZORPAY_WEBHOOK_SECRET');
    if (secret) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      if (expectedSignature !== signature) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const event = JSON.parse(payload);
    if (event.event === 'payment.captured') {
      await this.handlePaymentSuccess(event.payload.payment.entity);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(payment: any) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { gatewayOrderId: payment.order_id },
    });
    if (!transaction) return;

    // Mark transaction as success
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        gatewayPaymentId: payment.id,
        gatewaySignature: payment.signature,
        status: 'SUCCESS',
      },
    });

    // Auto-calculate commission
    const applicableTo = transaction.leadId ? 'PROPERTY_SELL' : 'SERVICE_BOOKING';
    const commission = await this.calculateCommission(
      Number(transaction.amount),
      applicableTo,
    );

    const rule = await this.prisma.commissionRule.findFirst({
      where: { applicableTo, isActive: true },
    });

    await this.prisma.commission.create({
      data: {
        transactionId: transaction.id,
        ruleId: rule!.id,
        grossAmount: commission.grossAmount,
        commissionAmount: commission.commissionAmount,
        gstAmount: commission.gstAmount,
        netPayoutAmount: commission.netPayoutAmount,
      },
    });

    // Generate invoice number
    const invoiceSeq = await this.prisma.invoice.count() + 1;
    const invoiceNumber = `JVH-INV-${new Date().getFullYear()}-${String(invoiceSeq).padStart(6, '0')}`;

    await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        transactionId: transaction.id,
        recipientId: payment.contact || 'unknown',
        totalAmount: commission.grossAmount,
        commissionAmount: commission.commissionAmount,
        gstAmount: commission.gstAmount,
      },
    });
  }

  async mockPaymentSuccess(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new BadRequestException('Transaction not found');

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'SUCCESS',
        gatewayPaymentId: `mock-pay-${crypto.randomUUID()}`,
      },
    });

    const applicableTo = transaction.leadId ? 'PROPERTY_SELL' : 'SERVICE_BOOKING';
    const commission = await this.calculateCommission(
      Number(transaction.amount),
      applicableTo,
    );

    const rule = await this.prisma.commissionRule.findFirst({
      where: { applicableTo, isActive: true },
    });

    if (rule) {
      await this.prisma.commission.create({
        data: {
          transactionId: transaction.id,
          ruleId: rule.id,
          grossAmount: commission.grossAmount,
          commissionAmount: commission.commissionAmount,
          gstAmount: commission.gstAmount,
          netPayoutAmount: commission.netPayoutAmount,
        },
      });
    }

    const invoiceSeq = await this.prisma.invoice.count() + 1;
    const invoiceNumber = `JVH-INV-${new Date().getFullYear()}-${String(invoiceSeq).padStart(6, '0')}`;

    await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        transactionId: transaction.id,
        recipientId: 'mock-recipient',
        totalAmount: commission.grossAmount,
        commissionAmount: commission.commissionAmount,
        gstAmount: commission.gstAmount,
      },
    });

    return { success: true };
  }

  async getTransactions(userId: string) {
    // Get leads for this user first, then find related transactions
    const leads = await this.prisma.lead.findMany({
      where: { OR: [{ customerId: userId }, { ownerId: userId }] },
      select: { id: true },
    });
    const leadIds = leads.map((l) => l.id);

    return this.prisma.transaction.findMany({
      where: { leadId: { in: leadIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
