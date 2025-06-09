import { Injectable, NestMiddleware, ForbiddenException } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class IpWhitelistMiddleware implements NestMiddleware {
  private allowedIps: string[] = [
    "127.0.0.1",
    "::1",
    "192.168.3.90",
    "162.0.217.90"
    // Add more trusted IPs here or load from env/config
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip || req.connection.remoteAddress || "";
    if (this.allowedIps.includes(clientIp)) {
      next();
    } else {
      throw new ForbiddenException("Access denied: IP not allowed");
    }
  }
}
