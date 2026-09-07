import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AssistanceService } from './assistance.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('assistance')
@ApiBearerAuth()
@Controller('assistance')
export class AssistanceController {
  constructor(private assistanceService: AssistanceService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Apply for home loan or legal verification help' })
  applyAssistance(
    @CurrentUser('id') userId: string,
    @Body() dto: { leadId: string; type: 'HOME_LOAN' | 'LEGAL_ASSISTANCE'; notes?: string },
  ) {
    return this.assistanceService.applyAssistance(userId, dto);
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket' })
  createTicket(
    @CurrentUser('id') userId: string,
    @Body() dto: { subject: string; description: string; category: string; priority?: string },
  ) {
    return this.assistanceService.createTicket(userId, dto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List all support tickets (Admin sees all, user sees own)' })
  getTickets(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.assistanceService.getTickets(userId, role);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get details and message history of a support ticket' })
  getTicketDetails(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.assistanceService.getTicketDetails(ticketId, userId, role);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Send a message in a support ticket thread' })
  addMessage(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() body: { message: string },
  ) {
    return this.assistanceService.addMessage(ticketId, userId, role, body.message);
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Update ticket status (Admin only)' })
  updateTicketStatus(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' },
  ) {
    return this.assistanceService.updateTicketStatus(ticketId, body.status, userId);
  }
}
