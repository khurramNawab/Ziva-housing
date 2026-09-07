import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const BACKGROUND_CHECK_CATEGORIES = [
  'Babysitting',
  'Babysitter',
  'Elderly Caregiver',
  'Caregiver',
  'Cook',
  'Cook / Chef',
  'Driver',
  'Beautician',
  'Nanny / Care',
  'nanny',
];

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ─── Service Category Listings ──────────────────────────────────────────
  async getCategories() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async getServices(categorySlug?: string) {
    const where: any = { isActive: true };
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    return this.prisma.service.findMany({
      where,
      include: { category: true },
      orderBy: { order: 'asc' },
    });
  }

  // ─── Provider Onboarding / Profile ────────────────────────────────────────
  async getProviderProfile(userId: string) {
    let profile = await this.prisma.serviceProviderProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, profilePictureUrl: true },
        },
      },
    });

    if (!profile) {
      // Auto-create default profile for provider user if missing
      profile = await this.prisma.serviceProviderProfile.create({
        data: {
          userId,
          serviceArea: ['Bangalore'],
          categoryName: 'Electrician',
          requiresBackgroundCheck: false,
          verificationStatus: 'PENDING',
          backgroundCheckStatus: 'NOT_REQUIRED',
          isVerified: false,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, profilePictureUrl: true },
          },
        },
      });
    }

    return profile;
  }

  async onboardProvider(
    userId: string,
    dto: {
      serviceArea: string[];
      categoryName?: string;
      idProofUrl?: string;
      addressProofUrl?: string;
      certificateUrl?: string;
    },
  ) {
    const categoryName = dto.categoryName || 'Electrician';
    const requiresBackgroundCheck = BACKGROUND_CHECK_CATEGORIES.some(
      (c) => c.toLowerCase() === categoryName.toLowerCase(),
    );

    // 1. Update user role
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'SERVICE_PROVIDER', status: 'ACTIVE' },
    });

    // 2. Upsert profile with proper verification status
    const profile = await this.prisma.serviceProviderProfile.upsert({
      where: { userId },
      update: {
        serviceArea: dto.serviceArea,
        categoryName,
        requiresBackgroundCheck,
        verificationStatus: 'PENDING',
        backgroundCheckStatus: requiresBackgroundCheck ? 'PENDING' : 'NOT_REQUIRED',
        verificationNotes: null,
        idProofUrl: dto.idProofUrl || null,
        addressProofUrl: dto.addressProofUrl || null,
        certificateUrl: dto.certificateUrl || null,
        isVerified: false, // Must be verified by admin
      },
      create: {
        userId,
        serviceArea: dto.serviceArea,
        categoryName,
        requiresBackgroundCheck,
        verificationStatus: 'PENDING',
        backgroundCheckStatus: requiresBackgroundCheck ? 'PENDING' : 'NOT_REQUIRED',
        verificationNotes: null,
        idProofUrl: dto.idProofUrl || null,
        addressProofUrl: dto.addressProofUrl || null,
        certificateUrl: dto.certificateUrl || null,
        isVerified: false,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    return profile;
  }

  async resubmitProviderProfile(
    userId: string,
    dto: {
      serviceArea?: string[];
      idProofUrl?: string;
      addressProofUrl?: string;
      certificateUrl?: string;
      notes?: string;
    },
  ) {
    const existing = await this.prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });
    if (!existing) throw new NotFoundException('Vendor profile not found.');

    const updated = await this.prisma.serviceProviderProfile.update({
      where: { userId },
      data: {
        verificationStatus: 'PENDING', // Reset back to PENDING for admin re-review
        verificationNotes: 'Re-submitted by vendor. Awaiting admin re-verification.',
        serviceArea: dto.serviceArea || existing.serviceArea,
        idProofUrl: dto.idProofUrl || existing.idProofUrl,
        addressProofUrl: dto.addressProofUrl || existing.addressProofUrl,
        certificateUrl: dto.certificateUrl || existing.certificateUrl,
        isVerified: false,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    return updated;
  }

  // ─── Public Bookable Providers (Strict Verification Enforcement) ───────────
  async getPublicBookableProviders(categoryName?: string) {
    const where: any = {
      isVerified: true,
      verificationStatus: 'APPROVED',
    };

    if (categoryName) {
      where.categoryName = { equals: categoryName, mode: 'insensitive' };
    }

    // STRICT ENFORCEMENT: Only fetch providers that are fully verified
    const providers = await this.prisma.serviceProviderProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
        },
      },
      orderBy: { rating: 'desc' },
    });

    // Double-check backgroundCheckStatus for sensitive categories
    return providers.filter((p) => {
      if (p.requiresBackgroundCheck) {
        return p.backgroundCheckStatus === 'PASSED';
      }
      return true;
    });
  }

  // ─── Create Service Booking ───────────────────────────────────────────────
  async createBooking(
    customerId: string,
    dto: { serviceId: string; scheduledAt: string; address: string; city: string; pincode: string; notes?: string },
  ) {
    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    // Generate Booking reference: JVH-SVC-YYYYMMDD-seq
    const seq = (await this.prisma.serviceBooking.count()) + 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const bookingRef = `JVH-SVC-${dateStr}-${String(seq).padStart(5, '0')}`;

    const booking = await this.prisma.serviceBooking.create({
      data: {
        bookingRef,
        serviceId: dto.serviceId,
        customerId,
        scheduledAt: new Date(dto.scheduledAt),
        address: dto.address,
        city: dto.city,
        pincode: dto.pincode,
        totalAmount: service.basePrice,
        notes: dto.notes,
        status: 'PENDING',
      },
      include: { service: true },
    });

    try {
      await this.notifications.sendNotification({
        userId: customerId,
        type: 'SERVICES',
        title: `Service Booking Confirmed! (${bookingRef})`,
        body: `Your booking for ${service.name} has been received for ${new Date(dto.scheduledAt).toLocaleDateString()}. We are matching a verified professional for you.`,
      });
    } catch {
      // Silent notification fallback
    }

    return booking;
  }

  // ─── Retrieve My Bookings ─────────────────────────────────────────────────
  async getMyBookings(userId: string, role: string) {
    if (role === 'SERVICE_PROVIDER') {
      const providerProfile = await this.prisma.serviceProviderProfile.findUnique({
        where: { userId },
      });
      if (!providerProfile) throw new ForbiddenException('Provider profile not found.');

      return this.prisma.serviceBooking.findMany({
        where: { serviceProviderId: providerProfile.id },
        include: { service: true },
        orderBy: { scheduledAt: 'desc' },
      });
    }

    // Customer
    return this.prisma.serviceBooking.findMany({
      where: { customerId: userId },
      include: { service: true, serviceProvider: { include: { user: { select: { firstName: true, phone: true } } } } },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  // Retrieve Open Unassigned Bookings
  async getOpenBookings() {
    return this.prisma.serviceBooking.findMany({
      where: {
        status: 'PENDING',
        serviceProviderId: null,
      },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Update Booking Status ───────────────────────────────────────────────
  async updateBookingStatus(userId: string, role: string, bookingId: string, status: string) {
    const booking = await this.prisma.serviceBooking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const validStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid booking status: ${status}`);
    }

    let updateData: any = { status };

    if (role === 'SERVICE_PROVIDER') {
      const providerProfile = await this.prisma.serviceProviderProfile.findUnique({
        where: { userId },
      });
      if (!providerProfile) throw new ForbiddenException('Not an onboarded provider');

      // If status is ASSIGNED, auto-claim job
      if (status === 'ASSIGNED') {
        updateData.serviceProviderId = providerProfile.id;
      } else if (booking.serviceProviderId !== providerProfile.id) {
        throw new ForbiddenException('You are not assigned to this job');
      }
    } else {
      // Customer can only cancel pending jobs
      if (booking.customerId !== userId) {
        throw new ForbiddenException('Unauthorized');
      }
      if (status !== 'CANCELLED') {
        throw new BadRequestException('Customers can only transition status to CANCELLED');
      }
    }

    const updated = await this.prisma.serviceBooking.update({
      where: { id: bookingId },
      data: updateData,
      include: { service: true },
    });

    // Send notifications to Customer about booking status updates
    try {
      const statusTitles: Record<string, string> = {
        ASSIGNED: `Professional Assigned! 🛠️`,
        IN_PROGRESS: `Service In Progress ⏳`,
        COMPLETED: `Service Completed! Please rate your experience ⭐`,
        CANCELLED: `Service Booking Cancelled`,
      };
      if (statusTitles[status]) {
        await this.notifications.sendNotification({
          userId: booking.customerId,
          type: 'SERVICES',
          title: statusTitles[status],
          body: `Your booking ${booking.bookingRef} for ${booking.service.name} is now ${status}.`,
        });
      }
    } catch {
      // Silent error
    }

    return updated;
  }
}
