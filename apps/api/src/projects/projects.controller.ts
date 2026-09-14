import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // ─── Builder registration ──────────────────────────────────
  @ApiBearerAuth()
  @Post('builders/register')
  @ApiOperation({ summary: 'Register as a builder' })
  registerBuilder(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      companyName: string;
      reraNumber?: string;
      websiteUrl?: string;
      logoUrl?: string;
      established?: number;
    },
  ) {
    return this.projectsService.registerBuilder(userId, dto);
  }

  @ApiBearerAuth()
  @Get('builders/me/profile')
  @ApiOperation({ summary: 'Get builder profile with all projects' })
  getBuilderProfile(@CurrentUser('id') userId: string) {
    return this.projectsService.getBuilderProfile(userId);
  }

  // ─── Project CRUD ──────────────────────────────────────────
  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active projects (public)' })
  listProjects(@Query('city') city?: string, @Query('status') status?: string) {
    return this.projectsService.listProjects(city, status);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get project details by ID (public)' })
  getProject(@Param('id') id: string) {
    return this.projectsService.getProjectById(id);
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Builder creates a new project listing' })
  createProject(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      name: string;
      description?: string;
      location: string;
      city: string;
      state: string;
      pincode: string;
      startingPrice?: number;
      constructionStatus?: string;
      possessionDate?: string;
      brochureUrl?: string;
      reraNumber?: string;
      totalUnits?: number;
      availableUnits?: number;
      amenities?: string[];
      floorPlans?: any;
      photos?: string[];
    },
  ) {
    return this.projectsService.createProject(userId, dto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Builder updates project listing' })
  updateProject(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.projectsService.updateProject(userId, id, dto);
  }

  @ApiBearerAuth()
  @Post(':id/enquiry')
  @ApiOperation({ summary: 'Submit enquiry for a project' })
  submitEnquiry(
    @CurrentUser('id') userId: string,
    @Param('id') projectId: string,
    @Body() dto: { message?: string; phone?: string },
  ) {
    return this.projectsService.submitEnquiry(userId, projectId, dto);
  }
}
