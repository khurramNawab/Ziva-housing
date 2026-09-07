import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser('id') adminId: string) {
    return this.adminService.getDashboard(adminId);
  }

  // ─── Property Approvals queue ─────────────────────────────────────────────
  @Get('properties/pending')
  @ApiOperation({ summary: 'Get properties awaiting admin review' })
  getPendingProperties(
    @CurrentUser('id') adminId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.getPendingProperties(adminId, +page, +limit);
  }

  @Post('properties/:id/approve')
  approveProperty(
    @CurrentUser('id') adminId: string,
    @Param('id') propertyId: string,
    @Body() body: { adminNotes?: string },
  ) {
    return this.adminService.reviewProperty(adminId, propertyId, 'APPROVE', body);
  }

  @Post('properties/:id/reject')
  rejectProperty(
    @CurrentUser('id') adminId: string,
    @Param('id') propertyId: string,
    @Body() body: { rejectionReason: string; adminNotes?: string },
  ) {
    return this.adminService.reviewProperty(adminId, propertyId, 'REJECT', body);
  }

  // ─── Property Management (All properties search & actions) ─────────────────
  @Get('properties')
  @ApiOperation({ summary: 'Get all properties with status and city filter (Admin only)' })
  getAllProperties(
    @CurrentUser('id') adminId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('city') city?: string,
  ) {
    return this.adminService.getAllProperties(adminId, +page, +limit, search, status, city);
  }

  @Post('properties/:id/suspend')
  @ApiOperation({ summary: 'Suspend a property listing (Admin only)' })
  suspendProperty(
    @CurrentUser('id') adminId: string,
    @Param('id') propertyId: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminService.setPropertyStatus(adminId, propertyId, 'SUSPENDED', body.notes);
  }

  @Post('properties/:id/unsuspend')
  @ApiOperation({ summary: 'Unsuspend a property listing (Admin only)' })
  unsuspendProperty(
    @CurrentUser('id') adminId: string,
    @Param('id') propertyId: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminService.setPropertyStatus(adminId, propertyId, 'ACTIVE', body.notes);
  }

  @Delete('properties/:id')
  @ApiOperation({ summary: 'Soft delete a property listing (Admin only)' })
  deleteProperty(
    @CurrentUser('id') adminId: string,
    @Param('id') propertyId: string,
  ) {
    return this.adminService.deleteProperty(adminId, propertyId);
  }

  // ─── Leads CRM ─────────────────────────────────────────────────────────────
  @Get('leads')
  @ApiOperation({ summary: 'Full Lead CRM view — admin sees all flagged messages' })
  getAllLeads(
    @CurrentUser('id') adminId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('city') city?: string,
  ) {
    return this.adminService.getAllLeads(adminId, +page, +limit, { status, city });
  }

  @Post('leads')
  @ApiOperation({ summary: 'Create a new lead from admin CRM panel' })
  createLead(
    @CurrentUser('id') adminId: string,
    @Body() body: { propertyId: string; customerId: string; status?: string; notes?: string },
  ) {
    return this.adminService.createLead(adminId, body);
  }

  @Patch('leads/:id/status')
  @ApiOperation({ summary: 'Update lead status from admin CRM panel' })
  updateLeadStatus(
    @CurrentUser('id') adminId: string,
    @Param('id') leadId: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.adminService.updateLeadStatus(adminId, leadId, body.status, body.reason);
  }

  @Patch('leads/:id/stage')
  @ApiOperation({ summary: 'Update lead stage alias from admin CRM panel' })
  updateLeadStage(
    @CurrentUser('id') adminId: string,
    @Param('id') leadId: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.adminService.updateLeadStatus(adminId, leadId, body.status, body.reason);
  }

  // ─── User Management ──────────────────────────────────────────────────────
  @Get('users')
  getUsers(
    @CurrentUser('id') adminId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.getUsers(adminId, +page, +limit, search, role);
  }

  @Post('users/:id/action')
  userAction(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
    @Body() body: { action: string; reason?: string },
  ) {
    return this.adminService.userAction(adminId, userId, body.action, body.reason);
  }

  // ─── Vendor Onboarding ─────────────────────────────────────────────────────
  @Get('vendors/pending')
  @ApiOperation({ summary: 'Get all service providers awaiting verification (Admin only)' })
  getPendingVendors(@CurrentUser('id') adminId: string) {
    return this.adminService.getPendingVendors(adminId);
  }

  @Get('vendors/approved')
  @ApiOperation({ summary: 'Get all active service providers (Admin only)' })
  getApprovedVendors(@CurrentUser('id') adminId: string) {
    return this.adminService.getApprovedVendors(adminId);
  }

  @Post('vendors/:id/approve')
  @ApiOperation({ summary: 'Approve vendor general documents (Admin only)' })
  approveVendor(
    @CurrentUser('id') adminId: string,
    @Param('id') vendorUserId: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminService.vendorAction(adminId, vendorUserId, 'APPROVE', body.notes);
  }

  @Post('vendors/:id/changes-requested')
  @ApiOperation({ summary: 'Request changes for vendor documents (Admin only)' })
  changesRequestedVendor(
    @CurrentUser('id') adminId: string,
    @Param('id') vendorUserId: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminService.vendorAction(adminId, vendorUserId, 'CHANGES_REQUESTED', body.notes);
  }

  @Post('vendors/:id/reject')
  @ApiOperation({ summary: 'Reject vendor onboarding (Admin only)' })
  rejectVendor(
    @CurrentUser('id') adminId: string,
    @Param('id') vendorUserId: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminService.vendorAction(adminId, vendorUserId, 'REJECT', body.notes);
  }

  @Post('vendors/:id/background-check')
  @ApiOperation({ summary: 'Update vendor Trust & Safety background check status (Admin only)' })
  vendorBackgroundCheck(
    @CurrentUser('id') adminId: string,
    @Param('id') vendorUserId: string,
    @Body() body: { status: 'PASSED' | 'FAILED'; notes?: string },
  ) {
    return this.adminService.vendorBackgroundCheckAction(adminId, vendorUserId, body.status, body.notes);
  }

  @Post('vendors/create')
  @ApiOperation({ summary: 'Create a new vendor user + profile from admin panel (Admin only)' })
  createVendor(
    @CurrentUser('id') adminId: string,
    @Body() body: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      categoryName: string;
      serviceArea: string[];
      requiresBackgroundCheck?: boolean;
      bankAccountName?: string;
      bankAccountNo?: string;
      bankIfscCode?: string;
      idProofUrl?: string;
      addressProofUrl?: string;
      certificateUrl?: string;
      autoApprove?: boolean;
    },
  ) {
    return this.adminService.createVendor(adminId, body);
  }

  @Patch('vendors/:id/profile')
  @ApiOperation({ summary: 'Update vendor profile fields from admin panel (Admin only)' })
  updateVendorProfile(
    @CurrentUser('id') adminId: string,
    @Param('id') vendorUserId: string,
    @Body() body: {
      categoryName?: string;
      serviceArea?: string[];
      requiresBackgroundCheck?: boolean;
      bankAccountName?: string;
      bankAccountNo?: string;
      bankIfscCode?: string;
      idProofUrl?: string;
      addressProofUrl?: string;
      certificateUrl?: string;
      rating?: number;
      totalJobs?: number;
      verificationNotes?: string;
    },
  ) {
    return this.adminService.updateVendorProfile(adminId, vendorUserId, body);
  }

  // ─── Commission Configurator & Invoicing ───────────────────────────────────
  @Get('commissions/rules')
  @ApiOperation({ summary: 'Get all commission rules (Admin only)' })
  getCommissionRules(@CurrentUser('id') adminId: string) {
    return this.adminService.getCommissionRules(adminId);
  }

  @Post('commissions/rules')
  @ApiOperation({ summary: 'Create commission rule slab (Admin only)' })
  createCommissionRule(
    @CurrentUser('id') adminId: string,
    @Body() body: { name: string; type: string; rate: number; minAmount?: number; maxAmount?: number; applicableTo: string },
  ) {
    return this.adminService.createCommissionRule(adminId, body);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get list of system transactions invoices (Admin only)' })
  getInvoices(@CurrentUser('id') adminId: string) {
    return this.adminService.getInvoices(adminId);
  }

  @Get('commissions/stats')
  @ApiOperation({ summary: 'Get system commission aggregate stats (Admin only)' })
  getCommissionStats(@CurrentUser('id') adminId: string) {
    return this.adminService.getCommissionStats(adminId);
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────────
  @Get('audit-logs')
  getAuditLogs(
    @CurrentUser('id') adminId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.adminService.getAuditLogs(adminId, +page, +limit, action, entityType);
  }

  @Patch('leads/:id/stage')
  @ApiOperation({ summary: 'Override lead status stage (Admin only)' })
  overrideLeadStage(
    @CurrentUser('id') adminId: string,
    @Param('id') leadId: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.adminService.overrideLeadStage(adminId, leadId, body.status, body.reason);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get all fraud and bypass alerts (Admin only)' })
  getAdminAlerts(@CurrentUser('id') adminId: string) {
    return this.adminService.getAdminAlerts(adminId);
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create a manual compliance or system alert (Admin only)' })
  createAdminAlert(
    @CurrentUser('id') adminId: string,
    @Body() body: { type: string; severity: string; details: string; entityType?: string; entityId?: string },
  ) {
    return this.adminService.createAdminAlert(adminId, body);
  }

  @Post('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve or toggle a system alert (Admin only)' })
  resolveAlert(
    @CurrentUser('id') adminId: string,
    @Param('id') alertId: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminService.resolveAlert(adminId, alertId, body.notes);
  }

  @Delete('alerts/:id')
  @ApiOperation({ summary: 'Delete or dismiss an alert permanently (Admin only)' })
  deleteAdminAlert(
    @CurrentUser('id') adminId: string,
    @Param('id') alertId: string,
  ) {
    return this.adminService.deleteAdminAlert(adminId, alertId);
  }

  @Get('bypass-incidents')
  @ApiOperation({ summary: 'Get all chat bypass policy incidents (Admin only)' })
  getBypassIncidents(@CurrentUser('id') adminId: string) {
    return this.adminService.getBypassIncidents(adminId);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get system settings (Admin only)' })
  getSystemSettings(@CurrentUser('id') adminId: string) {
    return this.adminService.getSystemSettings(adminId);
  }

  @Patch('settings/:key')
  @ApiOperation({ summary: 'Update system setting key/value (Admin only)' })
  updateSystemSetting(
    @CurrentUser('id') adminId: string,
    @Param('key') key: string,
    @Body() body: { value: string },
  ) {
    return this.adminService.updateSystemSetting(adminId, key, body.value);
  }

  // ─── Broadcast Notifications Sender ───────────────────────────────────────
  @Post('notifications/broadcast')
  @ApiOperation({ summary: 'Broadcast notification to target audience (Admin only)' })
  broadcastNotification(
    @CurrentUser('id') adminId: string,
    @Body() body: {
      audience: 'ALL' | 'CUSTOMERS' | 'OWNERS' | 'VENDORS' | 'AGENTS';
      title: string;
      body: string;
    },
  ) {
    return this.adminService.broadcastNotification(adminId, body.audience, body.title, body.body);
  }

  // ─── Vendor Payout Ledger ──────────────────────────────────────────────────
  @Get('payouts')
  @ApiOperation({ summary: 'Get all vendor payouts & stats (Admin only)' })
  getPayouts(@CurrentUser('id') adminId: string) {
    return this.adminService.getPayouts(adminId);
  }

  @Post('payouts/:id/release')
  @ApiOperation({ summary: 'Release payout to vendor (Admin only)' })
  releasePayout(
    @CurrentUser('id') adminId: string,
    @Param('id') payoutId: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminService.releasePayout(adminId, payoutId, body.notes);
  }

  // ─── Service Booking Dispatcher ───────────────────────────────────────────
  @Get('service-bookings')
  @ApiOperation({ summary: 'Get all service bookings for dispatcher (Admin only)' })
  getAllServiceBookings(@CurrentUser('id') adminId: string) {
    return this.adminService.getAllServiceBookings(adminId);
  }

  @Post('service-bookings/:id/reassign')
  @ApiOperation({ summary: 'Reassign service booking to vendor (Admin only)' })
  reassignServiceBooking(
    @CurrentUser('id') adminId: string,
    @Param('id') bookingId: string,
    @Body() body: { newProviderId: string },
  ) {
    return this.adminService.reassignServiceBooking(adminId, bookingId, body.newProviderId);
  }
}

