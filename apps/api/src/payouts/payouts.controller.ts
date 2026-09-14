import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('payouts')
@ApiBearerAuth()
@Controller('payouts')
export class PayoutsController {
  constructor(private payoutsService: PayoutsService) {}

  @Get('my/earnings')
  @ApiOperation({ summary: 'Get earnings summary (provider / agent)' })
  getEarningsSummary(@CurrentUser('id') userId: string) {
    return this.payoutsService.getEarningsSummary(userId);
  }

  @Get('admin/pending')
  @ApiOperation({ summary: 'Admin: get all pending payouts' })
  getPendingPayouts() {
    return this.payoutsService.getPendingPayouts();
  }

  @Patch(':id/process')
  @ApiOperation({ summary: 'Admin: mark payout as processed' })
  processPayout(
    @CurrentUser('id') adminId: string,
    @Param('id') payoutId: string,
    @Body() body: { gatewayRef?: string },
  ) {
    return this.payoutsService.processPayout(adminId, payoutId, body.gatewayRef);
  }

  // ─── Premium listing plans ────────────────────────────────
  @Public()
  @Get('premium/plans')
  @ApiOperation({ summary: 'Get all premium listing plans (public)' })
  getPremiumPlans() {
    return this.payoutsService.getPremiumPlans();
  }

  @Post('premium/subscribe')
  @ApiOperation({ summary: 'Subscribe a property to a premium listing plan' })
  subscribePremium(
    @CurrentUser('id') userId: string,
    @Body() dto: { propertyId: string; planId: string },
  ) {
    return this.payoutsService.subscribePropertyToPremium(userId, dto);
  }
}
