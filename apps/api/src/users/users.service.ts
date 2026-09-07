import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, status: true, profilePictureUrl: true,
        isPhoneVerified: true, isEmailVerified: true, createdAt: true,
        customerProfile: true,
        ownerProfile: {
          select: {
            id: true, isVerified: true, totalProperties: true, gstNumber: true,
            // NEVER return bankAccountNo, panNumber, etc. in public profile
          },
        },
      },
    });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; profilePictureUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
    });
  }

  async acceptTerms(userId: string, version: string, ipAddress: string) {
    if ((this.prisma as any).termsAcceptance) {
      return (this.prisma as any).termsAcceptance.upsert({
        where: { userId_version: { userId, version } },
        update: { acceptedAt: new Date(), ipAddress },
        create: { userId, version, ipAddress },
      });
    }
    return { success: true, acceptedAt: new Date() };
  }

  async hasAcceptedTerms(userId: string, version = 'v1.0'): Promise<boolean> {
    if ((this.prisma as any).termsAcceptance) {
      const acceptance = await (this.prisma as any).termsAcceptance.findUnique({
        where: { userId_version: { userId, version } },
      });
      return !!acceptance;
    }
    return true;
  }
}
