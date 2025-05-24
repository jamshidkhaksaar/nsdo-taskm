import { Injectable, Logger, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import { MailService } from "../mail/mail.service";

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private mailService: MailService,
  ) {}

  async getStatus(
    userId: string,
  ): Promise<{ enabled: boolean; method?: string }> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new Error("User not found");
      }

      this.logger.log(
        `2FA status for user ${userId}: ${user.twoFactorEnabled}, method: ${user.twoFactorMethod}`,
      );
      return {
        enabled: user.twoFactorEnabled,
        method: user.twoFactorMethod || "app",
      };
    } catch (error) {
      this.logger.error(
        `Failed to get 2FA status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async setup(
    userId: string,
    enabled: boolean,
    method: string = "app",
  ): Promise<{ qr_code?: string; message?: string }> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      this.logger.log(
        `Setting up 2FA for user ${userId} (${user.username}), enabled: ${enabled}, method: ${method}`,
      );

      // If we're disabling 2FA, clear the 2FA fields
      if (enabled === false) {
        this.logger.log(`Disabling 2FA for user ${userId}`);

        // Clear all 2FA related fields
        user.twoFactorEnabled = false;
        user.twoFactorSecret = "";
        user.twoFactorMethod = "app"; // Reset to default method
        user.rememberedBrowsers = [];

        await this.usersRepository.save(user);
        this.logger.log(`2FA disabled for user: ${user.username}`);

        return { message: "2FA has been disabled" };
      }

      // Enable 2FA
      if (enabled === true) {
        this.logger.log(
          `Enabling 2FA for user ${userId} with method ${method}`,
        );

        // Set the 2FA method
        user.twoFactorMethod = method;

        // For email-based 2FA, we don't need the authenticator app setup
        if (method === "email") {
          user.twoFactorSecret = speakeasy.generateSecret({
            length: 20,
          }).base32;
          // Don't set twoFactorEnabled to true yet. It will be set after verification.
          await this.usersRepository.save(user);
          this.logger.log(`Email 2FA setup for user: ${user.username}`);

          // Send verification code via email
          await this.sendEmailCode(userId, user.email);

          return { message: "Verification code sent to your email" };
        }

        // For authenticator app 2FA
        // Check if user already has a secret but 2FA is disabled
        if (user.twoFactorSecret && !user.twoFactorEnabled) {
          // Clear the old secret and generate a new one
          user.twoFactorSecret = "";
          await this.usersRepository.save(user);
          this.logger.log(`Cleared old 2FA secret for user: ${user.username}`);
        }

        // Generate a new secret for the user
        const secret = speakeasy.generateSecret({
          length: 20,
          name: `TaskManager:${user.email}`,
          issuer: "TaskManager",
        });

        // Store the secret key in the database
        user.twoFactorSecret = secret.base32;
        // Note: We don't set twoFactorEnabled to true yet. It will be set after verification.
        await this.usersRepository.save(user);
        this.logger.log(
          `2FA secret generated for user: ${user.username}, secret: ${secret.base32}`,
        );

        // Generate QR code - handle potential undefined value
        if (secret.otpauth_url) {
          try {
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
            this.logger.log(
              `QR code generated for user: ${user.username}, length: ${qrCodeUrl.length}`,
            );
            return { qr_code: qrCodeUrl };
          } catch (qrError) {
            this.logger.error(
              `Failed to generate QR code: ${qrError.message}`,
              qrError.stack,
            );
            throw new Error("Failed to generate QR code");
          }
        } else {
          this.logger.error("Failed to generate otpauth_url");
          throw new Error("Failed to generate 2FA setup URL");
        }
      }

      // Should never reach here, but just in case
      this.logger.warn(
        `Unexpected case in 2FA setup for user ${userId}: enabled=${enabled}, current status=${user.twoFactorEnabled}`,
      );
      return {};
    } catch (error) {
      this.logger.error(`Failed to setup 2FA: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verify(
    userId: string,
    verificationCode: string,
  ): Promise<boolean> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!user || !user.twoFactorSecret) {
        throw new Error("User not found or 2FA not set up");
      }

      this.logger.log(
        `Verifying 2FA code for user: ${user.username}, method: ${user.twoFactorMethod}. Stored Secret: ${user.twoFactorSecret}`,
      );

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
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

      this.logger.warn(
        `Invalid 2FA verification code for user: ${user.username}`,
      );
      return false;
    } catch (error) {
      this.logger.error(
        `Failed to verify 2FA code: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendEmailCode(userId: string, email: string): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!user || !user.twoFactorSecret) {
        throw new Error("User not found or 2FA secret not generated");
      }

      if (!this.mailService) {
        this.logger.error(
          "MailService is not available. Cannot send 2FA email code.",
        );
        throw new Error("Email service is not configured.");
      }

      // Generate the current TOTP code
      const code = speakeasy.totp({
        secret: user.twoFactorSecret,
        encoding: "base32",
      });

      this.logger.log(
        `Generated 2FA email code for user ${user.username}: ${code}`,
      );

      // Use the existing sendTemplatedEmail method
      await this.mailService.sendTemplatedEmail(
        email,
        'TWO_FACTOR_CODE_EMAIL', // Use a specific template key
        {
          username: user.username,
          code: code, // Pass the generated code to the template
        },
      );

      this.logger.log(`Sent 2FA verification code email to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send 2FA verification code email to ${email}: ${error.message}`,
        error.stack,
      );
      // Re-throw or handle as appropriate
      throw new Error("Failed to send 2FA verification code.");
    }
  }

  async adminDisableTwoFactor(userId: string, adminUserId?: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`Admin reset 2FA: User with ID ${userId} not found.`);
      throw new Error('User not found for 2FA reset.');
    }

    if (!user.twoFactorEnabled) {
      this.logger.log(`Admin reset 2FA: 2FA already disabled for user ${user.username} (ID: ${userId}). No action taken.`);
      // Optionally, still clear other fields if they might be stale
      // user.twoFactorSecret = '';
      // user.twoFactorMethod = 'app'; 
      // user.rememberedBrowsers = [];
      // await this.usersRepository.save(user);
      return; // Or throw an error indicating it's already disabled
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = ''; // Clear the secret
    user.twoFactorMethod = 'app'; // Reset to a default method or null
    user.loginOtp = null; // Clear any pending login OTP
    user.loginOtpExpiresAt = null;
    user.rememberedBrowsers = []; // Clear remembered browsers

    await this.usersRepository.save(user);
    this.logger.log(
      `Admin action: 2FA successfully disabled for user ${user.username} (ID: ${userId}) by admin (ID: ${adminUserId || 'Unknown'}).`,
    );
  }

  async sendLoginTwoFactorEmailCode(userId: string): Promise<void> {
    // ... existing code ...
  }
}
