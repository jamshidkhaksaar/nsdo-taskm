import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { UsersModule } from '../users/users.module';
import { TasksModule } from '../tasks/tasks.module';
import { NotificationsGateway } from './notifications.gateway';
import { TeamsNotificationConsumer } from './teams-notification.consumer';
import Redis from 'ioredis'; // Import ioredis

// Define injection tokens
export const REDIS_PUBLISHER = 'REDIS_PUBLISHER';
export const REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    UsersModule,
    forwardRef(() => TasksModule)
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    TeamsNotificationConsumer,
    {
      provide: REDIS_PUBLISHER,
      useFactory: () => {
        // IMPORTANT: Replace hardcoded values with ConfigService in production
        return new Redis({
          host: '127.0.0.1', // process.env.REDIS_HOST || '127.0.0.1',
          port: 6379,       // parseInt(process.env.REDIS_PORT || '6379', 10),
          // password: process.env.REDIS_PASSWORD,
          // db: parseInt(process.env.REDIS_DB || '0', 10),
        });
      },
    },
    {
      provide: REDIS_SUBSCRIBER,
      useFactory: () => {
        // IMPORTANT: Replace hardcoded values with ConfigService in production
        return new Redis({
          host: '127.0.0.1', // process.env.REDIS_HOST || '127.0.0.1',
          port: 6379,       // parseInt(process.env.REDIS_PORT || '6379', 10),
          // password: process.env.REDIS_PASSWORD,
          // db: parseInt(process.env.REDIS_DB || '0', 10),
        });
      },
    },
  ],
  exports: [NotificationsService, REDIS_PUBLISHER, REDIS_SUBSCRIBER], // Export tokens if needed elsewhere
})
export class NotificationsModule {} 