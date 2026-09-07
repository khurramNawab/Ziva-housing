import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ContactScannerService } from './contact-scanner.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ChatController],
  providers: [ChatGateway, ContactScannerService, ChatService],
  exports: [ContactScannerService],
})
export class ChatModule {}
