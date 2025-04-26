import { Injectable, UnauthorizedException, InternalServerErrorException, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { UserContext } from './interfaces/user-context.interface';
import { CaptchaService } from '../captcha/captcha.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly captchaService: CaptchaService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.findOne(username);
      
      if (user && await bcrypt.compare(password, user.password)) {
        this.logger.log(`User validation successful for: ${username}`);
        return user;
      }
      
      this.logger.warn(`User validation failed for: ${username}`);
      return null;
    } catch (error) {
      this.logger.error(`User validation error for ${username}: ${error.message}`, error.stack);
      return null;
    }
  }

  async signIn(loginCredentialsDto: LoginCredentialsDto): Promise<{ access: string | null, refresh: string | null, user: any | null }> {
    this.logger.log(`[DEBUG] Entered signIn with DTO including captcha field`);
    const { username, password, captchaToken } = loginCredentialsDto;
    this.logger.log(`Login attempt for user: ${username}`);
    
    // --- CAPTCHA Verification ---
    const isCaptchaValid = await this.captchaService.verifyToken(captchaToken);
    if (!isCaptchaValid) {
        this.logger.warn(`CAPTCHA verification failed for login attempt: ${username}`);
        throw new UnauthorizedException('CAPTCHA verification failed. Please try again.');
    }
    this.logger.log(`CAPTCHA verification successful for login attempt: ${username}`);
    // --- End CAPTCHA Verification ---

    try {
      this.logger.log(`[signIn] Calling usersService.findOne for username: '${username}'...`);
      const user = await this.usersService.findOne(username);
      this.logger.log(`[signIn] usersService.findOne returned: ${user ? 'User object' : 'null or undefined'}`);
      if (!user) {
        this.logger.warn(`User not found: ${username}`);
        throw new UnauthorizedException('Please check your login credentials');
      }
      this.logger.log(`User found: ${user.username}, ID: ${user.id}`);
      
      if (user) {
        this.logger.log(`[DEBUG] About to compare password for user: ${username}`);
        const passwordMatch = await bcrypt.compare(password, user.password);
        this.logger.log(`[DEBUG] bcrypt.compare result for user: ${username}: ${passwordMatch}`);
        if (passwordMatch) {
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
    }
    } catch (error) {
      this.logger.error(
        `Login error for user ${username}: ${error.message} (type: ${error?.constructor?.name})`,
        error.stack
      );
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // For debugging: include error message and type in response
      throw new UnauthorizedException(
        `Login failed: ${error?.message || error} (type: ${error?.constructor?.name})`
      );
    }
    // Fallback return to satisfy TypeScript (should never be reached)
    return { access: null, refresh: null, user: null };
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

  // New method to verify a JWT string and return the user payload
  async verifyJwtAndGetUser(token: string): Promise<UserContext | null> {
    try {
      this.logger.debug(`[verifyJwtAndGetUser] Verifying token: ${token ? token.substring(0, 10) + '...' : 'null'}`);
      const payload: JwtPayload = this.jwtService.verify(token); // Throws error if invalid/expired
      this.logger.debug(`[verifyJwtAndGetUser] Token verified. Payload: ${JSON.stringify(payload)}`);

      // We trust the payload if verify succeeds, but check user existence for robustness
      const user = await this.usersService.findById(payload.sub); // Use findById
      if (!user) {
        this.logger.warn(`[verifyJwtAndGetUser] User with ID ${payload.sub} from token not found in DB.`);
        return null; // Or throw UnauthorizedException?
      }

      // Construct the user context expected by the gateway/app
      const userContext: UserContext = {
        userId: payload.sub,
        username: payload.username,
        role: user.role, // Get role from the fresh user data
      };
      this.logger.debug(`[verifyJwtAndGetUser] Returning user context: ${JSON.stringify(userContext)}`);
      return userContext;
    } catch (error) {
      this.logger.warn(`[verifyJwtAndGetUser] JWT verification failed: ${error.message}`);
      return null; // Return null if token is invalid or expired
    }
  }

  async handleForgotPasswordRequest(email: string): Promise<{ message: string }> {
    this.logger.log(`Forgot password request received for email: ${email}`);
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists - security best practice
        this.logger.warn(`Forgot password request for non-existent email: ${email}`);
        return { message: 'If an account with this email exists, a password reset link has been sent.' };
      }

      // Generate a secure, unique, time-limited reset token (implement proper storage/validation)
      // For demo purposes, using a simple UUID - **REPLACE with secure implementation**
      const resetToken = uuidv4();
      const expiryMinutes = 30; // Token expiry time
      const expiryTime = new Date(Date.now() + expiryMinutes * 60000);
      
      // TODO: Securely store the resetToken and expiryTime associated with user.id
      // Example: await this.passwordResetTokenRepository.save({ userId: user.id, token: hashedToken, expiresAt: expiryTime });
      this.logger.log(`Generated reset token ${resetToken} for user ${user.username} (expires: ${expiryTime.toISOString()}) - **STORE SECURELY**`);

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
      
      this.logger.log(`Sending password reset email to ${user.email} for user ${user.username}`);
      await this.mailService.sendTemplatedEmail(
        user.email, 
        'PASSWORD_RESET_REQUEST', 
        {
          username: user.username,
          resetLink: resetLink,
        }
      );

      return { message: 'If an account with this email exists, a password reset link has been sent.' };

    } catch (error) {
      this.logger.error(`Error handling forgot password request for ${email}: ${error.message}`, error.stack);
      // Return a generic message even on internal errors
      return { message: 'An error occurred while processing your request. Please try again later.' };
    }
  }
} 