import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginCredentialsDto } from "./dto/auth-credentials.dto";
import { LoginTwoFactorDto } from "./dto/login-two-factor.dto";
import { TwoFactorService } from "./two-factor.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RequestEmailCodeDto } from "./dto/request-email-code.dto";
// If linter error persists for ResetPasswordDto, try restarting TypeScript server, deleting node_modules and running npm install.
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UsersService } from "../users/users.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private twoFactorService: TwoFactorService,
    private usersService: UsersService,
  ) {
    this.logger.log("[DEBUG] AuthController instantiated");
  }

  @Post("/signin")
  @ApiOperation({ summary: "Sign in user (handles 2FA check internally)" })
  @ApiResponse({
    status: 200,
    description: "Login successful or 2FA required.",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized (Invalid Credentials / CAPTCHA / 2FA code).",
  })
  async signIn(@Body() loginCredentialsDto: LoginCredentialsDto): Promise<any> {
    this.logger.log(`[Controller] POST /auth/signin`);
    try {
      const result = await this.authService.signIn(loginCredentialsDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Login error in controller: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post("/login/2fa")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify 2FA code and complete login" })
  @ApiResponse({
    status: 200,
    description: "2FA Verification successful, tokens returned.",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized (Invalid 2FA code or user session).",
  })
  async login2FA(@Body() loginTwoFactorDto: LoginTwoFactorDto): Promise<any> {
    this.logger.log(
      `[Controller] POST /auth/login/2fa for userId: ${loginTwoFactorDto.userId}`,
    );
    try {
      const result = await this.authService.login2FA(
        loginTwoFactorDto.userId,
        loginTwoFactorDto.verificationCode,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `2FA Login error in controller: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post("/refresh")
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ access: string; refresh: string }> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post("/request-email-code")
  @ApiOperation({ summary: "Request an email code for email-based 2FA (if enabled)" })
  @ApiResponse({ status: 200, description: "Verification code sent to email." })
  @ApiResponse({ status: 401, description: "Invalid credentials." })
  async requestEmailCode(
    @Body() requestEmailCodeDto: RequestEmailCodeDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.authService.validateUser(
        requestEmailCodeDto.username,
        requestEmailCodeDto.password,
      );
      if (!user) throw new UnauthorizedException("Invalid credentials");
      await this.twoFactorService.sendEmailCode(user.id, user.email);
      return { success: true, message: "Verification code sent to your email" };
    } catch (error) {
      this.logger.error(
        `Email code request error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post("/reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset user password using a token" })
  @ApiResponse({ status: 200, description: "Password has been successfully reset." })
  @ApiResponse({ status: 400, description: "Invalid token or password format." })
  @ApiResponse({ status: 401, description: "Invalid or expired token." })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    this.logger.log(`Reset password attempt with token: ${resetPasswordDto.token.substring(0,10)}...`);
    try {
      await this.usersService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
      return { message: "Password has been successfully reset." };
    } catch (error) {
      this.logger.error(`Password reset error: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException("Invalid or expired password reset token.");
      }
      throw new BadRequestException("Could not reset password. Please try again or request a new link.");
    }
  }
}
