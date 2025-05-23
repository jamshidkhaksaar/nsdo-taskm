import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
  Logger,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../rbac/guards/roles.guard";
import { Roles } from "../rbac/decorators/roles.decorator";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { User } from "../users/entities/user.entity";
import { ParseUUIDPipe } from "@nestjs/common";

@ApiTags("Admin")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "Leadership")
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Get admin dashboard statistics" })
  @ApiResponse({
    status: 200,
    description: "Dashboard statistics retrieved successfully",
  })
  getDashboardStats(@Request() req) {
    return this.adminService.getDashboardStats(req.user);
  }

  @Get("dashboard/tasks-overview")
  @Roles("admin", "Leadership")
  @ApiOperation({ summary: "Get aggregated task statistics for overview dashboard" })
  @ApiResponse({
    status: 200,
    description: "Task overview statistics retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  getTasksOverviewStats(@Request() req) {
    return this.adminService.getTasksOverviewStats(req.user as User);
  }

  @Get("dashboard/tasks-by-status")
  @Roles("admin", "Leadership")
  @ApiOperation({ summary: "Get tasks by status with pagination for overview dashboard tabs" })
  @ApiResponse({
    status: 200,
    description: "Paginated tasks by status retrieved successfully",
    type: "PaginatedTasksDto",
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  getTasksByStatus(
    @Query('status') status: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Request() req
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = Math.min(parseInt(limit, 10) || 10, 100); // Cap at 100 items per page
    
    // Validate status parameter
    const validStatuses = ['all', 'pending', 'in_progress', 'completed', 'cancelled', 'deleted', 'overdue'];
    const statusParam = validStatuses.includes(status) ? status : 'all';
    
    this.logger.log(`User ${req.user.username} (ID: ${req.user.id}) fetching ${statusParam} tasks, page ${pageNumber}, limit ${limitNumber}`);
    return this.adminService.getTasksByStatusWithPagination(statusParam as any, pageNumber, limitNumber, req.user as User);
  }

  @Get("health")
  @ApiOperation({ summary: "Get system health information" })
  @ApiResponse({
    status: 200,
    description: "System health retrieved successfully",
  })
  async getSystemHealth(@Request() req) {
    return this.adminService.getSystemHealth(req.user);
  }

  @Get("metrics")
  @ApiOperation({ summary: "Get system metrics and performance data" })
  @ApiResponse({
    status: 200,
    description: "System metrics retrieved successfully",
  })
  async getSystemMetrics() {
    return this.adminService.getSystemMetrics();
  }

  @Get("routes")
  @ApiOperation({ summary: "Get list of available API routes" })
  @ApiResponse({
    status: 200,
    description: "Available routes retrieved successfully",
  })
  getAvailableRoutes() {
    return this.adminService.getAvailableRoutes();
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Get("users")
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "All users retrieved successfully" })
  getAllUsers(@Query("search") search?: string) {
    return this.adminService.getAllUsers(search);
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Get("departments")
  @ApiOperation({ summary: "Get all departments" })
  @ApiResponse({
    status: 200,
    description: "All departments retrieved successfully",
  })
  getAllDepartments(@Query("search") search?: string) {
    return this.adminService.getAllDepartments(search);
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Get("tasks")
  @ApiOperation({ summary: "Get all tasks" })
  @ApiResponse({ status: 200, description: "All tasks retrieved successfully" })
  getAllTasks(@Query("search") search?: string) {
    return this.adminService.getAllTasks(search);
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Get("logs")
  @ApiOperation({ summary: "Get activity logs" })
  @ApiResponse({
    status: 200,
    description: "Activity logs retrieved successfully",
  })
  getActivityLogs(
    @Request() req,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("action") action?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    return this.adminService.getActivityLogs(
      {
        startDate,
        endDate,
        action,
        status,
        search,
      },
      req.user,
    );
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Delete("logs")
  @ApiOperation({ summary: "Clear all activity logs" })
  @ApiResponse({ status: 200, description: "All logs cleared successfully" })
  clearAllLogs() {
    return this.adminService.clearAllLogs();
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Get("settings")
  @ApiOperation({ summary: "Get system settings" })
  @ApiResponse({
    status: 200,
    description: "System settings retrieved successfully",
  })
  getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Patch("settings")
  @ApiOperation({ summary: "Update system settings" })
  @ApiResponse({
    status: 200,
    description: "System settings updated successfully",
  })
  updateSystemSettings(@Body() settings: any) {
    return this.adminService.updateSystemSettings(settings);
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Post("backup")
  @ApiOperation({ summary: "Create a system backup" })
  @ApiResponse({ status: 201, description: "Backup created successfully" })
  createBackup(
    @Body() backupOptions: { type: "full" | "partial"; location?: string },
  ) {
    return this.adminService.createBackup(backupOptions);
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Post("restore/:backupId")
  @ApiOperation({ summary: "Restore from a backup" })
  @ApiResponse({ status: 200, description: "System restored successfully" })
  restoreBackup(@Param("backupId") backupId: string) {
    return this.adminService.restoreBackup(backupId);
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Get("backups")
  @ApiOperation({ summary: "Get all backups" })
  @ApiResponse({
    status: 200,
    description: "All backups retrieved successfully",
  })
  getBackups() {
    return this.adminService.getBackups();
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Delete("backups/:backupId")
  @ApiOperation({ summary: "Delete a backup" })
  @ApiResponse({ status: 200, description: "Backup deleted successfully" })
  deleteBackup(@Param("backupId") backupId: string) {
    return this.adminService.deleteBackup(backupId);
  }

  @Post("users/:targetUserId/reset-2fa")
  @Roles("admin")
  @ApiOperation({ summary: "Admin: Reset a user's Two-Factor Authentication" })
  @ApiResponse({ status: 200, description: "User 2FA reset successfully." })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Target user not found." })
  async adminResetUser2FA(
    @Request() req,
    @Param("targetUserId", ParseUUIDPipe) targetUserId: string,
  ) {
    this.logger.log(
      `Admin user ${req.user.username} (ID: ${req.user.userId}) requested 2FA reset for user ID: ${targetUserId}`,
    );
    await this.adminService.adminResetUser2FA(targetUserId, req.user as User);
    return { message: "User 2FA has been successfully reset." };
  }

  @Post("tasks/archive-completed")
  @Roles("admin")
  @ApiOperation({ summary: "Archive all completed tasks (move to recycle bin)" })
  @ApiResponse({ status: 200, description: "Completed tasks archived successfully.", type: Object })
  @ApiResponse({ status: 403, description: "Forbidden." })
  async archiveCompletedTasks(@Request() req) {
    this.logger.log(`User ${req.user.username} (ID: ${req.user.userId}) initiated archiving of completed tasks.`);
    return this.adminService.archiveCompletedTasks(req.user as User);
  }

  @Delete("tasks/wipe-all")
  @Roles("admin")
  @ApiOperation({ summary: "Permanently wipe ALL tasks from the system" })
  @ApiResponse({ status: 200, description: "All tasks wiped successfully.", type: Object })
  @ApiResponse({ status: 403, description: "Forbidden." })
  async wipeAllTasks(@Request() req) {
    this.logger.warn(`User ${req.user.username} (ID: ${req.user.userId}) initiated WIPE ALL TASKS. This is a destructive operation.`);
    return this.adminService.wipeAllTasks(req.user as User);
  }

  @Delete("tasks/recycle-bin/wipe-all")
  @Roles("admin")
  @ApiOperation({ summary: "Permanently wipe ALL items from the recycle bin" })
  @ApiResponse({ status: 200, description: "Recycle bin wiped successfully.", type: Object })
  @ApiResponse({ status: 403, description: "Forbidden." })
  async wipeRecycleBin(@Request() req) {
    this.logger.log(`User ${req.user.username} (ID: ${req.user.userId}) initiated wiping of the task recycle bin.`);
    return this.adminService.wipeRecycleBin(req.user as User);
  }
}
