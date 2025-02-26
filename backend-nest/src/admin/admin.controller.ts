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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getAllUsers(@Query('search') search?: string) {
    return this.adminService.getAllUsers(search);
  }

  @Get('departments')
  getAllDepartments(@Query('search') search?: string) {
    return this.adminService.getAllDepartments(search);
  }

  @Get('tasks')
  getAllTasks(@Query('search') search?: string) {
    return this.adminService.getAllTasks(search);
  }

  @Get('logs')
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

  @Delete('logs')
  clearAllLogs() {
    return this.adminService.clearAllLogs();
  }

  @Get('settings')
  getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Patch('settings')
  updateSystemSettings(@Body() settings: any) {
    return this.adminService.updateSystemSettings(settings);
  }

  @Post('backup')
  createBackup(@Body() backupOptions: { type: 'full' | 'partial', location?: string }) {
    return this.adminService.createBackup(backupOptions);
  }

  @Post('restore/:backupId')
  restoreBackup(@Param('backupId') backupId: string) {
    return this.adminService.restoreBackup(backupId);
  }

  @Get('backups')
  getBackups() {
    return this.adminService.getBackups();
  }

  @Delete('backups/:backupId')
  deleteBackup(@Param('backupId') backupId: string) {
    return this.adminService.deleteBackup(backupId);
  }
} 