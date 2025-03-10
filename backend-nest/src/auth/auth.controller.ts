import { Body, Controller, Post, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginCredentialsDto } from './dto/auth-credentials.dto';
import { TwoFactorService } from './two-factor.service';

class RequestEmailCodeDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(
    private authService: AuthService,
    private twoFactorService: TwoFactorService
  ) {}

  @Post('/signin')
  async signIn(
    @Body() loginCredentialsDto: LoginCredentialsDto,
  ): Promise<{ access: string | null, refresh: string | null, user: any | null, need_2fa?: boolean, method?: string }> {
    try {
      // Check if the user has 2FA enabled and if the browser is remembered
      const user = await this.authService.validateUser(
        loginCredentialsDto.username, 
        loginCredentialsDto.password
      );
      
      if (user && user.twoFactorEnabled) {
        // If fingerprint is provided, check if it's a remembered browser
        if (loginCredentialsDto.fingerprint && user.rememberedBrowsers?.length > 0) {
          const isBrowserRemembered = await this.twoFactorService.checkRememberedBrowser(
            user.id, 
            loginCredentialsDto.fingerprint
          );
          
          if (isBrowserRemembered) {
            this.logger.log(`Browser is remembered for user ${user.username}, skipping 2FA`);
            // Skip 2FA for remembered browsers
            return this.authService.signIn(loginCredentialsDto);
          }
        }
        
        // If verification code is provided, verify it
        if (loginCredentialsDto.verification_code) {
          const isCodeValid = await this.twoFactorService.verify(
            user.id, 
            loginCredentialsDto.verification_code,
            loginCredentialsDto.remember_me === true
          );
          
          if (isCodeValid) {
            this.logger.log(`2FA verification successful for user ${user.username}`);
            return this.authService.signIn(loginCredentialsDto);
          } else {
            this.logger.warn(`Invalid 2FA verification code for user ${user.username}`);
            throw new UnauthorizedException('Invalid verification code');
          }
        }
        
        // If no verification code is provided, return need_2fa flag
        this.logger.log(`2FA required for user ${user.username}, method: ${user.twoFactorMethod}`);
        return { 
          access: null, 
          refresh: null, 
          user: null, 
          need_2fa: true,
          method: user.twoFactorMethod || 'app'
        };
      }
      
      // No 2FA required, proceed with normal login
      return this.authService.signIn(loginCredentialsDto);
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('/login')
  login(
    @Body() loginCredentialsDto: LoginCredentialsDto,
  ): Promise<{ access: string | null, refresh: string | null, user: any | null }> {
    return this.authService.signIn(loginCredentialsDto);
  }

  @Post('/refresh')
  refresh(@Body() body: { refresh_token: string }): Promise<{ access: string, refresh: string }> {
    return this.authService.refreshToken(body.refresh_token);
  }
  
  @Post('/request-email-code')
  async requestEmailCode(@Body() requestEmailCodeDto: RequestEmailCodeDto): Promise<{ success: boolean, message: string }> {
    try {
      // Validate user credentials first
      const user = await this.authService.validateUser(
        requestEmailCodeDto.username, 
        requestEmailCodeDto.password
      );
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Send verification code via email
      await this.twoFactorService.sendEmailCode(user.id, user.email);
      
      return { 
        success: true, 
        message: 'Verification code sent to your email' 
      };
    } catch (error) {
      this.logger.error(`Email code request error: ${error.message}`, error.stack);
      throw error;
    }
  }
} 