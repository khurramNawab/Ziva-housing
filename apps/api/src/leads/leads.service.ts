import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { FraudDetectorService } from '../common/services/fraud-detector.service';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private fraudDetector: FraudDetectorService,
  ) { }

  // ─── Generate Lead ID ─────────────────────────────────────────────────────
  // Format: JVH-{CITY_3CHARS}-{YEAR}-{SEQ_5DIGITS}
  // Example: JVH-MUM-2024-00001
  private async generateLeadId(city: string): Promise<string> {
    const cityCode = city.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3).padEnd(3, 'X');
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
    return `JVH-${cityCode}-${year}-${sequence}`;
  }

  // ─── Create Lead ("Contact Owner") ───────────────────────────────────────
  async create(customerId: string, dto: CreateLeadDto) {
    // Enforce spam enquiry rate limiting
    const isSpam = await this.fraudDetector.checkSpamEnquiries(customerId);
    if (isSpam) {
      throw new ForbiddenException('Spam detected. You have exceeded the limit of 5 property enquiries per 10 minutes.');
    }

    // Auto-record terms acceptance if not present
    const hasAccepted = await this.prisma.termsAcceptance.findUnique({
      where: { userId_version: { userId: customerId, version: 'v1.0' } },
    });
    if (!hasAccepted) {
      await this.prisma.termsAcceptance.create({
        data: { userId: customerId, version: 'v1.0' },
      }).catch(() => null);
    }

    let property = dto.propertyId
      ? await this.prisma.property.findUnique({
          where: { id: dto.propertyId },
          include: { ownerProfile: { include: { user: true } } },
        })
      : null;

    if (!property) {
      // Fallback to first active property for developer projects/demo
      property = await this.prisma.property.findFirst({
        where: { status: 'ACTIVE', deletedAt: null },
        include: { ownerProfile: { include: { user: true } } },
      });
    }

    if (!property) {
      throw new NotFoundException('No active property found for this enquiry');
    }

    // Prevent owner from contacting their own property
    if (property.ownerProfile.userId === customerId) {
      throw new ForbiddenException('You cannot enquire on your own property');
    }

    // Check for existing lead
    const existing = await this.prisma.lead.findUnique({
      where: { propertyId_customerId: { propertyId: property.id, customerId } },
    });
    if (existing) {
      return { lead: existing, isExisting: true };
    }

    // Generate unique lead ID
    const leadId = await this.generateLeadId(property.city);

    const lead = await this.prisma.lead.create({
      data: {
        id: leadId,
        propertyId: dto.propertyId,
        customerId,
        ownerId: property.ownerProfile.userId,
        notes: dto.message,
      },
    });

    // Increment property enquiry count
    await this.prisma.property.update({
      where: { id: dto.propertyId },
      data: { enquiryCount: { increment: 1 } },
    });

    // Notify property owner
    await this.notifications.sendNotification({
      userId: property.ownerProfile.userId,
      type: 'ENQUIRY_CREATED',
      title: 'New Enquiry Received',
      body: `You have a new enquiry for your property: ${property.title}`,
      payload: { leadId, propertyId: property.id },
    });

    return { lead, isExisting: false };
  }

  // ─── Get Leads (customer or owner view) ───────────────────────────────────
  async findAll(userId: string, role: string, page = 1, limit = 20) {
    const where =
      role === 'OWNER'
        ? { ownerId: userId }
        : { customerId: userId };

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          status: true,
          customerId: true,
          createdAt: true,
          updatedAt: true,
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              locality: true,
              purpose: true,
              photos: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true, thumbnailUrl: true },
              },
              // NEVER expose owner contact info
              ownerProfile: {
                select: {
                  user: {
                    select: { id: true, firstName: true },
                  },
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { contentSanitized: true, createdAt: true },
          },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      leads: leads.map((l) => this.sanitizeLeadResponse(l, userId, role)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Get Lead Detail ───────────────────────────────────────────────────────
  async findOne(leadId: string, userId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        OR: [{ customerId: userId }, { ownerId: userId }],
      },
      select: {
        id: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
        closedReason: true,
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            city: true,
            locality: true,
            state: true,
            purpose: true,
            propertyType: true,
            bhk: true,
            bathrooms: true,
            builtUpArea: true,
            expectedPrice: true,
            monthlyRent: true,
            furnishing: true,
            photos: {
              orderBy: { order: 'asc' },
              select: { url: true, thumbnailUrl: true, isPrimary: true, caption: true },
            },
            amenities: {
              select: { amenity: { select: { name: true, category: true } } },
            },
            isZivaVerified: true,
            status: true,
            // NOTE: ownerProfile phone/email NEVER included here
            ownerProfile: {
              select: {
                user: {
                  select: { id: true, firstName: true, profilePictureUrl: true },
                },
              },
            },
          },
        },
        visits: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        offers: {
          select: {
            id: true,
            offerAmount: true,
            validUntil: true,
            isAccepted: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        customer: {
          select: { id: true, firstName: true, profilePictureUrl: true },
        },
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  // ─── Update Lead Status ────────────────────────────────────────────────────
  async updateStatus(leadId: string, userId: string, dto: UpdateLeadStatusDto) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        OR: [{ customerId: userId }, { ownerId: userId }],
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    return this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: dto.status as any,
        closedAt: ['COMPLETED', 'LOST'].includes(dto.status) ? new Date() : undefined,
        closedReason: dto.reason,
      },
    });
  }

  // ─── Helper: Sanitize Lead Response ───────────────────────────────────────
  // Strips sensitive counterparty data depending on viewer role
  private sanitizeLeadResponse(lead: any, viewerId: string, role: string) {
    const isCustomer = lead.customerId === viewerId || role === 'CUSTOMER';
    const ownerUser = lead.property?.ownerProfile?.user;
    const customerUser = lead.customer;

    return {
      ...lead,
      // Only show first name + last initial for counterparty
      counterparty: isCustomer
        ? {
          id: ownerUser?.id,
          firstName: ownerUser?.firstName,
          lastInitial: '', // Owners don't show last name until deal progresses
        }
        : {
          id: customerUser?.id,
          firstName: customerUser?.firstName,
          lastInitial: '',
        },
      lastMessage: lead.messages?.[0] || null,
      messageCount: lead._count?.messages || 0,
    };
  }
}
