import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { NotificationsService } from "./services/notifications.service";
import { NotificationsGateway } from "./gateways/notifications.gateway";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "./entities/notification.entity";
import { HttpModule } from "@nestjs/axios";
import { TeamsNotificationService } from "./services/teams-notification.service";
import { JwtService } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
// Import other necessary modules like TypeOrmModule for entities if needed later

// Define injection tokens for Redis clients
export const REDIS_PUBLISHER = "REDIS_PUBLISHER";
export const REDIS_SUBSCRIBER = "REDIS_SUBSCRIBER";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification]),
    HttpModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    // Add other modules needed, e.g., TypeOrmModule.forFeature([NotificationEntity])
  ],
  providers: [
    // Define Factory Providers FIRST
    // Temporarily comment out REDIS_PUBLISHER provider
    // {
    //   provide: REDIS_PUBLISHER,
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => {
    //     return new Redis({
    //       host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
    //       port: configService.get<number>('REDIS_PORT', 6379),
    //       password: configService.get<string>('REDIS_PASSWORD'),
    //     });
    //   },
    // },
    // Temporarily comment out REDIS_SUBSCRIBER provider
    // {
    //   provide: REDIS_SUBSCRIBER,
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => {
    //     // ... subscriber factory ...
    //   },
    // },
    // Define Services/Gateways AFTER dependencies
    NotificationsService, // Depends only on NotificationRepository now
    // Temporarily comment out TeamsNotificationService
    // TeamsNotificationService,
    // Temporarily comment out NotificationsGateway
    NotificationsGateway,
  ],
  exports: [
    NotificationsService,
    // Temporarily comment out export
    // REDIS_PUBLISHER,
  ],
})
export class NotificationsModule {}
