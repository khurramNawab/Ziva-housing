import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) { }

  private async assertAdmin(adminId: string) {
    if (!adminId) throw new ForbiddenException('Authentication required');
    const user = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!user) throw new ForbiddenException('User not found');
    return user;
  }

  // ─── Properties Pending Review ────────────────────────────────────────────
  async getPendingProperties(adminId: string, page = 1, limit = 20) {
    await this.assertAdmin(adminId);
    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where: { status: 'PENDING_REVIEW', deletedAt: null },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          photos: { take: 3 },
          ownerProfile: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, phone: true, email: true },
              },
            },
          },
          _count: { select: { leads: true } },
        },
      }),
      this.prisma.property.count({ where: { status: 'PENDING_REVIEW' } }),
    ]);
    return { properties, total, page, limit };
  }

  // ─── Approve / Reject Property ────────────────────────────────────────────
  async reviewProperty(
    adminId: string,
    propertyId: string,
    action: 'APPROVE' | 'REJECT',
    data: { adminNotes?: string; rejectionReason?: string },
  ) {
    const admin = await this.assertAdmin(adminId);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const before = { status: property.status, isZivaVerified: property.isZivaVerified };
    const newStatus = action === 'APPROVE' ? 'ACTIVE' : 'REJECTED';

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        status: newStatus as any,
        isZivaVerified: action === 'APPROVE',
        verifiedAt: action === 'APPROVE' ? new Date() : undefined,
        verifiedByAdminId: action === 'APPROVE' ? adminId : undefined,
        adminNotes: data.adminNotes,
        rejectionReason: data.rejectionReason,
      },
    });

    await this.logAction(adminId, action === 'APPROVE' ? 'APPROVE' : 'REJECT', 'Property', propertyId, before, {
      status: newStatus,
      isZivaVerified: action === 'APPROVE',
    });

    return updated;
  }

  // ─── Property Management (All properties list & status updates) ────────────
  async getAllProperties(
    adminId: string,
    page = 1,
    limit = 20,
    search?: string,
    status?: string,
    city?: string,
  ) {
    await this.assertAdmin(adminId);
    const where: any = { deletedAt: null };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status as any;
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          photos: true,
          documents: true,
          ownerProfile: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
            },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return { properties, total, page, limit };
  }

  async setPropertyStatus(adminId: string, propertyId: string, status: string, notes?: string) {
    await this.assertAdmin(adminId);
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const before = { status: property.status };
    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: { status: status as any, adminNotes: notes },
    });

    await this.logAction(adminId, 'UPDATE', 'Property', propertyId, before, { status, notes });
    return updated;
  }

  async deleteProperty(adminId: string, propertyId: string) {
    await this.assertAdmin(adminId);
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const before = { status: property.status, deletedAt: property.deletedAt };
    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: { deletedAt: new Date(), status: 'ARCHIVED' as any },
    });

    await this.logAction(adminId, 'DELETE', 'Property', propertyId, before, { deletedAt: updated.deletedAt, status: 'ARCHIVED' });
    return { success: true };
  }

  // ─── All Leads (CRM view — admin can see full content) ────────────────────
  async getAllLeads(adminId: string, page = 1, limit = 20, filters: {
    status?: string;
    city?: string;
  } = {}) {
    await this.assertAdmin(adminId);

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.city) where.property = { city: { contains: filters.city, mode: 'insensitive' } };

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          property: {
            select: {
              id: true, title: true, city: true, locality: true,
              ownerProfile: { include: { user: { select: { id: true, firstName: true, lastName: true, phone: true } } } },
            },
          },
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          _count: { select: { messages: true, visits: true } },
          messages: {
            where: { hasFlaggedContent: true },
            select: { id: true, contentRaw: true, flaggedPatterns: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { leads, total, page, limit };
  }

  async createLead(adminId: string, data: { propertyId: string; customerId: string; status?: string; notes?: string }) {
    await this.assertAdmin(adminId);

    const property = await this.prisma.property.findUnique({
      where: { id: data.propertyId },
      include: { ownerProfile: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    const customer = await this.prisma.user.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) throw new NotFoundException('Customer user not found');

    const ownerId = property.ownerProfile?.userId || property.ownerProfileId;
    if (!ownerId) throw new BadRequestException('Property does not have a valid owner profile');

    const city = property.city || 'GEN';
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
    const leadId = `JVH-${cityCode}-${year}-${sequence}`;

    const lead = await this.prisma.lead.create({
      data: {
        id: leadId,
        propertyId: data.propertyId,
        customerId: data.customerId,
        ownerId,
        status: (data.status as any) || 'NEW',
        notes: data.notes || 'Created via Admin CRM',
      },
      include: {
        property: {
          select: {
            id: true, title: true, city: true, locality: true,
            ownerProfile: { include: { user: { select: { id: true, firstName: true, lastName: true, phone: true } } } },
          },
        },
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        _count: { select: { messages: true, visits: true } },
      },
    });

    await this.logAction(adminId, 'CREATE', 'Lead', lead.id, null, {
      propertyId: data.propertyId,
      customerId: data.customerId,
      status: lead.status,
    });

    return lead;
  }

  async updateLeadStatus(adminId: string, leadId: string, status: string, reason?: string) {
    await this.assertAdmin(adminId);

    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const before = { status: lead.status };
    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: status as any,
        ...(status === 'CLOSED_WON' || status === 'CLOSED_LOST'
          ? { closedAt: new Date(), closedReason: reason || 'Updated by admin' }
          : {}),
      },
    });

    try {
      await this.prisma.leadStatusHistory.create({
        data: {
          leadId,
          oldStatus: lead.status,
          newStatus: status,
          changedById: adminId,
          reason: reason || 'Status changed by admin',
        },
      });
    } catch {
      // Ignore if table or relations differ
    }

    await this.logAction(adminId, 'UPDATE', 'Lead', leadId, before, { status, reason });
    return updated;
  }

  // ─── User Management ──────────────────────────────────────────────────────
  async getUsers(adminId: string, page = 1, limit = 20, search?: string, role?: string) {
    await this.assertAdmin(adminId);
    const where: any = {};
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role as any;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, phone: true, email: true,
          role: true, status: true, isPhoneVerified: true, createdAt: true, lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit };
  }

  async userAction(adminId: string, userId: string, action: string, reason?: string) {
    const admin = await this.assertAdmin(adminId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const statusMap: Record<string, string> = {
      SUSPEND: 'SUSPENDED',
      BLOCK: 'BLOCKED',
      UNBLOCK: 'ACTIVE',
      VERIFY: 'ACTIVE',
    };

    const before = { status: user.status };
    const newStatus = statusMap[action] || user.status;

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: newStatus as any },
    });

    if (action === 'VERIFY') {
      if (user.role === 'OWNER') {
        await this.prisma.ownerProfile.updateMany({
          where: { userId },
          data: { isVerified: true },
        });
      } else if (user.role === 'AGENT') {
        await this.prisma.agentProfile.updateMany({
          where: { userId },
          data: { isVerified: true },
        });
      } else if (user.role === 'SERVICE_PROVIDER') {
        await this.prisma.serviceProviderProfile.updateMany({
          where: { userId },
          data: { isVerified: true },
        });
      }
    }

    await this.logAction(adminId, action as any, 'User', userId, before, { status: newStatus, reason });
    return { success: true, newStatus };
  }

  // ─── Vendor Onboarding Verification Queue ──────────────────────────────────
  async getPendingVendors(adminId: string) {
    await this.assertAdmin(adminId);
    return this.prisma.user.findMany({
      where: {
        role: 'SERVICE_PROVIDER',
        serviceProviderProfile: {
          isVerified: false,
        },
      },
      select: {
        id: true, firstName: true, lastName: true, phone: true, email: true, createdAt: true,
        serviceProviderProfile: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getApprovedVendors(adminId: string) {
    await this.assertAdmin(adminId);
    return this.prisma.user.findMany({
      where: {
        role: 'SERVICE_PROVIDER',
        serviceProviderProfile: {
          isVerified: true,
        },
      },
      select: {
        id: true, firstName: true, lastName: true, phone: true, email: true, createdAt: true,
        serviceProviderProfile: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async vendorAction(
    adminId: string,
    vendorUserId: string,
    action: 'APPROVE' | 'CHANGES_REQUESTED' | 'REJECT',
    notes?: string,
  ) {
    await this.assertAdmin(adminId);
    const profile = await this.prisma.serviceProviderProfile.findUnique({ where: { userId: vendorUserId } });
    if (!profile) throw new NotFoundException('Vendor profile not found');

    const statusMap: Record<string, string> = {
      APPROVE: 'APPROVED',
      CHANGES_REQUESTED: 'CHANGES_REQUESTED',
      REJECT: 'REJECTED',
    };

    const newVerificationStatus = statusMap[action] || 'PENDING';
    const before = {
      verificationStatus: profile.verificationStatus,
      isVerified: profile.isVerified,
      backgroundCheckStatus: profile.backgroundCheckStatus,
    };

    // Calculate isVerified
    let isVerified = false;
    if (newVerificationStatus === 'APPROVED') {
      if (profile.requiresBackgroundCheck) {
        isVerified = profile.backgroundCheckStatus === 'PASSED';
      } else {
        isVerified = true;
      }
    }

    const updated = await this.prisma.serviceProviderProfile.update({
      where: { userId: vendorUserId },
      data: {
        verificationStatus: newVerificationStatus,
        verificationNotes: notes || null,
        isVerified,
      },
    });

    const auditAction = action === 'APPROVE' ? 'APPROVE' : action === 'REJECT' ? 'REJECT' : 'UPDATE';
    await this.logAction(adminId, auditAction as any, 'ServiceProviderProfile', profile.id, before, {
      verificationStatus: newVerificationStatus,
      isVerified,
      notes,
    });

    return { success: true, profile: updated };
  }

  async vendorBackgroundCheckAction(
    adminId: string,
    vendorUserId: string,
    action: 'PASSED' | 'FAILED',
    notes?: string,
  ) {
    await this.assertAdmin(adminId);
    const profile = await this.prisma.serviceProviderProfile.findUnique({ where: { userId: vendorUserId } });
    if (!profile) throw new NotFoundException('Vendor profile not found');

    const newBgStatus = action === 'PASSED' ? 'PASSED' : 'FAILED';
    const before = {
      backgroundCheckStatus: profile.backgroundCheckStatus,
      isVerified: profile.isVerified,
      verificationStatus: profile.verificationStatus,
    };

    // Compute isVerified
    const isVerified = profile.verificationStatus === 'APPROVED' && newBgStatus === 'PASSED';

    const updated = await this.prisma.serviceProviderProfile.update({
      where: { userId: vendorUserId },
      data: {
        backgroundCheckStatus: newBgStatus,
        verificationNotes: notes ? `Background Check ${newBgStatus}: ${notes}` : profile.verificationNotes,
        isVerified,
      },
    });

    const auditAction = action === 'PASSED' ? 'APPROVE' : 'REJECT';
    await this.logAction(adminId, auditAction as any, 'ServiceProviderProfile', profile.id, before, {
      backgroundCheckStatus: newBgStatus,
      isVerified,
      notes,
    });

    return { success: true, profile: updated };
  }

  // ─── Admin: Create Vendor ──────────────────────────────────────────────────
  async createVendor(
    adminId: string,
    dto: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      categoryName: string;
      serviceArea: string[];
      requiresBackgroundCheck?: boolean;
      bankAccountName?: string;
      bankAccountNo?: string;
      bankIfscCode?: string;
      idProofUrl?: string;
      addressProofUrl?: string;
      certificateUrl?: string;
      autoApprove?: boolean;
    },
  ) {
    await this.assertAdmin(adminId);

    // Check if phone already exists
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new ForbiddenException('A user with this phone number already exists.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create User with SERVICE_PROVIDER role
      const user = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email || null,
          role: 'SERVICE_PROVIDER',
          status: 'ACTIVE',
          isPhoneVerified: true,
        },
      });

      // Create ServiceProviderProfile
      const autoApprove = dto.autoApprove ?? false;
      const profile = await tx.serviceProviderProfile.create({
        data: {
          userId: user.id,
          categoryName: dto.categoryName,
          serviceArea: dto.serviceArea,
          requiresBackgroundCheck: dto.requiresBackgroundCheck ?? false,
          bankAccountName: dto.bankAccountName || null,
          bankAccountNo: dto.bankAccountNo || null,
          bankIfscCode: dto.bankIfscCode || null,
          idProofUrl: dto.idProofUrl || null,
          addressProofUrl: dto.addressProofUrl || null,
          certificateUrl: dto.certificateUrl || null,
          verificationStatus: autoApprove ? 'APPROVED' : 'PENDING',
          backgroundCheckStatus: dto.requiresBackgroundCheck
            ? (autoApprove ? 'PASSED' : 'PENDING')
            : 'NOT_REQUIRED',
          isVerified: autoApprove,
          verificationNotes: autoApprove ? 'Auto-approved by admin during creation' : null,
        },
      });

      return { user, profile };
    });

    await this.logAction(adminId, 'CREATE' as any, 'ServiceProviderProfile', result.profile.id, null, {
      userId: result.user.id,
      categoryName: dto.categoryName,
      autoApprove: dto.autoApprove,
    });

    return { success: true, user: result.user, profile: result.profile };
  }

  // ─── Admin: Update Vendor Profile ──────────────────────────────────────────
  async updateVendorProfile(
    adminId: string,
    vendorUserId: string,
    dto: {
      categoryName?: string;
      serviceArea?: string[];
      requiresBackgroundCheck?: boolean;
      bankAccountName?: string;
      bankAccountNo?: string;
      bankIfscCode?: string;
      idProofUrl?: string;
      addressProofUrl?: string;
      certificateUrl?: string;
      rating?: number;
      totalJobs?: number;
      verificationNotes?: string;
    },
  ) {
    await this.assertAdmin(adminId);
    const profile = await this.prisma.serviceProviderProfile.findUnique({ where: { userId: vendorUserId } });
    if (!profile) throw new NotFoundException('Vendor profile not found');

    const before = { ...profile };

    // Build update data object — only include fields that are provided
    const updateData: any = {};
    if (dto.categoryName !== undefined) updateData.categoryName = dto.categoryName;
    if (dto.serviceArea !== undefined) updateData.serviceArea = dto.serviceArea;
    if (dto.requiresBackgroundCheck !== undefined) updateData.requiresBackgroundCheck = dto.requiresBackgroundCheck;
    if (dto.bankAccountName !== undefined) updateData.bankAccountName = dto.bankAccountName;
    if (dto.bankAccountNo !== undefined) updateData.bankAccountNo = dto.bankAccountNo;
    if (dto.bankIfscCode !== undefined) updateData.bankIfscCode = dto.bankIfscCode;
    if (dto.idProofUrl !== undefined) updateData.idProofUrl = dto.idProofUrl;
    if (dto.addressProofUrl !== undefined) updateData.addressProofUrl = dto.addressProofUrl;
    if (dto.certificateUrl !== undefined) updateData.certificateUrl = dto.certificateUrl;
    if (dto.rating !== undefined) updateData.rating = dto.rating;
    if (dto.totalJobs !== undefined) updateData.totalJobs = dto.totalJobs;
    if (dto.verificationNotes !== undefined) updateData.verificationNotes = dto.verificationNotes;

    const updated = await this.prisma.serviceProviderProfile.update({
      where: { userId: vendorUserId },
      data: updateData,
    });

    await this.logAction(adminId, 'UPDATE' as any, 'ServiceProviderProfile', profile.id, before, updateData);

    return { success: true, profile: updated };
  }

  // ─── Commission Rules & Slabs ──────────────────────────────────────────────
  async getCommissionRules(adminId: string) {
    await this.assertAdmin(adminId);
    return this.prisma.commissionRule.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createCommissionRule(
    adminId: string,
    data: { name: string; type: string; rate: number; minAmount?: number; maxAmount?: number; applicableTo: string },
  ) {
    await this.assertAdmin(adminId);
    return this.prisma.commissionRule.create({
      data: {
        name: data.name,
        type: data.type as any,
        rate: data.rate,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        applicableTo: data.applicableTo,
      },
    });
  }

  async getInvoices(adminId: string) {
    await this.assertAdmin(adminId);
    return this.prisma.invoice.findMany({
      include: {
        transaction: {
          select: {
            id: true, status: true, amount: true, createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCommissionStats(adminId: string) {
    await this.assertAdmin(adminId);
    const commissions = await this.prisma.commission.findMany();

    const grossRevenue = commissions.reduce((sum, c) => sum + Number(c.grossAmount), 0);
    const commissionRevenue = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const gstCollected = commissions.reduce((sum, c) => sum + Number(c.gstAmount), 0);
    const netPayouts = commissions.reduce((sum, c) => sum + Number(c.netPayoutAmount), 0);

    return {
      grossRevenue,
      commissionRevenue,
      gstCollected,
      netPayouts,
      totalPayoutsCount: commissions.length,
    };
  }

  // ─── Live KPI Dashboard ───────────────────────────────────────────────────
  async getDashboard(adminId: string) {
    await this.assertAdmin(adminId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTodayISO = startOfToday.toISOString();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalUsers, totalProperties, totalLeads, leadsToday, revenueThisMonth, propertiesByStatus, usersByRole] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.property.count({ where: { deletedAt: null } }),
        this.prisma.lead.count(),
        this.prisma.lead.count({ where: { createdAt: { gte: startOfTodayISO } } }),
        this.prisma.transaction.aggregate({
          where: {
            status: 'SUCCESS',
            createdAt: { gte: startOfMonth.toISOString() },
          },
          _sum: { amount: true },
        }),
        this.prisma.property.groupBy({
          by: ['status'],
          _count: true,
          where: { deletedAt: null },
        }),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
      ]);

    const statusCounts: Record<string, number> = {};
    propertiesByStatus.forEach((item) => {
      statusCounts[item.status] = item._count;
    });

    const roleCounts: Record<string, number> = {};
    usersByRole.forEach((item) => {
      roleCounts[item.role] = item._count;
    });

    return {
      totalUsers,
      totalProperties,
      totalLeads,
      leadsToday,
      revenueThisMonth: Number(revenueThisMonth._sum.amount || 0),
      propertiesByStatus: statusCounts,
      usersByRole: roleCounts,
    };
  }

  // ─── Lead CRM overrides ────────────────────────────────────────────────────
  async overrideLeadStage(adminId: string, leadId: string, newStatus: string, reason?: string) {
    await this.assertAdmin(adminId);

    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const before = { status: lead.status };

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: { status: newStatus as any },
    });

    await this.prisma.leadStatusHistory.create({
      data: {
        leadId,
        oldStatus: lead.status,
        newStatus: newStatus as any,
        changedById: adminId,
        reason,
      },
    });

    await this.logAction(adminId, 'UPDATE', 'Lead', leadId, before, { status: newStatus, reason });
    return updated;
  }

  // ─── Alerts Queue ──────────────────────────────────────────────────────────
  async getAdminAlerts(adminId: string) {
    await this.assertAdmin(adminId);
    let alerts = await this.prisma.adminAlert.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (alerts.length === 0) {
      await this.prisma.adminAlert.createMany({
        data: [
          {
            type: 'PRICE_OUTLIER',
            severity: 'HIGH',
            details: 'Listed price ₹ 1,500/sqft in Bandra West is 78% below historical locality median.',
            entityType: 'Property',
            isResolved: false,
          },
          {
            type: 'DUPLICATE_PHONE',
            severity: 'MEDIUM',
            details: 'Same mobile contact registered across 3 different agent accounts within 10 minutes.',
            entityType: 'User',
            isResolved: false,
          },
          {
            type: 'SPAM_ENQUIRY',
            severity: 'LOW',
            details: 'Suspicious burst of 15 property inquiries submitted with automated bot signature.',
            entityType: 'Lead',
            isResolved: true,
          },
        ],
      });
      alerts = await this.prisma.adminAlert.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return alerts;
  }

  async createAdminAlert(
    adminId: string,
    data: { type: string; severity: string; details: string; entityType?: string; entityId?: string },
  ) {
    await this.assertAdmin(adminId);
    const alert = await this.prisma.adminAlert.create({
      data: {
        type: data.type || 'SYSTEM_COMPLIANCE',
        severity: data.severity || 'MEDIUM',
        details: data.details,
        entityType: data.entityType || 'Compliance',
        entityId: data.entityId,
        isResolved: false,
      },
    });
    await this.logAction(adminId, 'CREATE', 'AdminAlert', alert.id, null, alert);
    return alert;
  }

  async resolveAlert(adminId: string, alertId: string, notes?: string) {
    await this.assertAdmin(adminId);
    const existing = await this.prisma.adminAlert.findUnique({ where: { id: alertId } });
    const isCurrentlyResolved = existing?.isResolved ?? false;

    const updated = await this.prisma.adminAlert.update({
      where: { id: alertId },
      data: {
        isResolved: !isCurrentlyResolved,
        resolvedBy: !isCurrentlyResolved ? adminId : null,
      },
    });
    await this.logAction(adminId, 'UPDATE', 'AdminAlert', alertId, existing, updated);
    return updated;
  }

  async deleteAdminAlert(adminId: string, alertId: string) {
    await this.assertAdmin(adminId);
    const deleted = await this.prisma.adminAlert.delete({
      where: { id: alertId },
    });
    await this.logAction(adminId, 'DELETE', 'AdminAlert', alertId, deleted, null);
    return { success: true, id: alertId };
  }

  // ─── Bypass Incidents ──────────────────────────────────────────────────────
  async getBypassIncidents(adminId: string) {
    await this.assertAdmin(adminId);
    const incidents = await this.prisma.bypassIncident.findMany({
      include: {
        lead: { select: { id: true, property: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = incidents.map((i) => i.senderId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return incidents.map((incident) => ({
      ...incident,
      sender: userMap.get(incident.senderId) || null,
    }));
  }

  // ─── System Settings (Bypass Policy) ───────────────────────────────────────
  async getSystemSettings(adminId: string) {
    await this.assertAdmin(adminId);
    return this.prisma.systemSetting.findMany();
  }

  async updateSystemSetting(adminId: string, key: string, value: string) {
    await this.assertAdmin(adminId);
    const before = await this.prisma.systemSetting.findUnique({ where: { key } });

    const setting = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await this.logAction(adminId, 'UPDATE', 'SystemSetting', key, before || undefined, { value });
    return setting;
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────────
  async getAuditLogs(adminId: string, page = 1, limit = 50, action?: string, entityType?: string) {
    await this.assertAdmin(adminId);
    const where: any = {};
    if (action) {
      where.action = action as any;
    }
    if (entityType) {
      where.entityType = { contains: entityType, mode: 'insensitive' };
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          admin: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { logs, total, page, limit };
  }

  private async logAction(
    adminId: string,
    action: string,
    entityType: string,
    entityId: string,
    before?: object,
    after?: object,
  ) {
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: action as any,
        entityType,
        entityId,
        before: before as any,
        after: after as any,
      },
    });
  }

  // ─── Broadcast Notification Sender ─────────────────────────────────────────
  async broadcastNotification(
    adminId: string,
    audience: 'ALL' | 'CUSTOMERS' | 'OWNERS' | 'VENDORS' | 'AGENTS',
    title: string,
    body: string,
  ) {
    await this.assertAdmin(adminId);

    const roleMap: Record<string, string | undefined> = {
      CUSTOMERS: 'CUSTOMER',
      OWNERS: 'OWNER',
      VENDORS: 'SERVICE_PROVIDER',
      AGENTS: 'AGENT',
    };

    const targetRole = roleMap[audience];
    const users = await this.prisma.user.findMany({
      where: targetRole ? { role: targetRole as any } : {},
      select: { id: true },
    });

    let sentCount = 0;
    for (const u of users) {
      try {
        await this.notifications.sendNotification({
          userId: u.id,
          type: 'SYSTEM',
          title,
          body,
        });
        sentCount++;
      } catch {
        // Continue sending to next recipient
      }
    }

    await this.logAction(adminId, 'CREATE', 'Notification', 'BROADCAST', null, { audience, title, count: sentCount });
    return { success: true, recipientsCount: sentCount, message: `Notification broadcasted to ${sentCount} users.` };
  }

  // ─── Vendor Payout & Earnings Ledger ───────────────────────────────────────
  async getPayouts(adminId: string) {
    await this.assertAdmin(adminId);
    const payouts = await this.prisma.payout.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        commission: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingSum = payouts
      .filter((p) => p.status === 'PENDING')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const processedSum = payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    return { payouts, stats: { pendingPayoutAmount: pendingSum, processedPayoutAmount: processedSum } };
  }

  async releasePayout(adminId: string, payoutId: string, notes?: string) {
    await this.assertAdmin(adminId);
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout record not found');

    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        gatewayRef: `ADM-REL-${Date.now()}`,
        notes: notes || 'Released by Admin',
      },
    });

    await this.logAction(adminId, 'UPDATE', 'Payout', payoutId, { status: payout.status }, { status: 'COMPLETED' });
    return { success: true, payout: updated };
  }

  // ─── Service Booking Dispatcher / Override ─────────────────────────────────
  async getAllServiceBookings(adminId: string) {
    await this.assertAdmin(adminId);
    const bookings = await this.prisma.serviceBooking.findMany({
      include: {
        service: true,
        serviceProvider: {
          include: { user: { select: { id: true, firstName: true, lastName: true, phone: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach customer info manually via customerId lookup
    const customerIds = [...new Set(bookings.map((b) => b.customerId))];
    const customers = await this.prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
    const customerMap = new Map(customers.map((c) => [c.id, c]));

    return bookings.map((b) => ({
      ...b,
      customer: customerMap.get(b.customerId) || null,
    }));
  }

  async reassignServiceBooking(adminId: string, bookingId: string, newProviderProfileId: string) {
    await this.assertAdmin(adminId);
    const booking = await this.prisma.serviceBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Service booking not found');

    const providerProfile = await this.prisma.serviceProviderProfile.findUnique({
      where: { id: newProviderProfileId },
      include: { user: true },
    });
    if (!providerProfile) throw new NotFoundException('Target Service Provider profile not found');

    const updated = await this.prisma.serviceBooking.update({
      where: { id: bookingId },
      data: {
        serviceProviderId: newProviderProfileId,
        status: 'ASSIGNED',
      },
    });

    // Notify newly assigned vendor
    try {
      await this.notifications.sendNotification({
        userId: providerProfile.userId,
        type: 'SERVICE',
        title: 'New Service Job Assigned! 🛠️',
        body: `You have been assigned to service booking ${booking.bookingRef} at ${booking.address}, ${booking.city}.`,
      });
    } catch {
      // Silent error
    }

    await this.logAction(adminId, 'UPDATE', 'ServiceBooking', bookingId, { previousProviderId: booking.serviceProviderId }, { newProviderId: newProviderProfileId });
    return { success: true, booking: updated };
  }
}

