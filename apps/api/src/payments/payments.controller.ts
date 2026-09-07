import { Controller, Post, Get, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @Post('create-order')
  createOrder(
    @CurrentUser('id') userId: string,
    @Body() body: { leadId: string; amount: number },
  ) {
    return this.paymentsService.createOrder(body.leadId, userId, body.amount);
  }

  @ApiBearerAuth()
  @Post('mock-success')
  mockSuccess(
    @CurrentUser('id') userId: string,
    @Body() body: { transactionId: string },
  ) {
    return this.paymentsService.mockPaymentSuccess(body.transactionId);
  }

  @ApiBearerAuth()
  @Get('commission-preview')
  previewCommission(@Body() body: { amount: number; type: 'PROPERTY_SELL' | 'PROPERTY_RENT' | 'SERVICE_BOOKING' }) {
    return this.paymentsService.calculateCommission(body.amount, body.type);
  }

  @ApiBearerAuth()
  @Get('my-transactions')
  getMyTransactions(@CurrentUser('id') userId: string) {
    return this.paymentsService.getTransactions(userId);
  }

  @Public()
  @Post('webhook/razorpay')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const payload = req.rawBody?.toString() || '';
    return this.paymentsService.handleWebhook(payload, signature);
  }
}
