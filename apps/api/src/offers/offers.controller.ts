import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('offers')
@ApiBearerAuth()
@Controller('offers')
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new purchase/rent offer or counter-offer' })
  createOffer(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: { leadId: string; offerAmount: number; validUntil: string; message?: string; parentOfferId?: string },
  ) {
    return this.offersService.createOffer(userId, role, dto);
  }

  @Get('leads/:leadId')
  @ApiOperation({ summary: 'Get offer history log for a lead' })
  getOffersByLead(
    @CurrentUser('id') userId: string,
    @Param('leadId') leadId: string,
  ) {
    return this.offersService.getOffersByLead(userId, leadId);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a specific offer (Owner only)' })
  acceptOffer(
    @CurrentUser('id') userId: string,
    @Param('id') offerId: string,
  ) {
    return this.offersService.acceptOffer(userId, offerId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a specific offer (Owner only)' })
  rejectOffer(
    @CurrentUser('id') userId: string,
    @Param('id') offerId: string,
  ) {
    return this.offersService.rejectOffer(userId, offerId);
  }
}
