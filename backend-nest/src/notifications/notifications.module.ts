import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { NotificationsService } from './services/notifications.service';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { HttpModule } from '@nestjs/axios';
import { TeamsNotificationService } from './services/teams-notification.service';
import { JwtService } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
// Import other necessary modules like TypeOrmModule for entities if needed later

// Define injection tokens for Redis clients
export const REDIS_PUBLISHER = 'REDIS_PUBLISHER';
export const REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification]),
    HttpModule,
    UsersModule,
    // Add other modules needed, e.g., TypeOrmModule.forFeature([NotificationEntity])
  ],
  providers: [
    NotificationsService,
    NotificationsGateway,
    TeamsNotificationService,
    JwtService,
    {
      provide: REDIS_PUBLISHER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('REDIS_HOST', '127.0.0.1'), // Default to localhost
          port: configService.get<number>('REDIS_PORT', 6379),       // Default Redis port
          password: configService.get<string>('REDIS_PASSWORD'),        // Optional password
          // db: configService.get<number>('REDIS_DB', 0),           // Optional DB index
        });
      },
    },
    {
      provide: REDIS_SUBSCRIBER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Subscriber needs a separate connection
        return new Redis({
          host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          // db: configService.get<number>('REDIS_DB', 0),
        });
      },
    },
  ],
  exports: [
    NotificationsService,
    // Export Redis clients if they need to be injected elsewhere
    // REDIS_PUBLISHER, 
    // REDIS_SUBSCRIBER 
  ], 
})
export class NotificationsModule {} 