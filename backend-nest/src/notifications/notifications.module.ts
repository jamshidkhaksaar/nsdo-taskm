import { Module } from '@nestjs/common';
import { NotificationsService } from './services/notifications.service';
import { NotificationsGateway } from './gateways/notifications.gateway';
// Import other necessary modules like TypeOrmModule for entities if needed later

@Module({
  imports: [
    // Add modules needed, e.g., TypeOrmModule.forFeature([NotificationEntity]), RedisModule
  ],
  providers: [NotificationsService, NotificationsGateway /*, TeamsNotificationConsumer */],
  exports: [NotificationsService], // Export service if needed by other modules
})
export class NotificationsModule {} 