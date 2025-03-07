import { Controller, Get, Post, Body, UseGuards, Request, Logger, BadRequestException, Param, Delete, Put, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ActivityLogService } from '../admin/services/activity-log.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ActivityLogService))
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Get()
  async getAllUsers(@Request() req) {
    this.logger.log('Getting all users');
    
    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      'view',
      'users',
      'User viewed all users',
    );
    
    const users = await this.usersService.findAll();
    // Map to only send necessary data without sensitive information
    return users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      first_name: user.username, // Using username as first_name since it's expected by frontend
      last_name: '' // Empty last_name as placeholder
    }));
  }

  @Get(':id')
  async getUserById(@Param('id') id: string, @Request() req) {
    this.logger.log(`Getting user with ID: ${id}`);
    
    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      'view',
      'user',
      `Viewed user details`,
      id,
    );
    
    const user = await this.usersService.findById(id);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      first_name: user.username, // Using username as first_name
      last_name: '',
      status: user.isActive ? 'active' : 'inactive',
      position: '',
      department: null
    };
  }

  @Post()
  async createUser(@Body() createUserDto: any, @Request() req) {
    this.logger.log(`Creating new user: ${JSON.stringify(createUserDto)}`);
    
    if (!createUserDto.username || !createUserDto.email || !createUserDto.password) {
      throw new BadRequestException('Username, email, and password are required');
    }
    
    // Default to USER role if not specified
    const role = createUserDto.role ? createUserDto.role as UserRole : UserRole.USER;
    
    const user = await this.usersService.create(
      createUserDto.username,
      createUserDto.email,
      createUserDto.password,
      role
    );
    
    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      'create',
      'user',
      `Created new user: ${user.username}`,
      user.id,
    );
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      first_name: createUserDto.first_name || user.username,
      last_name: createUserDto.last_name || '',
      // Include any other fields needed by the frontend
    };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    this.logger.log(`Deleting user with ID: ${id}`);
    // First verify the user exists
    const user = await this.usersService.findById(id);
    
    // We'll need to add a method to the service to delete users
    await this.usersService.deleteUser(id);
    
    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      'delete',
      'user',
      `Deleted user: ${user.username}`,
      id,
    );
    
    return { message: `User ${user.username} deleted successfully` };
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    this.logger.log(`Resetting password for user with ID: ${id}`);
    // First verify the user exists
    const user = await this.usersService.findById(id);
    
    // Generate a random password
    const newPassword = Math.random().toString(36).slice(-8);
    
    // Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    await this.usersService.updatePassword(id, hashedPassword);
    
    return { 
      message: `Password for ${user.username} has been reset`,
      newPassword: newPassword 
    };
  }

  @Post(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    this.logger.log(`Toggling status for user with ID: ${id}`);
    // First verify the user exists
    const user = await this.usersService.findById(id);
    
    // Toggle the active status
    const newStatus = !user.isActive;
    
    // Update the user's status
    await this.usersService.updateStatus(id, newStatus);
    
    return { 
      message: `Status for ${user.username} has been ${newStatus ? 'activated' : 'deactivated'}`,
      status: newStatus ? 'active' : 'inactive'
    };
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: any, @Request() req) {
    this.logger.log(`Updating user with ID: ${id}`);
    
    const updatedUser = await this.usersService.updateUser(id, updateUserDto);
    
    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      'update',
      'user',
      `Updated user: ${updatedUser.username}`,
      id,
    );
    
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      first_name: updateUserDto.first_name || updatedUser.username,
      last_name: updateUserDto.last_name || '',
    };
  }
} 