import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() body: {
      leadId?: string;
      serviceBookingId?: string;
      reviewedUserId?: string;
      targetType: string;
      rating: number;
      comment?: string;
    },
  ) {
    return this.reviewsService.createReview(userId, body);
  }
}
