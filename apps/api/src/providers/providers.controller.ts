import { Controller, Get, Post, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('providers')
@ApiBearerAuth()
@Controller('providers')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Post('onboard')
  @ApiOperation({ summary: 'Full provider onboarding — profile + service + area' })
  onboard(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      serviceArea: string[];
      categoryName?: string;
      bankAccountName?: string;
      bankAccountNo?: string;
      bankIfscCode?: string;
    },
  ) {
    return this.providersService.onboard(userId, dto);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Update weekly availability calendar' })
  updateAvailability(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }>;
    },
  ) {
    return this.providersService.updateAvailability(userId, body.slots);
  }

  @Post('kyc')
  @ApiOperation({ summary: 'Submit a KYC verification document' })
  submitKyc(
    @CurrentUser('id') userId: string,
    @Body() dto: { docType: string; fileUrl: string },
  ) {
    return this.providersService.submitKyc(userId, dto);
  }

  @Get('me/profile')
  @ApiOperation({ summary: 'Get full provider profile with KYC docs and availability' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.providersService.getProfile(userId);
  }

  @Get('me/bookings')
  @ApiOperation({ summary: 'Get assigned service bookings for provider' })
  getMyBookings(@CurrentUser('id') userId: string) {
    return this.providersService.getMyBookings(userId);
  }
}
