import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Run all fraud checks on a property after submission.
   * Sets duplicateFlag / fraudFlag on match.
   * Called automatically when a property is submitted for review.
   */
  async checkProperty(propertyId: string): Promise<{
    isDuplicate: boolean;
    isFraud: boolean;
    flags: string[];
  }> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        photos: true,
        ownerProfile: { include: { user: true } },
      },
    });

    if (!property) return { isDuplicate: false, isFraud: false, flags: [] };

    const flags: string[] = [];
    let isDuplicate = false;
    let isFraud = false;

    // ─── 1. Duplicate Phone Detection ───────────────────────────────────────
    const ownerPhone = property.ownerProfile.user.phone;
    const duplicatePhoneProperties = await this.prisma.property.findMany({
      where: {
        id: { not: propertyId },
        ownerProfile: { user: { phone: ownerPhone } },
        status: { in: ['ACTIVE', 'PENDING_REVIEW'] },
        deletedAt: null,
      },
      select: { id: true, title: true },
    });

    if (duplicatePhoneProperties.length > 0) {
      flags.push(`DUPLICATE_PHONE: Same owner phone found in ${duplicatePhoneProperties.length} other active listings`);
      isDuplicate = true;
    }

    // ─── 2. Duplicate Photo Detection (hash-based) ──────────────────────────
    const propertyPhotoHashes = property.photos.map((p) =>
      crypto.createHash('md5').update(p.url).digest('hex'),
    );

    if (propertyPhotoHashes.length > 0) {
      const allOtherPhotos = await this.prisma.propertyPhoto.findMany({
        where: { propertyId: { not: propertyId } },
        select: { url: true, propertyId: true },
      });

      const matchingPhotoProps = new Set<string>();
      for (const photo of allOtherPhotos) {
        const hash = crypto.createHash('md5').update(photo.url).digest('hex');
        if (propertyPhotoHashes.includes(hash)) {
          matchingPhotoProps.add(photo.propertyId);
        }
      }

      if (matchingPhotoProps.size > 0) {
        flags.push(`DUPLICATE_PHOTOS: Matching photos found in ${matchingPhotoProps.size} other listings`);
        isDuplicate = true;
      }
    }

    // ─── 3. Suspicious Pricing Detection ────────────────────────────────────
    if (property.expectedPrice || property.monthlyRent) {
      const comparables = await this.prisma.property.findMany({
        where: {
          id: { not: propertyId },
          city: property.city,
          locality: property.locality,
          propertyType: property.propertyType,
          purpose: property.purpose,
          status: 'ACTIVE',
          deletedAt: null,
          bhk: property.bhk ?? undefined,
        },
        select: { expectedPrice: true, monthlyRent: true },
      });

      if (comparables.length >= 3) {
        const priceField = property.purpose === 'RENT' ? 'monthlyRent' : 'expectedPrice';
        const prices = comparables
          .map((c) => Number(c[priceField]))
          .filter((p) => p > 0);

        if (prices.length >= 3) {
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          const propertyPrice = Number(property[priceField]);

          if (propertyPrice > 0) {
            const deviation = Math.abs(propertyPrice - avg) / avg;
            if (deviation > 0.5) {
              // Price deviates more than 50% from locality average
              flags.push(
                `SUSPICIOUS_PRICE: Price ₹${propertyPrice.toLocaleString()} deviates ${Math.round(deviation * 100)}% from locality avg ₹${Math.round(avg).toLocaleString()}`,
              );
              isFraud = true;
            }
          }
        }
      }
    }

    // ─── 4. Multiple Active Listings from Same Owner ─────────────────────────
    const activeCount = await this.prisma.property.count({
      where: {
        ownerProfileId: property.ownerProfileId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (activeCount > 10) {
      flags.push(`MULTIPLE_LISTINGS: Owner has ${activeCount} active listings — potential spam`);
      isFraud = true;
    }

    // ─── Persist flags ───────────────────────────────────────────────────────
    if (isDuplicate || isFraud) {
      await this.prisma.property.update({
        where: { id: propertyId },
        data: {
          duplicateFlag: isDuplicate,
          fraudFlag: isFraud,
          fraudNotes: flags.join(' | '),
        },
      });

      // Create admin alert
      for (const flag of flags) {
        const alertType = flag.startsWith('DUPLICATE_PHONE')
          ? 'DUPLICATE_PHONE'
          : flag.startsWith('DUPLICATE_PHOTO')
            ? 'DUPLICATE_PHOTOS'
            : flag.startsWith('SUSPICIOUS_PRICE')
              ? 'PRICE_OUTLIER'
              : 'MULTIPLE_ACCOUNTS';

        await this.prisma.adminAlert.create({
          data: {
            type: alertType,
            severity: isFraud ? 'HIGH' : 'MEDIUM',
            details: flag,
            entityType: 'Property',
            entityId: propertyId,
          },
        }).catch(() => {}); // Non-blocking
      }

      this.logger.warn(`Fraud flags set on property ${propertyId}: ${flags.join(', ')}`);
    }

    return { isDuplicate, isFraud, flags };
  }

  /**
   * Get all unresolved admin alerts (used by admin properties queue)
   */
  async getUnresolvedAlerts(entityType?: string) {
    return this.prisma.adminAlert.findMany({
      where: {
        isResolved: false,
        ...(entityType ? { entityType } : {}),
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Resolve an admin alert
   */
  async resolveAlert(alertId: string, resolvedById: string) {
    return this.prisma.adminAlert.update({
      where: { id: alertId },
      data: { isResolved: true, resolvedBy: resolvedById },
    });
  }

  /**
   * Manually trigger fraud check on a property
   */
  async manualCheck(propertyId: string) {
    return this.checkProperty(propertyId);
  }
}
