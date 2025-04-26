import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string; // Timestamp of the challenge load (ISO format)
  hostname?: string;     // Hostname of the site where challenge was solved
  'error-codes'?: string[]; // Optional error codes
  action?: string;       // Action specified in the widget
  cdata?: string;        // Custom data specified in the widget
}

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly turnstileVerifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async verifyToken(token: string, remoteIp?: string): Promise<boolean> {
    const secretKey = this.configService.get<string>('TURNSTILE_SECRET_KEY');

    if (!secretKey) {
      this.logger.error('Turnstile secret key (TURNSTILE_SECRET_KEY) is not configured.');
      // Fail verification if secret key is missing
      return false;
    }

    if (!token) {
        this.logger.warn('Verification attempt with empty token.');
        return false;
    }

    try {
      this.logger.debug('Sending verification request to Cloudflare Turnstile...');
      const response = await firstValueFrom(
        this.httpService.post<TurnstileResponse>(this.turnstileVerifyUrl, {
          secret: secretKey,
          response: token,
          remoteip: remoteIp, // Optional: Include user's IP address
        }, {
          headers: {
            'Content-Type': 'application/json', 
          },
        })
      );

      this.logger.debug(`Turnstile response: ${JSON.stringify(response.data)}`);

      if (response.data.success) {
        this.logger.log('Turnstile verification successful.');
        return true;
      } else {
        this.logger.warn(`Turnstile verification failed. Error codes: ${response.data['error-codes']?.join(', ') || 'None'}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Error verifying Turnstile token: ${error.message}`, error.stack);
      // Fail verification on any error during the API call
      return false;
    }
  }
} 