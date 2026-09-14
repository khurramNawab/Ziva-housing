import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * POST /builders/register
   * Register user as a builder
   */
  async registerBuilder(
    userId: string,
    dto: {
      companyName: string;
      reraNumber?: string;
      websiteUrl?: string;
      logoUrl?: string;
      established?: number;
    },
  ) {
    const existing = await this.prisma.builderProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new BadRequestException('Builder profile already exists');
    }

    return this.prisma.builderProfile.create({
      data: { userId, ...dto },
    });
  }

  /**
   * GET /builders/me/profile
   */
  async getBuilderProfile(userId: string) {
    const profile = await this.prisma.builderProfile.findUnique({
      where: { userId },
      include: {
        projects: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!profile) throw new NotFoundException('Builder profile not found');
    return profile;
  }

  /**
   * POST /projects
   * Builder creates a new project listing
   */
  async createProject(
    userId: string,
    dto: {
      name: string;
      description?: string;
      location: string;
      city: string;
      state: string;
      pincode: string;
      latitude?: number;
      longitude?: number;
      startingPrice?: number;
      constructionStatus?: string;
      possessionDate?: string;
      brochureUrl?: string;
      reraNumber?: string;
      totalUnits?: number;
      availableUnits?: number;
      amenities?: string[];
      floorPlans?: any;
      photos?: string[];
    },
  ) {
    const builderProfile = await this.prisma.builderProfile.findUnique({ where: { userId } });
    if (!builderProfile) {
      throw new ForbiddenException('You must be a registered builder to create projects. Please register first via POST /builders/register');
    }

    const validStatuses = ['UPCOMING', 'UNDER_CONSTRUCTION', 'READY_TO_MOVE', 'COMPLETED'];
    const status = dto.constructionStatus?.toUpperCase() ?? 'UNDER_CONSTRUCTION';
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid constructionStatus. Valid: ${validStatuses.join(', ')}`);
    }

    return this.prisma.project.create({
      data: {
        builderProfileId: builderProfile.id,
        name: dto.name,
        description: dto.description,
        location: dto.location,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        startingPrice: dto.startingPrice,
        constructionStatus: status as any,
        possessionDate: dto.possessionDate ? new Date(dto.possessionDate) : null,
        brochureUrl: dto.brochureUrl,
        reraNumber: dto.reraNumber,
        totalUnits: dto.totalUnits,
        availableUnits: dto.availableUnits,
        amenities: dto.amenities ?? [],
        floorPlans: dto.floorPlans ?? null,
        photos: dto.photos ?? [],
      },
    });
  }

  /**
   * GET /projects
   * List all active projects (public, optionally filtered by city)
   */
  async listProjects(city?: string, status?: string) {
    return this.prisma.project.findMany({
      where: {
        isActive: true,
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        ...(status ? { constructionStatus: status.toUpperCase() as any } : {}),
      },
      include: {
        builderProfile: {
          select: { companyName: true, logoUrl: true, isVerified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * GET /projects/:id
   */
  async getProjectById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        builderProfile: {
          select: { companyName: true, logoUrl: true, websiteUrl: true, isVerified: true, established: true },
        },
        enquiries: { select: { id: true, status: true, createdAt: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  /**
   * POST /projects/:id/enquiry
   * Submit enquiry for a project (reuses Lead-like logic)
   */
  async submitEnquiry(
    userId: string,
    projectId: string,
    dto: { message?: string; phone?: string },
  ) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const existing = await this.prisma.projectEnquiry.findFirst({
      where: { projectId, userId },
    });
    if (existing) {
      // Update status back to NEW for re-inquiry
      return this.prisma.projectEnquiry.update({
        where: { id: existing.id },
        data: { status: 'NEW', message: dto.message ?? existing.message },
      });
    }

    return this.prisma.projectEnquiry.create({
      data: { projectId, userId, message: dto.message, phone: dto.phone, status: 'NEW' },
    });
  }

  /**
   * PATCH /projects/:id
   * Builder updates project listing
   */
  async updateProject(userId: string, projectId: string, dto: Partial<{
    name: string;
    description: string;
    startingPrice: number;
    constructionStatus: string;
    possessionDate: string;
    availableUnits: number;
    amenities: string[];
    photos: string[];
    floorPlans: any;
    isActive: boolean;
  }>) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { builderProfile: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.builderProfile.userId !== userId) {
      throw new ForbiddenException('You can only edit your own projects');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...dto,
        ...(dto.constructionStatus ? { constructionStatus: dto.constructionStatus.toUpperCase() as any } : {}),
        ...(dto.possessionDate ? { possessionDate: new Date(dto.possessionDate) } : {}),
      },
    });
  }
}
