import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { NotificationsService } from "./services/notifications.service";
import { NotificationsGateway } from "./gateways/notifications.gateway";
import { NotificationsController } from "./notifications.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "./entities/notification.entity";
import { HttpModule } from "@nestjs/axios";
import { JwtService } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
// Import other necessary modules like TypeOrmModule for entities if needed later

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification]),
    HttpModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    // Add other modules needed, e.g., TypeOrmModule.forFeature([NotificationEntity])
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService, // Depends only on NotificationRepository now
    NotificationsGateway,
  ],
  exports: [
    NotificationsService,
  ],
})
export class NotificationsModule {}
