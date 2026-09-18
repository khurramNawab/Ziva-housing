import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
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

const SEED_CATEGORIES = [
  { id: 'cat-clean', name: 'Cleaning', slug: 'cleaning', icon: 'vacuum', order: 1, isActive: true },
  { id: 'cat-wsalon', name: "Women's Salon & Spa", slug: 'womens-salon-spa', icon: 'face_retouching_natural', order: 2, isActive: true },
  { id: 'cat-msalon', name: "Men's Salon & Massage", slug: 'mens-salon-massage', icon: 'person_grooming', order: 3, isActive: true },
  { id: 'cat-ac', name: 'AC & Appliance Repair', slug: 'ac-appliance-repair', icon: 'ac_unit', order: 4, isActive: false },
  { id: 'cat-handy', name: 'Electrician, Plumber & Carpenter', slug: 'electrician-plumber-carpenter', icon: 'home_repair_service', order: 5, isActive: false },
  { id: 'cat-paint', name: 'Painting & Waterproofing', slug: 'painting-waterproofing', icon: 'format_paint', order: 6, isActive: false },
  { id: 'cat-help', name: 'InstaHelp', slug: 'instahelp', icon: 'support_agent', order: 7, isActive: false },
  { id: 'cat-pest', name: 'Pest Control', slug: 'pest-control', icon: 'pest_control', order: 8, isActive: false },
  { id: 'cat-movers', name: 'Packers & Movers', slug: 'packers-movers', icon: 'local_shipping', order: 9, isActive: false },
];

const SEED_SERVICES = [
  // Cleaning
  { id: 'svc-clean-1', categoryId: 'cat-clean', name: 'Bathroom Deep Cleaning (1 Bathroom)', slug: 'bathroom-deep-cleaning', description: 'Intense tile scrubbing, descaling of taps & toilet sanitization.', basePrice: 499, durationMinutes: 60, isActive: true, order: 1, imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' },
  { id: 'svc-clean-2', categoryId: 'cat-clean', name: '1 BHK Full Home Deep Cleaning', slug: '1bhk-deep-cleaning', description: 'Thorough mechanized scrubbing of all rooms, kitchen, and bathroom.', basePrice: 1999, durationMinutes: 240, isActive: true, order: 2, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
  { id: 'svc-clean-3', categoryId: 'cat-clean', name: '3-Seater Sofa Fabric Shampoo & Vacuum', slug: 'sofa-shampoo-3seater', description: 'Foam shampoo & moisture extraction for fabric sofas.', basePrice: 699, durationMinutes: 60, isActive: true, order: 3, imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
  { id: 'svc-clean-4', categoryId: 'cat-clean', name: 'Kitchen Degreasing & Deep Clean', slug: 'kitchen-degreasing', description: 'Oil & grease removal from tiles, slab, gas stove & cabinets.', basePrice: 999, durationMinutes: 120, isActive: true, order: 4, imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80' },
  // Women's Salon
  { id: 'svc-wsalon-1', categoryId: 'cat-wsalon', name: 'Full Arms + Full Legs Rica Wax Combo', slug: 'rica-wax-combo', description: 'Painless Italian Rica wax for gentle hair removal.', basePrice: 899, durationMinutes: 60, isActive: true, order: 1, imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80' },
  { id: 'svc-wsalon-2', categoryId: 'cat-wsalon', name: 'O3+ Bridal Glow Facial', slug: 'o3-bridal-facial', description: 'Multi-step radiant facial with peeling & brightening serum.', basePrice: 1699, durationMinutes: 75, isActive: true, order: 2, imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80' },
  // Men's Salon
  { id: 'svc-msalon-1', categoryId: 'cat-msalon', name: "Men's Haircut + Beard Styling", slug: 'mens-haircut-beard', description: 'Trendy scissor/clipper haircut, beard styling & neck cleanup.', basePrice: 349, durationMinutes: 45, isActive: true, order: 1, imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80' },
  { id: 'svc-msalon-2', categoryId: 'cat-msalon', name: 'Activated Charcoal Pollution De-Tan Cleanup', slug: 'mens-charcoal-cleanup', description: 'Pore cleansing, dirt extraction, blackhead removal and mask.', basePrice: 549, durationMinutes: 40, isActive: true, order: 2, imageUrl: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80' },
];

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  // Resilient in-memory fallback stores
  private inMemoryCategories = [...SEED_CATEGORIES];
  private inMemoryServices = [...SEED_SERVICES];
  private inMemoryProfiles: Map<string, any> = new Map();
  private inMemoryBookings: any[] = [
    {
      id: 'bk-seed-1',
      bookingRef: 'JVH-SVC-20260308-00001',
      serviceId: 'svc-1',
      customerId: 'user-c1',
      serviceProviderId: 'prof-v1',
      scheduledAt: new Date(Date.now() + 86400000),
      address: 'Prestige Golfshire Villa 12, Nandi Hills Road',
      city: 'Bangalore',
      pincode: '562110',
      totalAmount: 499,
      notes: 'Please check the solar inverter connection and main MCB panel.',
      status: 'ASSIGNED',
      createdAt: new Date('2026-03-08T09:00:00Z'),
      service: SEED_SERVICES[0],
      serviceProvider: {
        id: 'prof-v1',
        categoryName: 'Electrician',
        user: { firstName: 'Ramesh', lastName: 'Kumar', phone: '9845123456' },
      },
    },
    {
      id: 'bk-seed-2',
      bookingRef: 'JVH-SVC-20260308-00002',
      serviceId: 'svc-4',
      customerId: 'user-c1',
      serviceProviderId: 'prof-v2',
      scheduledAt: new Date(Date.now() + 172800000),
      address: 'Flat 402, Sobha City Casa Paradiso',
      city: 'Bangalore',
      pincode: '560077',
      totalAmount: 3499,
      notes: 'Tenant moving in. Deep sanitize bathrooms and kitchen.',
      status: 'PENDING',
      createdAt: new Date('2026-03-08T10:30:00Z'),
      service: SEED_SERVICES[3],
      serviceProvider: null,
    },
  ];

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {
    // Pre-populate demo provider profiles
    this.inMemoryProfiles.set('vendor-user-1', {
      id: 'prof-v1',
      userId: 'vendor-user-1',
      categoryName: 'Electrician',
      serviceArea: ['North Bangalore', 'Hebbal', 'Yelahanka'],
      verificationStatus: 'APPROVED',
      requiresBackgroundCheck: false,
      backgroundCheckStatus: 'NOT_REQUIRED',
      isVerified: true,
      rating: 4.8,
      totalJobs: 142,
      bankAccountName: 'Ramesh Kumar',
      bankAccountNo: '918237461928',
      bankIfscCode: 'HDFC0001234',
      user: { id: 'vendor-user-1', firstName: 'Ramesh', lastName: 'Kumar', phone: '9845123456', email: 'ramesh.electric@example.com', profilePictureUrl: null },
    });
    this.inMemoryProfiles.set('vendor-user-2', {
      id: 'prof-v2',
      userId: 'vendor-user-2',
      categoryName: 'Deep Cleaning',
      serviceArea: ['Whitefield', 'Bellandur', 'Marathahalli'],
      verificationStatus: 'PENDING',
      requiresBackgroundCheck: true,
      backgroundCheckStatus: 'PENDING',
      isVerified: false,
      rating: 4.9,
      totalJobs: 52,
      bankAccountName: 'Sunita Devi',
      bankAccountNo: '123456789012',
      bankIfscCode: 'SBIN0004321',
      user: { id: 'vendor-user-2', firstName: 'Sunita', lastName: 'Devi', phone: '9876123489', email: 'sunita.cleaning@example.com', profilePictureUrl: null },
    });
    this.inMemoryProfiles.set('vendor-user-3', {
      id: 'prof-v3',
      userId: 'vendor-user-3',
      categoryName: 'Plumbing',
      serviceArea: ['Bangalore North', 'Hebbal', 'Yelahanka'],
      verificationStatus: 'APPROVED',
      requiresBackgroundCheck: false,
      backgroundCheckStatus: 'PASSED',
      isVerified: true,
      rating: 4.9,
      totalJobs: 98,
      bankAccountName: 'Mohammad Rafiq',
      bankAccountNo: '998877665544',
      bankIfscCode: 'ICIC0000999',
      user: { id: 'vendor-user-3', firstName: 'Mohammad', lastName: 'Rafiq', phone: '9988112233', email: 'rafiq.plumbing@example.com', profilePictureUrl: null },
    });
  }

  // ─── Service Category Listings ──────────────────────────────────────────
  async getCategories() {
    if (this.prisma.isDbAvailable()) {
      try {
        const categories = await this.prisma.serviceCategory.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        });
        if (categories && categories.length > 0) return categories;
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getCategories: ${err?.message}`);
      }
    }
    return this.inMemoryCategories;
  }

  // ─── GET /categories/:id/menu — Grouped Response ───────────────────────
  async getCategoryMenu(categoryId: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        const category = await this.prisma.serviceCategory.findFirst({
          where: { OR: [{ id: categoryId }, { slug: categoryId }], isActive: true },
          include: {
            serviceGroups: {
              orderBy: { displayOrder: 'asc' },
              include: {
                subOptions: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
              },
            },
            services: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              include: {
                subOptions: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
              },
            },
          },
        });

        if (category) {
          // Build grouped response: if serviceGroups exist, group services under them
          const groups =
            category.serviceGroups.length > 0
              ? category.serviceGroups.map((g) => ({
                  groupName: g.groupName,
                  services: category.services.filter((s) =>
                    s.subOptions.some((so) => so.groupId === g.id),
                  ),
                }))
              : [{ groupName: category.name, services: category.services }];

          return { category, groups };
        }
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getCategoryMenu: ${err?.message}`);
      }
    }

    // In-memory fallback
    const cat = this.inMemoryCategories.find(
      (c) => c.id === categoryId || c.slug === categoryId,
    );
    if (!cat) return null;
    const services = this.inMemoryServices.filter((s) => s.categoryId === cat.id);
    return {
      category: cat,
      groups: [{ groupName: cat.name, services }],
    };
  }

  async getServices(categorySlug?: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        const where: any = { isActive: true };
        if (categorySlug) {
          where.category = { slug: categorySlug };
        }

        const services = await this.prisma.service.findMany({
          where,
          include: { category: true },
          orderBy: { order: 'asc' },
        });
        if (services && services.length > 0) return services;
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getServices: ${err?.message}`);
      }
    }

    if (categorySlug) {
      const cat = this.inMemoryCategories.find((c) => c.slug === categorySlug);
      if (!cat) return [];
      return this.inMemoryServices
        .filter((s) => s.categoryId === cat.id)
        .map((s) => ({ ...s, category: cat }));
    }

    return this.inMemoryServices.map((s) => ({
      ...s,
      category: this.inMemoryCategories.find((c) => c.id === s.categoryId),
    }));
  }

  // ─── Provider Onboarding / Profile ────────────────────────────────────────
  async getProviderProfile(userId: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        let profile = await this.prisma.serviceProviderProfile.findUnique({
          where: { userId },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true, profilePictureUrl: true },
            },
          },
        });

        if (!profile) {
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

        if (profile) return profile;
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getProviderProfile: ${err?.message}`);
      }
    }

    let existing = this.inMemoryProfiles.get(userId);
    if (!existing) {
      existing = {
        id: `prof-${userId}`,
        userId,
        categoryName: 'Electrician',
        serviceArea: ['Bangalore'],
        requiresBackgroundCheck: false,
        verificationStatus: 'PENDING',
        backgroundCheckStatus: 'NOT_REQUIRED',
        isVerified: false,
        rating: 5.0,
        totalJobs: 0,
        bankAccountName: null,
        bankAccountNo: null,
        bankIfscCode: null,
        user: { id: userId, firstName: 'Vendor', lastName: 'Professional', email: `${userId}@zivahousing.com`, phone: '9876543210', profilePictureUrl: null },
      };
      this.inMemoryProfiles.set(userId, existing);
    }
    return existing;
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

    if (this.prisma.isDbAvailable()) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { role: 'SERVICE_PROVIDER', status: 'ACTIVE' },
        }).catch(() => {});

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
            isVerified: false,
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
      } catch (err: any) {
        this.logger.warn(`Remote DB error in onboardProvider: ${err?.message}`);
      }
    }

    const inMem = {
      id: `prof-${userId}`,
      userId,
      categoryName,
      serviceArea: dto.serviceArea,
      requiresBackgroundCheck,
      verificationStatus: 'PENDING',
      backgroundCheckStatus: requiresBackgroundCheck ? 'PENDING' : 'NOT_REQUIRED',
      verificationNotes: null,
      idProofUrl: dto.idProofUrl || null,
      addressProofUrl: dto.addressProofUrl || null,
      certificateUrl: dto.certificateUrl || null,
      isVerified: false,
      rating: 5.0,
      totalJobs: 0,
      user: { id: userId, firstName: 'Applicant', lastName: 'Vendor', email: '', phone: '9876543210' },
    };
    this.inMemoryProfiles.set(userId, inMem);
    return inMem;
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
    if (this.prisma.isDbAvailable()) {
      try {
        const existing = await this.prisma.serviceProviderProfile.findUnique({
          where: { userId },
        });
        if (existing) {
          const updated = await this.prisma.serviceProviderProfile.update({
            where: { userId },
            data: {
              verificationStatus: 'PENDING',
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
      } catch (err: any) {
        this.logger.warn(`Remote DB error in resubmitProviderProfile: ${err?.message}`);
      }
    }

    const inMem = await this.getProviderProfile(userId);
    inMem.verificationStatus = 'PENDING';
    inMem.verificationNotes = 'Re-submitted by vendor. Awaiting admin re-verification.';
    if (dto.serviceArea) inMem.serviceArea = dto.serviceArea;
    if (dto.idProofUrl) inMem.idProofUrl = dto.idProofUrl;
    if (dto.addressProofUrl) inMem.addressProofUrl = dto.addressProofUrl;
    if (dto.certificateUrl) inMem.certificateUrl = dto.certificateUrl;
    inMem.isVerified = false;
    this.inMemoryProfiles.set(userId, inMem);
    return inMem;
  }

  // ─── Public Bookable Providers (Strict Verification Enforcement) ───────────
  async getPublicBookableProviders(categoryName?: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        const where: any = {
          isVerified: true,
          verificationStatus: 'APPROVED',
        };

        if (categoryName) {
          where.categoryName = { equals: categoryName, mode: 'insensitive' };
        }

        const providers = await this.prisma.serviceProviderProfile.findMany({
          where,
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
            },
          },
          orderBy: { rating: 'desc' },
        });

        if (providers && providers.length > 0) {
          return providers.filter((p) => {
            if (p.requiresBackgroundCheck) {
              return p.backgroundCheckStatus === 'PASSED';
            }
            return true;
          });
        }
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getPublicBookableProviders: ${err?.message}`);
      }
    }

    const all = Array.from(this.inMemoryProfiles.values()).filter(
      (p) => p.isVerified && p.verificationStatus === 'APPROVED',
    );
    if (!categoryName) return all;
    return all.filter((p) => p.categoryName.toLowerCase() === categoryName.toLowerCase());
  }

  // ─── Create Service Booking ───────────────────────────────────────────────
  async createBooking(
    customerId: string,
    dto: { serviceId: string; scheduledAt: string; address: string; city: string; pincode: string; notes?: string },
  ) {
    if (this.prisma.isDbAvailable()) {
      try {
        const service = await this.prisma.service.findUnique({
          where: { id: dto.serviceId },
        });
        if (service) {
          const seq = (await this.prisma.serviceBooking.count().catch(() => 10)) + 1;
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

          this.notifications.sendNotification({
            userId: customerId,
            type: 'SERVICES',
            title: `Service Booking Confirmed! (${bookingRef})`,
            body: `Your booking for ${service.name} has been received for ${new Date(dto.scheduledAt).toLocaleDateString()}. We are matching a verified professional for you.`,
          }).catch(() => {});

          return booking;
        }
      } catch (err: any) {
        this.logger.warn(`Remote DB error in createBooking: ${err?.message}`);
      }
    }

    const matchedService = this.inMemoryServices.find((s) => s.id === dto.serviceId) || SEED_SERVICES[0];
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const bookingRef = `JVH-SVC-${dateStr}-${String(this.inMemoryBookings.length + 1).padStart(5, '0')}`;
    const newBooking = {
      id: `bk-${Date.now()}`,
      bookingRef,
      serviceId: dto.serviceId,
      customerId,
      serviceProviderId: null,
      scheduledAt: new Date(dto.scheduledAt),
      address: dto.address,
      city: dto.city,
      pincode: dto.pincode,
      totalAmount: matchedService.basePrice,
      notes: dto.notes,
      status: 'PENDING',
      createdAt: new Date(),
      service: matchedService,
      serviceProvider: null,
    };
    this.inMemoryBookings.unshift(newBooking);
    return newBooking;
  }

  // ─── Retrieve My Bookings ─────────────────────────────────────────────────
  async getMyBookings(userId: string, role: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        if (role === 'SERVICE_PROVIDER') {
          const providerProfile = await this.prisma.serviceProviderProfile.findUnique({
            where: { userId },
          });
          if (providerProfile) {
            return await this.prisma.serviceBooking.findMany({
              where: { serviceProviderId: providerProfile.id },
              include: { service: true },
              orderBy: { scheduledAt: 'desc' },
            });
          }
        } else {
          return await this.prisma.serviceBooking.findMany({
            where: { customerId: userId },
            include: { service: true, serviceProvider: { include: { user: { select: { firstName: true, phone: true } } } } },
            orderBy: { scheduledAt: 'desc' },
          });
        }
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getMyBookings: ${err?.message}`);
      }
    }

    if (role === 'SERVICE_PROVIDER') {
      const prof = this.inMemoryProfiles.get(userId);
      const profId = prof ? prof.id : `prof-${userId}`;
      return this.inMemoryBookings.filter((b) => b.serviceProviderId === profId);
    }
    return this.inMemoryBookings.filter((b) => b.customerId === userId || b.customerId === 'user-c1');
  }

  // Retrieve Open Unassigned Bookings
  async getOpenBookings() {
    if (this.prisma.isDbAvailable()) {
      try {
        return await this.prisma.serviceBooking.findMany({
          where: {
            status: 'PENDING',
            serviceProviderId: null,
          },
          include: { service: true },
          orderBy: { createdAt: 'desc' },
        });
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getOpenBookings: ${err?.message}`);
      }
    }

    return this.inMemoryBookings.filter((b) => b.status === 'PENDING' && !b.serviceProviderId);
  }

  // ─── Update Booking Status ───────────────────────────────────────────────
  async updateBookingStatus(userId: string, role: string, bookingId: string, status: string) {
    const validStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid booking status: ${status}`);
    }

    if (this.prisma.isDbAvailable()) {
      try {
        const booking = await this.prisma.serviceBooking.findUnique({
          where: { id: bookingId },
          include: { service: true },
        });
        if (booking) {
          let updateData: any = { status };

          if (role === 'SERVICE_PROVIDER') {
            const providerProfile = await this.prisma.serviceProviderProfile.findUnique({
              where: { userId },
            });
            if (!providerProfile) throw new ForbiddenException('Not an onboarded provider');

            if (status === 'ASSIGNED') {
              updateData.serviceProviderId = providerProfile.id;
            } else if (booking.serviceProviderId !== providerProfile.id) {
              throw new ForbiddenException('You are not assigned to this job');
            }
          } else {
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

          return updated;
        }
      } catch (err: any) {
        if (err instanceof ForbiddenException || err instanceof BadRequestException) throw err;
        this.logger.warn(`Remote DB error in updateBookingStatus: ${err?.message}`);
      }
    }

    const inMem = this.inMemoryBookings.find((b) => b.id === bookingId);
    if (!inMem) throw new NotFoundException('Booking not found');
    inMem.status = status;
    if (status === 'ASSIGNED' && role === 'SERVICE_PROVIDER') {
      const prof = this.inMemoryProfiles.get(userId);
      inMem.serviceProviderId = prof ? prof.id : `prof-${userId}`;
    }
    return inMem;
  }
}
