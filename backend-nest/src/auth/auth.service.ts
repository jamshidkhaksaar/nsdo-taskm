import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(loginCredentialsDto: LoginCredentialsDto): Promise<{ access: string, refresh: string, user: any }> {
    const { username, password } = loginCredentialsDto;
    const user = await this.usersService.findOne(username);

    if (user && await bcrypt.compare(password, user.password)) {
      const payload: JwtPayload = { username: user.username, sub: user.id };
      
      // Create access token with default expiration (from JWT_EXPIRATION env var)
      const accessToken = this.jwtService.sign(payload);
      
      // Create refresh token with longer expiration (7 days)
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d', // 7 days expiration for refresh token
      });
      
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
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
} 