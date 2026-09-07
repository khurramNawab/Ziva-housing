import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { SearchService } from './search.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertySearchDto } from './dto/property-search.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(
    private propertiesService: PropertiesService,
    private searchService: SearchService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search & filter properties (public)' })
  search(
    @Query() dto: PropertySearchDto,
    @Headers('x-user-city') xUserCity?: string,
    @Req() req?: any,
  ) {
    let userId: string | undefined;
    const authHeader = req?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payloadStr = token.split('.')[1];
        if (payloadStr) {
          const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf8'));
          userId = payload.sub || payload.id;
        }
      } catch (err) {
        // ignore malformed tokens in public endpoints
      }
    }
    return this.searchService.search(dto, xUserCity, userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get property detail — owner contact info NEVER included' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.findOne(id, userId);
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create property listing (Owner only)' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(userId, dto);
  }

  @ApiBearerAuth()
  @Get('my/listings')
  @ApiOperation({ summary: 'Get owner\'s own listings with admin notes' })
  myListings(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.propertiesService.findMyProperties(userId, +page, +limit);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update property (Owner only)' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, userId, dto);
  }

  @ApiBearerAuth()
  @Post(':id/submit-review')
  @ApiOperation({ summary: 'Submit draft property for admin review' })
  submitForReview(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.submitForReview(id, userId);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Archive / delete property (Owner only)' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.remove(id, userId);
  }
}
