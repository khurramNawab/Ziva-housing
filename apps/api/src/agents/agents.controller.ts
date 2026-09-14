import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('agents')
@ApiBearerAuth()
@Controller('agents')
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get('me/properties')
  @ApiOperation({ summary: 'Get properties this agent manages' })
  getMyProperties(@CurrentUser('id') agentId: string) {
    return this.agentsService.getMyProperties(agentId);
  }

  @Post('properties/:propertyId/associate')
  @ApiOperation({ summary: 'Request to associate agent with a property' })
  associateProperty(
    @CurrentUser('id') agentId: string,
    @Param('propertyId') propertyId: string,
    @Body() body: { splitPercent?: number },
  ) {
    return this.agentsService.associateProperty(agentId, propertyId, body);
  }

  @Patch('properties/associations/:assocId/approve')
  @ApiOperation({ summary: 'Owner approves agent property association' })
  approveAssociation(
    @CurrentUser('id') ownerId: string,
    @Param('assocId') assocId: string,
  ) {
    return this.agentsService.approveAssociation(ownerId, assocId);
  }

  @Get('me/leads')
  @ApiOperation({ summary: 'Get lead pipeline for agent-managed properties' })
  getMyLeads(@CurrentUser('id') agentId: string) {
    return this.agentsService.getMyLeads(agentId);
  }

  @Patch('leads/:leadId/notes')
  @ApiOperation({ summary: 'Add follow-up note on a lead' })
  addLeadNote(
    @CurrentUser('id') agentId: string,
    @Param('leadId') leadId: string,
    @Body() body: { note: string; followUpAt?: string },
  ) {
    return this.agentsService.addLeadNote(agentId, leadId, body);
  }

  @Get('me/commission')
  @ApiOperation({ summary: 'Get commission split summary' })
  getCommissionSummary(@CurrentUser('id') agentId: string) {
    return this.agentsService.getCommissionSummary(agentId);
  }
}
