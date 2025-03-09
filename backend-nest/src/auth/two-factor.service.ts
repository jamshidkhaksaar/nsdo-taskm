import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getStatus(userId: string): Promise<{ enabled: boolean }> {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      this.logger.log(`2FA status for user ${userId}: ${user.twoFactorEnabled}`);
      return { enabled: user.twoFactorEnabled };
    } catch (error) {
      this.logger.error(`Failed to get 2FA status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async setup(userId: string, enabled: boolean): Promise<{ qr_code?: string }> {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      this.logger.log(`Setting up 2FA for user ${userId}, enabled=${enabled}, current status=${user.twoFactorEnabled}`);

      // Disable 2FA
      if (!enabled && user.twoFactorEnabled) {
        user.twoFactorEnabled = false;
        user.twoFactorSecret = '';  // Set to empty string instead of null
        await this.usersRepository.save(user);
        this.logger.log(`2FA disabled for user: ${user.username}`);
        return {};
      }

      // Enable 2FA
      if (enabled && !user.twoFactorEnabled) {
        // Generate a new secret for the user
        const secret = speakeasy.generateSecret({
          length: 20,
          name: `TaskManager:${user.username}`,
        });

        // Store the secret key in the database
        user.twoFactorSecret = secret.base32;
        // Note: We don't set twoFactorEnabled to true yet. It will be set after verification.
        await this.usersRepository.save(user);
        this.logger.log(`2FA secret generated for user: ${user.username}, secret: ${secret.base32}`);

        // Generate QR code - handle potential undefined value
        if (secret.otpauth_url) {
          try {
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
            this.logger.log(`QR code generated for user: ${user.username}, length: ${qrCodeUrl.length}`);
            return { qr_code: qrCodeUrl };
          } catch (qrError) {
            this.logger.error(`Failed to generate QR code: ${qrError.message}`, qrError.stack);
            throw new Error('Failed to generate QR code');
          }
        } else {
          this.logger.error('Failed to generate otpauth_url');
          throw new Error('Failed to generate 2FA setup URL');
        }
      }

      // No changes needed - user already has 2FA enabled or disabled as requested
      this.logger.log(`No changes needed for 2FA setup, returning empty response`);
      return {};
    } catch (error) {
      this.logger.error(`Failed to setup 2FA: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verify(userId: string, verificationCode: string): Promise<boolean> {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user || !user.twoFactorSecret) {
        throw new Error('User not found or 2FA not set up');
      }

      this.logger.log(`Verifying 2FA code for user: ${user.username}`);

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: verificationCode,
        window: 2, // Allow some time drift (2 steps = ±1 minute)
      });

      if (verified) {
        // Enable 2FA for the user if verification was successful
        user.twoFactorEnabled = true;
        await this.usersRepository.save(user);
        this.logger.log(`2FA verified and enabled for user: ${user.username}`);
        return true;
      }

      this.logger.warn(`Invalid 2FA verification code for user: ${user.username}`);
      return false;
    } catch (error) {
      this.logger.error(`Failed to verify 2FA code: ${error.message}`, error.stack);
      throw error;
    }
  }
} 