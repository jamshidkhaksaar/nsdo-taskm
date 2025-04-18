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
  Inject
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health information' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics and performance data' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved successfully' })
  async getSystemMetrics() {
    return this.adminService.getSystemMetrics();
  }

  @Get('routes')
  @ApiOperation({ summary: 'Get list of available API routes' })
  @ApiResponse({ status: 200, description: 'Available routes retrieved successfully' })
  getAvailableRoutes() {
    return this.adminService.getAvailableRoutes();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'All users retrieved successfully' })
  getAllUsers(@Query('search') search?: string) {
    return this.adminService.getAllUsers(search);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('departments')
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({ status: 200, description: 'All departments retrieved successfully' })
  getAllDepartments(@Query('search') search?: string) {
    return this.adminService.getAllDepartments(search);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('tasks')
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'All tasks retrieved successfully' })
  getAllTasks(@Query('search') search?: string) {
    return this.adminService.getAllTasks(search);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('logs')
  @ApiOperation({ summary: 'Get activity logs' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  getActivityLogs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('action') action?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getActivityLogs({
      startDate,
      endDate,
      action,
      status,
      search,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('logs')
  @ApiOperation({ summary: 'Clear all activity logs' })
  @ApiResponse({ status: 200, description: 'All logs cleared successfully' })
  clearAllLogs() {
    return this.adminService.clearAllLogs();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({ status: 200, description: 'System settings retrieved successfully' })
  getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('settings')
  @ApiOperation({ summary: 'Update system settings' })
  @ApiResponse({ status: 200, description: 'System settings updated successfully' })
  updateSystemSettings(@Body() settings: any) {
    return this.adminService.updateSystemSettings(settings);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('backup')
  @ApiOperation({ summary: 'Create a system backup' })
  @ApiResponse({ status: 201, description: 'Backup created successfully' })
  createBackup(@Body() backupOptions: { type: 'full' | 'partial', location?: string }) {
    return this.adminService.createBackup(backupOptions);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('restore/:backupId')
  @ApiOperation({ summary: 'Restore from a backup' })
  @ApiResponse({ status: 200, description: 'System restored successfully' })
  restoreBackup(@Param('backupId') backupId: string) {
    return this.adminService.restoreBackup(backupId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('backups')
  @ApiOperation({ summary: 'Get all backups' })
  @ApiResponse({ status: 200, description: 'All backups retrieved successfully' })
  getBackups() {
    return this.adminService.getBackups();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('backups/:backupId')
  @ApiOperation({ summary: 'Delete a backup' })
  @ApiResponse({ status: 200, description: 'Backup deleted successfully' })
  deleteBackup(@Param('backupId') backupId: string) {
    return this.adminService.deleteBackup(backupId);
  }
} 