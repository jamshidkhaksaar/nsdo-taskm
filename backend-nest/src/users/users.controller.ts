import { Controller, Get, UseGuards, Request, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    this.logger.log('Getting all users');
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
} 