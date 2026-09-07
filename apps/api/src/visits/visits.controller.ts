import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('visits')
@ApiBearerAuth()
@Controller('visits')
export class VisitsController {
  constructor(private visitsService: VisitsService) {}

  @Post()
  requestVisit(
    @CurrentUser('id') userId: string,
    @Body() body: { leadId: string; scheduledAt: string; notes?: string },
  ) {
    return this.visitsService.requestVisit(userId, body);
  }

  @Get()
  getMyVisits(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.visitsService.getMyVisits(userId, role);
  }

  @Patch(':id/accept')
  accept(
    @Param('id') visitId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.respondToVisit(visitId, userId, 'ACCEPTED');
  }

  @Patch(':id/reject')
  reject(
    @Param('id') visitId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.visitsService.respondToVisit(visitId, userId, 'REJECTED', body.reason);
  }

  @Patch(':id/complete')
  complete(
    @Param('id') visitId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.completeVisit(visitId, userId);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Param('id') visitId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { scheduledAt: string },
  ) {
    return this.visitsService.rescheduleVisit(visitId, body.scheduledAt, userId);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') visitId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.cancelVisit(visitId, userId);
  }
}
