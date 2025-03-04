import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User> {
    try {
      this.logger.log(`Looking for user with username: ${username}`);
      
      const user = await this.usersRepository.findOne({ where: { username } });
      
      if (!user) {
        this.logger.warn(`User with username ${username} not found`);
        throw new NotFoundException(`User with username ${username} not found`);
      }
      
      this.logger.log(`Found user with username: ${username}, ID: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Error finding user with username ${username}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<User> {
    try {
      this.logger.log(`Looking for user with ID: ${id}`);
      
      const user = await this.usersRepository.findOne({ where: { id } });
      
      if (!user) {
        this.logger.warn(`User with ID ${id} not found`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      this.logger.log(`Found user with ID: ${id}, username: ${user.username}`);
      return user;
    } catch (error) {
      this.logger.error(`Error finding user with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      this.logger.log('Finding all users');
      const users = await this.usersRepository.find();
      this.logger.log(`Found ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error(`Error finding all users: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(username: string, email: string, password: string, role: UserRole = UserRole.USER): Promise<User> {
    this.logger.log(`Creating new user with username: ${username}, email: ${email}, role: ${role}`);
    
    try {
      // Hash the password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create a new user
      const user = this.usersRepository.create({
        username,
        email,
        password: hashedPassword,
        role,
      });

      // Save the user to the database
      const savedUser = await this.usersRepository.save(user);
      this.logger.log(`Successfully created user with username: ${username}, ID: ${savedUser.id}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Error creating user with username ${username}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createAdminUser(username: string, email: string, password: string): Promise<User> {
    this.logger.log(`Creating new admin user with username: ${username}, email: ${email}`);
    return this.create(username, email, password, UserRole.ADMIN);
  }

  async findByRole(role: UserRole): Promise<User[]> {
    try {
      this.logger.log(`Looking for users with role: ${role}`);
      const users = await this.usersRepository.find({ where: { role } });
      this.logger.log(`Found ${users.length} users with role: ${role}`);
      return users;
    } catch (error) {
      this.logger.error(`Error finding users with role ${role}: ${error.message}`, error.stack);
      throw error;
    }
  }
} 