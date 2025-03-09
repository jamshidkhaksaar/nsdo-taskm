import { Controller, Get, Put, Body, UseGuards, Request, Logger, BadRequestException, Inject, forwardRef, UnauthorizedException, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { ActivityLogService } from '../admin/services/activity-log.service';
import * as bcrypt from 'bcrypt';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);
  
  constructor(
    private readonly profileService: ProfileService,
    @Inject(forwardRef(() => ActivityLogService))
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Get('me')
  async getProfile(@Request() req) {
    const userId = req.user.id;
    this.logger.log(`Getting profile for user: ${userId}`);
    
    const profile = await this.profileService.getProfile(userId);
    
    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      'read',
      'profile',
      'User viewed their profile',
    );
    
    return profile;
  }

  @Put('me')
  async updateProfile(@Body() profileData: any, @Request() req) {
    const userId = req.user.id;
    this.logger.log(`Updating profile for user: ${userId}`);
    
    const updatedProfile = await this.profileService.updateProfile(userId, profileData);
    
    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      'update',
      'profile',
      'User updated their profile',
    );
    
    return updatedProfile;
  }
  
  @Patch('me/password')
  async updatePassword(@Body() passwordData: { currentPassword: string; newPassword: string }, @Request() req) {
    const userId = req.user.id;
    this.logger.log(`Updating password for user: ${userId}`);
    
    const { currentPassword, newPassword } = passwordData;
    
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Both current password and new password are required');
    }
    
    const passwordValid = await this.profileService.verifyPassword(userId, currentPassword);
    if (!passwordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    
    await this.profileService.updatePassword(userId, newPassword);
    
    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      'update',
      'password',
      'User updated their password',
    );
    
    return { 
      message: 'Password updated successfully' 
    };
  }
  
  @Patch('me/settings')
  async updateSettings(@Body() settingsData: any, @Request() req) {
    const userId = req.user.id;
    this.logger.log(`Updating settings for user: ${userId}`);
    
    const updatedSettings = await this.profileService.updateSettings(userId, settingsData);
    
    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      'update',
      'settings',
      'User updated their settings',
    );
    
    return updatedSettings;
  }
} 