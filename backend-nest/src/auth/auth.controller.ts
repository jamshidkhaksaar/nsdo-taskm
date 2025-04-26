import { Body, Controller, Post, UnauthorizedException, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginCredentialsDto } from './dto/auth-credentials.dto';
import { LoginTwoFactorDto } from './dto/login-two-factor.dto';
import { TwoFactorService } from './two-factor.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

class RequestEmailCodeDto {
  username: string;
  password: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(
    private authService: AuthService,
    private twoFactorService: TwoFactorService
  ) {
    this.logger.log('[DEBUG] AuthController instantiated');
  }

  @Post('/signin')
  @ApiOperation({ summary: 'Sign in user (handles 2FA check internally)' })
  @ApiResponse({ status: 200, description: 'Login successful or 2FA required.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (Invalid Credentials / CAPTCHA / 2FA code).' })
  async signIn(
    @Body() loginCredentialsDto: LoginCredentialsDto,
  ): Promise<any> {
    this.logger.log(`[Controller] POST /auth/signin`);
    try {
      const result = await this.authService.signIn(loginCredentialsDto);
      return result;
    } catch (error) {
      this.logger.error(`Login error in controller: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('/login/2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code and complete login' })
  @ApiResponse({ status: 200, description: '2FA Verification successful, tokens returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (Invalid 2FA code or user session).' })
  async login2FA(
    @Body() loginTwoFactorDto: LoginTwoFactorDto
  ): Promise<any> {
    this.logger.log(`[Controller] POST /auth/login/2fa for userId: ${loginTwoFactorDto.userId}`);
    try {
      const result = await this.authService.login2FA(
        loginTwoFactorDto.userId,
        loginTwoFactorDto.verificationCode
      );
      return result;
    } catch (error) {
      this.logger.error(`2FA Login error in controller: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('/refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refresh(@Body() body: { refresh_token: string }): Promise<{ access: string, refresh: string }> {
    return this.authService.refreshToken(body.refresh_token);
  }
  
  @Post('/request-email-code')
  async requestEmailCode(@Body() requestEmailCodeDto: RequestEmailCodeDto): Promise<{ success: boolean, message: string }> {
    try {
      const user = await this.authService.validateUser(
        requestEmailCodeDto.username, 
        requestEmailCodeDto.password
      );
      if (!user) throw new UnauthorizedException('Invalid credentials');
      await this.twoFactorService.sendEmailCode(user.id, user.email);
      return { success: true, message: 'Verification code sent to your email' };
    } catch (error) {
      this.logger.error(`Email code request error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('/forgot-password')
  @ApiOperation({ summary: 'Initiate password reset process' })
  @ApiResponse({ status: 200, description: 'Password reset email sent (if user exists).' })
  @ApiResponse({ status: 400, description: 'Invalid email format.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    this.logger.log(`Forgot password request for email: ${forgotPasswordDto.email}`);
    return this.authService.handleForgotPasswordRequest(forgotPasswordDto.email);
  }
} 