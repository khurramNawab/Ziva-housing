import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a property booking (token payment initiation)' })
  createBooking(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      propertyId: string;
      offerId?: string;
      agreedPrice: number;
      tokenAmount: number;
      notes?: string;
    },
  ) {
    return this.bookingsService.createBooking(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all my bookings (as buyer and seller)' })
  getMyBookings(@CurrentUser('id') userId: string) {
    return this.bookingsService.getMyBookings(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  getBookingById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.bookingsService.getBookingById(userId, id);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm a booking (seller only)' })
  confirmBooking(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.bookingsService.confirmBooking(userId, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  cancelBooking(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.cancelBooking(userId, id, body.reason);
  }
}
