import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * GET /agents/me/properties
   * Get all properties this agent manages
   */
  async getMyProperties(agentId: string) {
    const associations = await this.prisma.agentProperty.findMany({
      where: { agentId, status: 'ACTIVE' },
      include: {
        property: {
          include: {
            photos: { where: { isPrimary: true }, take: 1 },
            ownerProfile: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return associations.map((a) => ({ ...a.property, agentSplitPercent: a.splitPercent }));
  }

  /**
   * POST /agents/properties/:propertyId/associate
   * Link agent to a property. Sends consent request to owner.
   */
  async associateProperty(
    agentId: string,
    propertyId: string,
    dto: { splitPercent?: number },
  ) {
    // Confirm agent role
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId },
      include: { agentProfile: true },
    });
    if (!agent || agent.role !== 'AGENT') {
      throw new ForbiddenException('Only agents can associate with properties');
    }

    // Confirm property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { ownerProfile: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== 'ACTIVE') {
      throw new BadRequestException('Property is not active');
    }

    // Check no existing active association
    const existing = await this.prisma.agentProperty.findFirst({
      where: { agentId, propertyId, status: { in: ['PENDING', 'ACTIVE'] } },
    });
    if (existing) {
      throw new BadRequestException('Association already exists or is pending');
    }

    return this.prisma.agentProperty.create({
      data: {
        agentId,
        propertyId,
        splitPercent: dto.splitPercent ?? 1.0,
        status: 'PENDING', // Owner must approve
      },
    });
  }

  /**
   * PATCH /agents/properties/:assocId/approve  (called by owner)
   * Owner approves agent association
   */
  async approveAssociation(ownerId: string, assocId: string) {
    const assoc = await this.prisma.agentProperty.findUnique({
      where: { id: assocId },
      include: { property: { include: { ownerProfile: true } } },
    });
    if (!assoc) throw new NotFoundException('Association not found');
    if (assoc.property.ownerProfile.userId !== ownerId) {
      throw new ForbiddenException('Only the property owner can approve agent association');
    }

    return this.prisma.agentProperty.update({
      where: { id: assocId },
      data: { status: 'ACTIVE', ownerConsent: true, consentAt: new Date() },
    });
  }

  /**
   * GET /agents/me/leads
   * Lead pipeline for agent-managed properties
   */
  async getMyLeads(agentId: string) {
    const activeProperties = await this.prisma.agentProperty.findMany({
      where: { agentId, status: 'ACTIVE' },
      select: { propertyId: true },
    });
    const propertyIds = activeProperties.map((p) => p.propertyId);

    if (propertyIds.length === 0) return [];

    return this.prisma.lead.findMany({
      where: { propertyId: { in: propertyIds } },
      include: {
        property: { select: { title: true, city: true, locality: true } },
        customer: { select: { firstName: true, lastName: true } },
        agentNotes: { where: { agentId }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * PATCH /agents/leads/:leadId/notes
   * Add/update follow-up note on a lead
   */
  async addLeadNote(
    agentId: string,
    leadId: string,
    dto: { note: string; followUpAt?: string },
  ) {
    // Verify agent has access to this lead via property association
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const assoc = await this.prisma.agentProperty.findFirst({
      where: { agentId, propertyId: lead.propertyId, status: 'ACTIVE' },
    });
    if (!assoc) throw new ForbiddenException('You do not manage this property');

    return this.prisma.agentLeadNote.create({
      data: {
        agentId,
        leadId,
        note: dto.note,
        followUpAt: dto.followUpAt ? new Date(dto.followUpAt) : null,
      },
    });
  }

  /**
   * GET /agents/me/commission
   * Get commission split summary for agent
   */
  async getCommissionSummary(agentId: string) {
    const associations = await this.prisma.agentProperty.findMany({
      where: { agentId, status: 'ACTIVE' },
      select: { propertyId: true, splitPercent: true },
    });

    return {
      managedPropertiesCount: associations.length,
      associations: associations.map((a) => ({
        propertyId: a.propertyId,
        agentSplitPercent: a.splitPercent,
      })),
    };
  }
}
