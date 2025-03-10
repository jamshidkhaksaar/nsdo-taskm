import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {}

  async sendVerificationCode(email: string, username: string, code: string): Promise<void> {
    try {
      // In a real implementation, you would use a mail service like Nodemailer, SendGrid, etc.
      // For now, we'll just log the email that would be sent
      this.logger.log(`[MAIL] Sending verification code ${code} to ${email} for user ${username}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.logger.log(`[MAIL] Verification code email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification code email: ${error.message}`, error.stack);
      throw error;
    }
  }
} 