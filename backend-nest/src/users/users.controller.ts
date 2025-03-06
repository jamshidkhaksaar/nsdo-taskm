import { Controller, Get, Post, Body, UseGuards, Request, Logger, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from './entities/user.entity';

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

  @Post()
  async createUser(@Body() createUserDto: any) {
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
} 