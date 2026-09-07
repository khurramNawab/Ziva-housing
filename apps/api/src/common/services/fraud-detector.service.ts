import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FraudDetectorService {
  private readonly logger = new Logger(FraudDetectorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check if multiple user accounts (>3) are sharing the same IP address
   */
  async checkDuplicateAccounts(userId: string, ipAddress?: string) {
    if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') return;

    try {
      // Find audit logs showing user actions/logins from this IP in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentLogs = await this.prisma.auditLog.findMany({
        where: {
          ipAddress,
          createdAt: { gte: sevenDaysAgo },
        },
        select: { adminId: true }, // adminId in auditLogs stores the actor ID (could be regular user or admin)
      });

      const uniqueUserIds = new Set(recentLogs.map((l) => l.adminId));
      uniqueUserIds.add(userId);

      if (uniqueUserIds.size > 3) {
        await this.createAlert(
          'MULTIPLE_ACCOUNTS',
          'HIGH',
          `IP Address ${ipAddress} is shared by ${uniqueUserIds.size} different accounts in the last 7 days.`,
          'User',
          userId,
        );
      }
    } catch (err) {
      this.logger.error('Failed to run duplicate accounts check', err);
    }
  }

  /**
   * Check for duplicate listings by details or identical photo URLs
   */
  async checkDuplicateListing(propertyId: string) {
    try {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: { photos: true },
      });

      if (!property || property.deletedAt) return;

      // 1. Check duplicate photos by URL
      const photoUrls = property.photos.map((p) => p.url);
      if (photoUrls.length > 0) {
        const matches = await this.prisma.propertyPhoto.findMany({
          where: {
            url: { in: photoUrls },
            propertyId: { not: propertyId },
            property: { deletedAt: null },
          },
          include: { property: true },
        });

        if (matches.length > 0) {
          const matchedIds = Array.from(new Set(matches.map((m) => m.propertyId)));
          await this.createAlert(
            'DUPLICATE_PHOTOS',
            'MEDIUM',
            `Property shares identical photo URLs with properties: ${matchedIds.join(', ')}`,
            'Property',
            propertyId,
          );
        }
      }

      // 2. Check identical specifications (BHK, price, locality, city)
      const identicalListings = await this.prisma.property.findMany({
        where: {
          id: { not: propertyId },
          city: property.city,
          locality: property.locality,
          bhk: property.bhk,
          status: 'ACTIVE',
          deletedAt: null,
          OR: [
            { expectedPrice: property.expectedPrice },
            { monthlyRent: property.monthlyRent },
          ],
        },
      });

      if (identicalListings.length > 0) {
        const matchedIds = identicalListings.map((l) => l.id);
        // Flag duplicate Listing in DB
        await this.prisma.property.update({
          where: { id: propertyId },
          data: { duplicateFlag: true },
        });

        await this.createAlert(
          'DUPLICATE_LISTING',
          'HIGH',
          `Listing specifications exactly match active properties: ${matchedIds.join(', ')}`,
          'Property',
          propertyId,
        );
      }
    } catch (err) {
      this.logger.error('Failed to run duplicate listing check', err);
    }
  }

  /**
   * Check if listing price deviates heavily (>3x or <0.2x) from market average
   */
  async checkPriceOutlier(propertyId: string) {
    try {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property || property.deletedAt) return;

      const price = property.expectedPrice
        ? Number(property.expectedPrice)
        : property.monthlyRent
          ? Number(property.monthlyRent)
          : null;

      if (!price) return;

      // Fetch active properties in the same city and BHK
      const peers = await this.prisma.property.findMany({
        where: {
          city: property.city,
          bhk: property.bhk,
          purpose: property.purpose,
          status: 'ACTIVE',
          deletedAt: null,
        },
      });

      if (peers.length < 3) return; // Need enough data points

      const prices = peers
        .map((p) => (property.expectedPrice ? Number(p.expectedPrice) : Number(p.monthlyRent)))
        .filter((pr) => pr > 0);

      const sum = prices.reduce((acc, p) => acc + p, 0);
      const avg = sum / prices.length;

      const thresholdHigh = avg * 3.0;
      const thresholdLow = avg * 0.2;

      if (price > thresholdHigh || price < thresholdLow) {
        // Flag outlier in DB
        await this.prisma.property.update({
          where: { id: propertyId },
          data: { fraudFlag: true, fraudNotes: `Price outlier detected. Price: ${price}, Average: ${avg}` },
        });

        await this.createAlert(
          'PRICE_OUTLIER',
          'MEDIUM',
          `Listing price ${price.toLocaleString('en-IN')} is an outlier compared to the city average of ${Math.round(avg).toLocaleString('en-IN')} for ${property.bhk} BHK properties.`,
          'Property',
          propertyId,
        );
      }
    } catch (err) {
      this.logger.error('Failed to run price outlier check', err);
    }
  }

  /**
   * Check and block users making >5 enquiries/leads in 10 minutes (spam rate limit)
   */
  async checkSpamEnquiries(customerId: string): Promise<boolean> {
    try {
      const tenMinutesAgo = new Date();
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

      const count = await this.prisma.lead.count({
        where: {
          customerId,
          createdAt: { gte: tenMinutesAgo },
        },
      });

      if (count >= 5) {
        await this.createAlert(
          'SPAM_ENQUIRY',
          'HIGH',
          `User created ${count} leads in the last 10 minutes. Triggered spam rate limiting.`,
          'User',
          customerId,
        );
        return true;
      }
    } catch (err) {
      this.logger.error('Failed to run spam enquiry check', err);
    }
    return false;
  }

  /**
   * Helper: Log alert to queue
   */
  private async createAlert(
    type: string,
    severity: string,
    details: string,
    entityType?: string,
    entityId?: string,
  ) {
    try {
      const alert = await this.prisma.adminAlert.create({
        data: {
          type,
          severity,
          details,
          entityType,
          entityId,
        },
      });
      this.logger.warn(`Fraud Alert Triggered: ${type} - ${details} (Alert ID: ${alert.id})`);
    } catch (err) {
      this.logger.error('Failed to save AdminAlert', err);
    }
  }
}
