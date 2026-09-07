import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertySearchDto } from './dto/property-search.dto';
import { Prisma } from '@prisma/client';
import { FraudDetectorService } from '../common/services/fraud-detector.service';

// CRITICAL: This selector is used in ALL property list/detail responses.
// It NEVER includes owner phone, email, whatsapp, or any contact info.
const SAFE_PROPERTY_SELECT = {
  id: true,
  title: true,
  description: true,
  purpose: true,
  propertyType: true,
  status: true,
  isZivaVerified: true,
  verifiedAt: true,
  addressLine1: true,
  addressLine2: true,
  locality: true,
  city: true,
  state: true,
  pincode: true,
  latitude: true,
  longitude: true,
  bhk: true,
  bathrooms: true,
  balconies: true,
  totalFloors: true,
  floorNumber: true,
  builtUpArea: true,
  carpetArea: true,
  plotArea: true,
  furnishing: true,
  availableFrom: true,
  expectedPrice: true,
  pricePerSqft: true,
  monthlyRent: true,
  maintenanceCharges: true,
  securityDeposit: true,
  viewCount: true,
  enquiryCount: true,
  createdAt: true,
  updatedAt: true,
  photos: {
    select: { id: true, url: true, thumbnailUrl: true, caption: true, order: true, isPrimary: true },
    orderBy: { order: 'asc' as const },
  },
  amenities: {
    select: { amenity: { select: { name: true, category: true, icon: true } } },
  },
  // Owner: ONLY name and ID — NEVER phone/email/alternatePhone/whatsapp
  ownerProfile: {
    select: {
      id: true,
      isVerified: true,
      user: {
        select: {
          id: true,
          firstName: true,
          // lastName intentionally omitted from public view
          profilePictureUrl: true,
          createdAt: true,
        },
      },
    },
  },
} satisfies Prisma.PropertySelect;

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private fraudDetector: FraudDetectorService,
  ) { }

  // ─── Create / Update Draft (Wizard) ───────────────────────────────────────
  async create(ownerId: string, dto: CreatePropertyDto) {
    let ownerProfile = await this.prisma.ownerProfile.findUnique({
      where: { userId: ownerId },
    });
    if (!ownerProfile) {
      ownerProfile = await this.prisma.ownerProfile.create({
        data: { userId: ownerId },
      });
    }

    // Duplicate check
    const duplicate = await this.prisma.property.findFirst({
      where: {
        locality: dto.locality,
        city: dto.city,
        bhk: dto.bhk,
        expectedPrice: dto.expectedPrice,
        monthlyRent: dto.monthlyRent,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
    const duplicateFlag = !!duplicate;

    // Fraud check
    const scamKeywords = ['scam', 'free cash', 'win lottery', 'lotto', 'fake', 'cheat', 'spoof'];
    const hasScam = scamKeywords.some(
      (word) =>
        dto.title.toLowerCase().includes(word) ||
        dto.description?.toLowerCase().includes(word),
    );
    const fraudFlag = hasScam;
    const fraudNotes = hasScam ? 'Content triggered spam/fraud keyword filter.' : null;

    const property = await this.prisma.property.create({
      data: {
        ownerProfileId: ownerProfile.id,
        title: dto.title,
        description: dto.description || '',
        purpose: dto.purpose as any,
        propertyType: dto.propertyType as any,
        status: 'PENDING_REVIEW',
        addressLine1: dto.addressLine1 || '',
        addressLine2: dto.addressLine2,
        locality: dto.locality || '',
        city: dto.city || '',
        state: dto.state || '',
        pincode: dto.pincode || '',
        latitude: dto.latitude,
        longitude: dto.longitude,
        bhk: dto.bhk,
        bathrooms: dto.bathrooms,
        balconies: dto.balconies,
        totalFloors: dto.totalFloors,
        floorNumber: dto.floorNumber,
        builtUpArea: dto.builtUpArea,
        carpetArea: dto.carpetArea,
        duplicateFlag,
        fraudFlag,
        fraudNotes,
        furnishing: (dto.furnishing as any) || 'UNFURNISHED',
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : undefined,
        expectedPrice: dto.expectedPrice,
        pricePerSqft: dto.pricePerSqft,
        monthlyRent: dto.monthlyRent,
        maintenanceCharges: dto.maintenanceCharges,
        securityDeposit: dto.securityDeposit,
        photos: {
          create: dto.photos?.map((url, idx) => ({
            url,
            isPrimary: idx === 0,
            order: idx,
          })) || [],
        },
        documents: {
          create: dto.documents?.map((doc) => ({
            url: doc.url,
            documentType: doc.documentType as any,
            fileName: doc.fileName,
          })) || [],
        },
      },
      select: { id: true, status: true, title: true },
    });

    // Update total properties count
    await this.prisma.ownerProfile.update({
      where: { id: ownerProfile.id },
      data: { totalProperties: { increment: 1 } },
    });

    // Run fraud & duplicate checks asynchronously
    this.fraudDetector.checkDuplicateListing(property.id).catch(() => { });
    this.fraudDetector.checkPriceOutlier(property.id).catch(() => { });

    return property;
  }

  // ─── Submit for Admin Review ───────────────────────────────────────────────
  async submitForReview(propertyId: string, ownerId: string) {
    const property = await this.findOwnProperty(propertyId, ownerId);

    const photoCount = await this.prisma.propertyPhoto.count({
      where: { propertyId },
    });
    if (photoCount < 5) {
      throw new BadRequestException('At least 5 photos are required to submit the property for review.');
    }

    return this.prisma.property.update({
      where: { id: propertyId },
      data: { status: 'PENDING_REVIEW' },
      select: { id: true, status: true },
    });
  }

  // ─── Search & Filter ───────────────────────────────────────────────────────
  async search(dto: PropertySearchDto) {
    const where: Prisma.PropertyWhereInput = {
      status: 'ACTIVE',
      deletedAt: null,
    };

    if (dto.city) where.city = { contains: dto.city, mode: 'insensitive' };
    if (dto.locality) where.locality = { contains: dto.locality, mode: 'insensitive' };
    if (dto.purpose) where.purpose = dto.purpose as any;
    if (dto.propertyType) where.propertyType = dto.propertyType as any;
    if (dto.furnishing) where.furnishing = dto.furnishing as any;
    if (dto.isZivaVerified) where.isZivaVerified = true;

    if (dto.bhk?.length) where.bhk = { in: dto.bhk.map(Number) };

    if (dto.minPrice || dto.maxPrice) {
      where.OR = [
        {
          expectedPrice: {
            gte: dto.minPrice,
            lte: dto.maxPrice,
          },
        },
        {
          monthlyRent: {
            gte: dto.minPrice,
            lte: dto.maxPrice,
          },
        },
      ];
    }

    if (dto.minArea || dto.maxArea) {
      where.builtUpArea = {
        gte: dto.minArea,
        lte: dto.maxArea,
      };
    }

    if (dto.amenities?.length) {
      where.amenities = {
        some: {
          amenity: {
            name: {
              in: dto.amenities,
              mode: 'insensitive',
            },
          },
        },
      };
    }

    if (dto.possession) {
      if (dto.possession === 'READY_TO_MOVE') {
        where.availableFrom = {
          lte: new Date(),
        };
      } else if (dto.possession === 'UNDER_CONSTRUCTION') {
        where.availableFrom = {
          gt: new Date(),
        };
      }
    }

    // Full-text search using PostgreSQL ILIKE (FTS via tsvector in migration)
    if (dto.q) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: dto.q, mode: 'insensitive' } },
        { description: { contains: dto.q, mode: 'insensitive' } },
        { locality: { contains: dto.q, mode: 'insensitive' } },
        { city: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 20, 50);

    try {
      const [properties, total] = await Promise.all([
        this.prisma.property.findMany({
          where,
          select: SAFE_PROPERTY_SELECT,
          orderBy: [
            { isZivaVerified: 'desc' },
            { createdAt: 'desc' },
          ],
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.property.count({ where }),
      ]);

      return {
        properties,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      };
    } catch (err) {
      return {
        properties: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
        hasNext: false,
      };
    }
  }

  // ─── Get by ID ─────────────────────────────────────────────────────────────
  async findOne(id: string, viewerId?: string) {
    try {
      const property = await this.prisma.property.findUnique({
        where: { id, deletedAt: null },
        select: SAFE_PROPERTY_SELECT,
      });

      if (property) {
        this.prisma.property
          .update({ where: { id }, data: { viewCount: { increment: 1 } } })
          .catch(() => { });
        return property;
      }
    } catch (err) {
      // Database offline fallback
    }

    throw new NotFoundException('Property not found');
  }

  // ─── Update (Owner only) ───────────────────────────────────────────────────
  async update(propertyId: string, ownerId: string, dto: UpdatePropertyDto) {
    await this.findOwnProperty(propertyId, ownerId);

    const { photos, documents, ...rest } = dto;

    const property = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        ...rest,
        status: rest.status as any,
        purpose: rest.purpose as any,
        propertyType: rest.propertyType as any,
        furnishing: rest.furnishing as any,
        availableFrom: rest.availableFrom ? new Date(rest.availableFrom) : undefined,
      },
      select: { id: true, title: true, status: true, updatedAt: true },
    });

    if (photos) {
      await this.prisma.propertyPhoto.deleteMany({ where: { propertyId } });
      if (photos.length > 0) {
        await this.prisma.propertyPhoto.createMany({
          data: photos.map((url, idx) => ({
            propertyId,
            url,
            isPrimary: idx === 0,
            order: idx,
          })),
        });
      }
    }

    if (documents) {
      await this.prisma.propertyDocument.deleteMany({ where: { propertyId } });
      if (documents.length > 0) {
        await this.prisma.propertyDocument.createMany({
          data: documents.map((doc) => ({
            propertyId,
            url: doc.url,
            documentType: doc.documentType as any,
            fileName: doc.fileName,
          })),
        });
      }
    }

    // Run fraud & duplicate checks asynchronously
    this.fraudDetector.checkDuplicateListing(propertyId).catch(() => { });
    this.fraudDetector.checkPriceOutlier(propertyId).catch(() => { });

    return property;
  }

  // ─── Soft Delete ───────────────────────────────────────────────────────────
  async remove(propertyId: string, ownerId: string) {
    await this.findOwnProperty(propertyId, ownerId);

    return this.prisma.property.update({
      where: { id: propertyId },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  // ─── Get Owner's Own Properties ────────────────────────────────────────────
  async findMyProperties(ownerId: string, page = 1, limit = 20) {
    const ownerProfile = await this.prisma.ownerProfile.findUnique({
      where: { userId: ownerId },
    });
    if (!ownerProfile) return { properties: [], total: 0 };

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where: { ownerProfileId: ownerProfile.id, deletedAt: null },
        select: {
          ...SAFE_PROPERTY_SELECT,
          // Owners can see admin notes on their own properties
          adminNotes: true,
          rejectionReason: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.property.count({
        where: { ownerProfileId: ownerProfile.id, deletedAt: null },
      }),
    ]);

    return { properties, total, page, limit };
  }

  // ─── Helper ────────────────────────────────────────────────────────────────
  private async findOwnProperty(propertyId: string, ownerId: string) {
    const ownerProfile = await this.prisma.ownerProfile.findUnique({
      where: { userId: ownerId },
    });
    if (!ownerProfile) throw new ForbiddenException('Not an owner account');

    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, ownerProfileId: ownerProfile.id, deletedAt: null },
    });
    if (!property) throw new NotFoundException('Property not found or not yours');
    return property;
  }
}
