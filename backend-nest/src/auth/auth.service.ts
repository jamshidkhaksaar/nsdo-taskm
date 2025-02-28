import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthCredentialsDto, LoginCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username, email, password } = authCredentialsDto;

    try {
      await this.usersService.create(username, email, password);
    } catch (error) {
      if (error.code === '23505') { // Duplicate username or email
        throw new ConflictException('Username or email already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async signIn(loginCredentialsDto: LoginCredentialsDto): Promise<{ access: string, refresh: string, user: any }> {
    const { username, password } = loginCredentialsDto;
    const user = await this.usersService.findOne(username);

    if (user && await bcrypt.compare(password, user.password)) {
      const payload: JwtPayload = { username: user.username, sub: user.id };
      const accessToken = this.jwtService.sign(payload);
      
      // Return the response in the format expected by the frontend
      return { 
        access: accessToken, 
        refresh: accessToken, // Using the same token for refresh for now
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
      
      // Generate a new access token
      const newPayload: JwtPayload = { username: user.username, sub: user.id };
      const accessToken = this.jwtService.sign(newPayload);
      
      // Return new tokens
      return {
        access: accessToken,
        refresh: accessToken, // Using the same token for refresh for now
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
} 