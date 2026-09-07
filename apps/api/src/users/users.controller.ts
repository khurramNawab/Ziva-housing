import { Controller, Get, Patch, Body, Post, Ip } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: { firstName?: string; lastName?: string; profilePictureUrl?: string },
  ) {
    return this.usersService.updateProfile(userId, body);
  }

  @Post('accept-terms')
  @ApiOperation({ summary: 'Accept lead/commission terms (required before contacting owners/chatting)' })
  acceptTerms(
    @CurrentUser('id') userId: string,
    @Body() body: { version: string },
    @Ip() ipAddress: string,
  ) {
    return this.usersService.acceptTerms(userId, body.version, ipAddress);
  }
}
