import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class GlobalThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as the tracker key
    return req.ip;
  }

  protected getOptions(): { ttl: number; limit: number } {
    // Default: 10 requests per 60 seconds
    return { ttl: 60, limit: 10 };
  }
}
