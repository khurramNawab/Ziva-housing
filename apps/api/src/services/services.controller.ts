import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all service categories (public)' })
  getCategories() {
    return this.servicesService.getCategories();
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get services list (public, optional filter by category slug)' })
  getServices(@Query('category') categorySlug?: string) {
    return this.servicesService.getServices(categorySlug);
  }

  @Public()
  @Get('providers/public')
  @ApiOperation({ summary: 'Get public bookable verified providers (strict verification enforcement)' })
  getPublicBookableProviders(@Query('category') categoryName?: string) {
    return this.servicesService.getPublicBookableProviders(categoryName);
  }

  @ApiBearerAuth()
  @Get('provider/profile')
  @ApiOperation({ summary: 'Get current logged-in vendor profile and verification status' })
  getProviderProfile(@CurrentUser('id') userId: string) {
    return this.servicesService.getProviderProfile(userId);
  }

  @ApiBearerAuth()
  @Post('providers/onboard')
  @ApiOperation({ summary: 'Onboard current user as a Service Provider' })
  onboardProvider(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      serviceArea: string[];
      categoryName?: string;
      idProofUrl?: string;
      addressProofUrl?: string;
      certificateUrl?: string;
    },
  ) {
    return this.servicesService.onboardProvider(userId, dto);
  }

  @ApiBearerAuth()
  @Post('provider/onboard')
  @ApiOperation({ summary: 'Onboard current user as a Service Provider (alias)' })
  onboardProviderAlias(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      serviceArea: string[];
      categoryName?: string;
      idProofUrl?: string;
      addressProofUrl?: string;
      certificateUrl?: string;
    },
  ) {
    return this.servicesService.onboardProvider(userId, dto);
  }

  @ApiBearerAuth()
  @Patch('provider/resubmit')
  @ApiOperation({ summary: 'Resubmit vendor application after changes requested' })
  resubmitProviderProfile(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      serviceArea?: string[];
      idProofUrl?: string;
      addressProofUrl?: string;
      certificateUrl?: string;
      notes?: string;
    },
  ) {
    return this.servicesService.resubmitProviderProfile(userId, dto);
  }

  @ApiBearerAuth()
  @Post('bookings')
  @ApiOperation({ summary: 'Book a home service (Customer only)' })
  createBooking(
    @CurrentUser('id') userId: string,
    @Body() dto: { serviceId: string; scheduledAt: string; address: string; city: string; pincode: string; notes?: string },
  ) {
    return this.servicesService.createBooking(userId, dto);
  }

  @ApiBearerAuth()
  @Get('bookings/my')
  @ApiOperation({ summary: 'Get bookings list for current customer/provider' })
  getMyBookings(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.servicesService.getMyBookings(userId, role);
  }

  @ApiBearerAuth()
  @Get('bookings/open')
  @ApiOperation({ summary: 'Get unassigned pending bookings' })
  getOpenBookings() {
    return this.servicesService.getOpenBookings();
  }

  @ApiBearerAuth()
  @Patch('bookings/:id/status')
  @ApiOperation({ summary: 'Update booking status (Assign provider or claim/cancel jobs)' })
  updateBookingStatus(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') bookingId: string,
    @Body() body: { status: string },
  ) {
    return this.servicesService.updateBookingStatus(userId, role, bookingId, body.status);
  }
}
