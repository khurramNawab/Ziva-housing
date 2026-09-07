import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a lead (Contact Owner action — requires login)' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all my leads (customer or owner view)' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.leadsService.findAll(userId, role, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead detail with property, visits, and offers' })
  findOne(
    @Param('id') leadId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.leadsService.findOne(leadId, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update lead pipeline status' })
  updateStatus(
    @Param('id') leadId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateStatus(leadId, userId, dto);
  }
}
