import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private notifications: NotificationsService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async getMyNotifications(
    @CurrentUser('id') userId: string,
  ) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notifications.getUnreadCount(userId);
    return { count };
  }

  @Post('mark-all-read')
  async markAllRead(@CurrentUser('id') userId: string) {
    await this.notifications.markAllRead(userId);
    return { success: true };
  }

  @Post(':id/read')
  async markRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }
}
