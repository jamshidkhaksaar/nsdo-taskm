import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string; // Timestamp of the challenge load (ISO format)
  hostname?: string; // Hostname of the site where challenge was solved
  "error-codes"?: string[]; // Optional error codes
  action?: string; // Action specified in the widget
  cdata?: string; // Custom data specified in the widget
}

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async verifyToken(token: string, ip?: string): Promise<boolean> {
    const secretKey = this.configService.get<string>("TURNSTILE_SECRET_KEY");
    const verificationUrl =
      "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    if (!secretKey) {
      this.logger.error(
        "TURNSTILE_SECRET_KEY is not configured. CAPTCHA verification skipped (FAILING OPEN - NOT SECURE FOR PRODUCTION).",
      );
      // In a real production scenario, you might want to fail closed (return false)
      // if the key is missing, depending on security requirements.
      return true; // Fail open for dev convenience if key is missing
    }

    if (!token) {
      this.logger.warn("No CAPTCHA token provided.");
      return false;
    }

    try {
      this.logger.log("Verifying CAPTCHA token...");
      const response = await firstValueFrom(
        this.httpService.post(
          verificationUrl,
          {
            secret: secretKey,
            response: token,
            remoteip: ip, // Optional: Include user's IP if available
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

      const responseData = response.data;
      this.logger.log("CAPTCHA verification response:", responseData);

      if (responseData.success) {
        this.logger.log("CAPTCHA verification successful.");
        return true;
      } else {
        this.logger.warn(
          `CAPTCHA verification failed: ${responseData["error-codes"]?.join(", ")}`,
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Error during CAPTCHA verification request: ${error.message}`,
        error.stack,
      );
      // Decide how to handle errors - fail open or closed?
      // Failing closed (returning false) is generally safer.
      return false;
    }
  }
}
