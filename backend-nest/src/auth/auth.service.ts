import { Injectable, UnauthorizedException, InternalServerErrorException, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(loginCredentialsDto: LoginCredentialsDto): Promise<{ access: string, refresh: string, user: any }> {
    const { username, password } = loginCredentialsDto;
    this.logger.log(`Login attempt for user: ${username}`);
    
    try {
      const user = await this.usersService.findOne(username);
      this.logger.log(`User found: ${user.username}, ID: ${user.id}`);
      
      if (user && await bcrypt.compare(password, user.password)) {
        this.logger.log(`Password validation successful for user: ${username}`);
        
        const payload: JwtPayload = { username: user.username, sub: user.id };
        
        // Create access token with default expiration (from JWT_EXPIRATION env var)
        const accessToken = this.jwtService.sign(payload);
        
        // Create refresh token with longer expiration (7 days)
        const refreshToken = this.jwtService.sign(payload, {
          expiresIn: '7d', // 7 days expiration for refresh token
        });
        
        this.logger.log(`Login successful for user: ${username}`);
        
        // Return the response in the format expected by the frontend
        return { 
          access: accessToken, 
          refresh: refreshToken, // Now using a separate refresh token with longer expiration
          user: {
            id: user.id,
            username: user.username,
            email: user.email || '',
            first_name: '',
            last_name: '',
            role: user.role || 'user',
          }
        };
      } else {
        this.logger.warn(`Password validation failed for user: ${username}`);
        throw new UnauthorizedException('Please check your login credentials');
      }
    } catch (error) {
      this.logger.error(`Login error for user ${username}: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Please check your login credentials');
    }
  }
  
  async refreshToken(refreshToken: string): Promise<{ access: string, refresh: string }> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken);
      
      // Find the user
      const user = await this.usersService.findOne(payload.username);
      
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Generate a new access token with default expiration (shorter lived)
      const accessPayload: JwtPayload = { username: user.username, sub: user.id };
      const accessToken = this.jwtService.sign(accessPayload);
      
      // Generate a new refresh token with longer expiration (7 days)
      const refreshPayload: JwtPayload = { username: user.username, sub: user.id };
      const newRefreshToken = this.jwtService.sign(refreshPayload, {
        expiresIn: '7d', // 7 days expiration for refresh token
      });
      
      // Return new tokens
      return {
        access: accessToken,
        refresh: newRefreshToken,
      };
    } catch (error) {
      this.logger.error(`Token refresh error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
} 