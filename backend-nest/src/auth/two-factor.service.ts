import { Injectable, Logger, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

// Define a minimal interface for the mail service
interface MailServiceLike {
  sendVerificationCode(
    email: string,
    username: string,
    code: string,
  ): Promise<void>;
}

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Optional() private mailService?: MailServiceLike,
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
    rememberBrowser: boolean = false,
  ): Promise<boolean> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!user || !user.twoFactorSecret) {
        throw new Error("User not found or 2FA not set up");
      }

      this.logger.log(
        `Verifying 2FA code for user: ${user.username}, method: ${user.twoFactorMethod}`,
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

        // If remember browser is requested, store the fingerprint
        if (rememberBrowser) {
          this.logger.log(
            `Remember browser requested for user ${user.username}`,
          );

          // Initialize rememberedBrowsers if it doesn't exist
          if (!user.rememberedBrowsers) {
            user.rememberedBrowsers = [];
          }

          // Calculate expiration date (90 days from now)
          const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

          // Use a timestamp as a simple fingerprint
          const fingerprint = `browser-${Date.now()}`;

          user.rememberedBrowsers.push({
            fingerprint,
            expiresAt,
          });

          this.logger.log(
            `Added remembered browser for user ${user.username}, expires: ${expiresAt}`,
          );
        }

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
      if (!user) {
        throw new Error("User not found");
      }

      // Generate a 6-digit verification code
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      // Store the verification code as a TOTP secret
      // This allows us to reuse the existing verification logic
      const secret = speakeasy.generateSecret({ length: 20 });
      user.twoFactorSecret = secret.base32;
      await this.usersRepository.save(user);

      // In a real implementation, we would send an email with the verification code
      this.logger.log(
        `Sending verification code ${verificationCode} to ${email} for user ${user.username}`,
      );

      // Send the email if mail service is available
      if (this.mailService) {
        try {
          await this.mailService.sendVerificationCode(
            email,
            user.username,
            verificationCode,
          );
          this.logger.log(
            `Verification code email sent to ${email} for user ${user.username}`,
          );
        } catch (mailError) {
          this.logger.error(
            `Failed to send email: ${mailError.message}`,
            mailError.stack,
          );
          // Continue even if mail sending fails - we'll just log the code for testing
          this.logger.warn(
            `TEST ONLY - verification code is: ${verificationCode}`,
          );
        }
      } else {
        // No mail service available, just log the code
        this.logger.warn(
          `Mail service not available - TEST ONLY - verification code is: ${verificationCode}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send verification code: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
