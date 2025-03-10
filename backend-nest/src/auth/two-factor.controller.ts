import { Controller, Get, Post, Body, UseGuards, Request, UnauthorizedException, BadRequestException, HttpStatus, HttpCode, Logger } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';

class SetupTwoFactorDto {
  enabled: boolean;
  method?: string;
}

class VerifyTwoFactorDto {
  verification_code: string;
  remember_browser?: boolean;
}

class SendEmailCodeDto {
  email: string;
}

@ApiTags('Two Factor Authentication')
@Controller('settings')
export class TwoFactorController {
  private readonly logger = new Logger(TwoFactorController.name);

  constructor(
    private readonly twoFactorService: TwoFactorService,
    private readonly usersService: UsersService
  ) {}

  @Get('2fa-status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get 2FA status' })
  @ApiResponse({ status: 200, description: 'Return 2FA status' })
  async getStatus(@Request() req) {
    try {
      const userId = req.user.id;
      this.logger.log(`Getting 2FA status for user ${userId}`);
      return await this.twoFactorService.getStatus(userId);
    } catch (error) {
      this.logger.error(`Failed to get 2FA status: ${error.message}`, error.stack);
      throw new UnauthorizedException('Failed to get 2FA status');
    }
  }

  @Post('setup_2fa/')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Setup 2FA' })
  @ApiResponse({ status: 200, description: 'Return QR code or success message' })
  @HttpCode(HttpStatus.OK)
  async setup(@Request() req, @Body() setupTwoFactorDto: SetupTwoFactorDto) {
    try {
      const rawBody = JSON.stringify(setupTwoFactorDto);
      this.logger.log(`Setup 2FA request received with raw payload: ${rawBody}`);

      if (setupTwoFactorDto === undefined || setupTwoFactorDto.enabled === undefined) {
        this.logger.error(`Invalid 2FA setup request payload: ${rawBody}`);
        throw new BadRequestException('Enabled status must be provided');
      }

      const userId = req.user.id;
      const method = setupTwoFactorDto.method || 'app'; // Default to app method if not specified
      this.logger.log(`Setting up 2FA for user ${userId} with enabled=${setupTwoFactorDto.enabled}, method=${method}`);

      const response = await this.twoFactorService.setup(userId, setupTwoFactorDto.enabled, method);
      this.logger.log(`2FA setup response for user ${userId}: ${JSON.stringify(response)}`);

      return response;
    } catch (error) {
      this.logger.error(`Failed to setup 2FA: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to setup 2FA');
    }
  }

  @Post('verify_2fa/')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify 2FA code' })
  @ApiResponse({ status: 200, description: 'Return verification status' })
  @HttpCode(HttpStatus.OK)
  async verify(@Request() req, @Body() verifyTwoFactorDto: VerifyTwoFactorDto) {
    try {
      this.logger.log(`Verify 2FA request received with code: ${verifyTwoFactorDto.verification_code?.substring(0, 2)}***`);
      
      if (!verifyTwoFactorDto.verification_code) {
        throw new BadRequestException('Verification code must be provided');
      }

      const userId = req.user.id;
      const rememberBrowser = verifyTwoFactorDto.remember_browser === true;
      this.logger.log(`Verifying 2FA code for user ${userId}, remember browser: ${rememberBrowser}`);
      
      const verified = await this.twoFactorService.verify(
        userId, 
        verifyTwoFactorDto.verification_code,
        rememberBrowser
      );

      if (verified) {
        this.logger.log(`2FA verification successful for user ${userId}`);
        return { success: true, message: '2FA verification successful' };
      } else {
        this.logger.warn(`Invalid 2FA verification code provided by user ${userId}`);
        throw new BadRequestException('Invalid verification code');
      }
    } catch (error) {
      this.logger.error(`Failed to verify 2FA code: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to verify 2FA code');
    }
  }

  @Post('send_2fa_code/')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send 2FA code via email' })
  @ApiResponse({ status: 200, description: 'Return success message' })
  @HttpCode(HttpStatus.OK)
  async sendEmailCode(@Request() req, @Body() sendEmailCodeDto: SendEmailCodeDto) {
    try {
      const userId = req.user.id;
      this.logger.log(`Sending 2FA code via email for user ${userId}`);

      // If email is not provided, use the user's email from their account
      const email = sendEmailCodeDto.email || 
                   (await this.usersService.findById(userId)).email;
      
      if (!email) {
        throw new BadRequestException('Email is required');
      }

      const result = await this.twoFactorService.sendEmailCode(userId, email);
      return { success: true, message: 'Verification code sent to your email' };
    } catch (error) {
      this.logger.error(`Failed to send 2FA email code: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to send 2FA code');
    }
  }
} 