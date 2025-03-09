import { Controller, Get, Post, Body, UseGuards, Request, UnauthorizedException, BadRequestException, HttpStatus, HttpCode, Logger } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';

class SetupTwoFactorDto {
  enabled: boolean;
}

class VerifyTwoFactorDto {
  verification_code: string;
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
      if (setupTwoFactorDto.enabled === undefined) {
        throw new BadRequestException('Enabled status must be provided');
      }
      
      const userId = req.user.id;
      this.logger.log(`Setting up 2FA for user ${userId} with enabled=${setupTwoFactorDto.enabled}`);
      const response = await this.twoFactorService.setup(userId, setupTwoFactorDto.enabled);
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
      if (!verifyTwoFactorDto.verification_code) {
        throw new BadRequestException('Verification code must be provided');
      }
      
      const userId = req.user.id;
      this.logger.log(`Verifying 2FA code for user ${userId}`);
      const verified = await this.twoFactorService.verify(userId, verifyTwoFactorDto.verification_code);
      
      if (verified) {
        return { success: true, message: '2FA verification successful' };
      } else {
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
} 