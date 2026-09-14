import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// Hard gate categories requiring background check clearance
const BACKGROUND_CHECK_REQUIRED_CATEGORIES = [
  'Babysitter',
  'Babysitting',
  'Elderly Caregiver',
  'Nanny',
  'Nanny / Care',
  'Elder Care',
  'Baby Care',
  'Child Care',
];

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /**
   * POST /providers/onboard
   * Full provider profile setup with service selection and area
   */
  async onboard(
    userId: string,
    dto: {
      serviceArea: string[];
      categoryName?: string;
      bankAccountName?: string;
      bankAccountNo?: string;
      bankIfscCode?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const requiresBackgroundCheck = dto.categoryName
      ? BACKGROUND_CHECK_REQUIRED_CATEGORIES.some((cat) =>
          dto.categoryName!.toLowerCase().includes(cat.toLowerCase()),
        )
      : false;

    const profile = await this.prisma.serviceProviderProfile.upsert({
      where: { userId },
      create: {
        userId,
        serviceArea: dto.serviceArea,
        categoryName: dto.categoryName,
        bankAccountName: dto.bankAccountName,
        bankAccountNo: dto.bankAccountNo,
        bankIfscCode: dto.bankIfscCode,
        requiresBackgroundCheck,
        verificationStatus: 'PENDING',
        backgroundCheckStatus: requiresBackgroundCheck ? 'PENDING' : 'NOT_REQUIRED',
      },
      update: {
        serviceArea: dto.serviceArea,
        categoryName: dto.categoryName,
        bankAccountName: dto.bankAccountName,
        bankAccountNo: dto.bankAccountNo,
        bankIfscCode: dto.bankIfscCode,
        requiresBackgroundCheck,
      },
    });

    return profile;
  }

  /**
   * PATCH /providers/availability
   * Update weekly availability calendar
   */
  async updateAvailability(
    userId: string,
    slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }>,
  ) {
    const profile = await this.prisma.serviceProviderProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found. Please onboard first.');

    await this.prisma.providerAvailability.deleteMany({
      where: { serviceProviderId: profile.id },
    });

    const created = await this.prisma.providerAvailability.createMany({
      data: slots.map((s) => ({
        serviceProviderId: profile.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: s.isAvailable,
      })),
    });

    return { updated: created.count };
  }

  /**
   * POST /providers/kyc
   * Upload a KYC verification document
   */
  async submitKyc(
    userId: string,
    dto: {
      docType: string;
      fileUrl: string;
    },
  ) {
    const profile = await this.prisma.serviceProviderProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found');

    const validDocTypes = ['AADHAAR', 'PAN', 'POLICE_VERIFICATION', 'TRADE_CERTIFICATE', 'BANK_STATEMENT', 'OTHER'];
    if (!validDocTypes.includes(dto.docType.toUpperCase())) {
      throw new BadRequestException(`Invalid doc type. Valid types: ${validDocTypes.join(', ')}`);
    }

    const doc = await this.prisma.providerVerificationDocument.create({
      data: {
        providerId: profile.id,
        docType: dto.docType.toUpperCase() as any,
        fileUrl: dto.fileUrl,
        status: 'SUBMITTED',
      },
    });

    // Update provider status to under review
    await this.prisma.serviceProviderProfile.update({
      where: { id: profile.id },
      data: { verificationStatus: 'PENDING' },
    });

    return doc;
  }

  /**
   * GET /providers/me/profile
   * Full profile with KYC docs and availability
   */
  async getProfile(userId: string) {
    const profile = await this.prisma.serviceProviderProfile.findUnique({
      where: { userId },
      include: {
        availability: { orderBy: { dayOfWeek: 'asc' } },
        verificationDocs: { orderBy: { submittedAt: 'desc' } },
      },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');
    return profile;
  }

  /**
   * GET /providers/me/bookings
   * Get assigned/pending jobs for provider
   */
  async getMyBookings(userId: string) {
    const profile = await this.prisma.serviceProviderProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found');

    return this.prisma.serviceBooking.findMany({
      where: { serviceProviderId: profile.id },
      include: {
        service: { select: { name: true, basePrice: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  /**
   * Admin: approve/reject KYC document
   * Called by admin module internally
   */
  async reviewKycDocument(
    adminId: string,
    docId: string,
    decision: 'APPROVED' | 'REJECTED',
    notes?: string,
  ) {
    const doc = await this.prisma.providerVerificationDocument.findUnique({
      where: { id: docId },
      include: { provider: true },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const updated = await this.prisma.providerVerificationDocument.update({
      where: { id: docId },
      data: {
        status: decision,
        reviewerId: adminId,
        reviewerNotes: notes,
        reviewedAt: new Date(),
      },
    });

    // After approval, check if all required docs are approved and compute badge
    if (decision === 'APPROVED') {
      await this.computeVerificationBadge(doc.provider.id, doc.provider.userId);
    } else {
      // Notify provider of rejection
      await this.notifications.sendNotification({
        userId: doc.provider.userId,
        type: 'KYC_REJECTED',
        title: 'Document Rejected',
        body: `Your ${doc.docType} document was rejected. Reason: ${notes || 'Please contact support.'}`,
      }).catch(() => {});
    }

    return updated;
  }

  /**
   * Badge computation logic:
   * isVerified = verificationStatus === APPROVED
   * For Baby/Elderly care: additionally requires backgroundCheckStatus === 'passed'
   */
  async computeVerificationBadge(profileId: string, userId: string) {
    const profile = await this.prisma.serviceProviderProfile.findUnique({
      where: { id: profileId },
      include: { verificationDocs: true },
    });
    if (!profile) return;

    const allDocs = profile.verificationDocs;
    const hasApprovedId = allDocs.some(
      (d) => ['AADHAAR', 'PAN'].includes(d.docType) && d.status === 'APPROVED',
    );

    // Background check gate for sensitive categories
    const isSensitiveCategory = profile.categoryName
      ? BACKGROUND_CHECK_REQUIRED_CATEGORIES.some((cat) =>
          profile.categoryName!.toLowerCase().includes(cat.toLowerCase()),
        )
      : false;

    const backgroundClear =
      !isSensitiveCategory || profile.backgroundCheckStatus === 'PASSED';

    const isNowVerified =
      hasApprovedId &&
      backgroundClear &&
      profile.totalJobs >= 0; // can add min job count threshold later

    if (isNowVerified && !profile.isVerified) {
      await this.prisma.serviceProviderProfile.update({
        where: { id: profileId },
        data: { isVerified: true, verificationStatus: 'APPROVED' },
      });

      await this.notifications.sendNotification({
        userId,
        type: 'KYC_APPROVED',
        title: '✅ Verification Complete!',
        body: 'Congratulations! Your Ziva Housing provider profile is now verified.',
      }).catch(() => {});
    }
  }
}
