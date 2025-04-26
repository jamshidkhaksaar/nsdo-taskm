import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_PUBLISHER } from '../notifications.module';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redisPublisher: Redis,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(userId: string, type: string, message: string, relatedEntityType?: string, relatedEntityId?: string): Promise<Notification> {
    const newNotification = this.notificationRepository.create({
      userId,
      type,
      message,
      isRead: false,
      relatedEntityType,
      relatedEntityId,
    });
    
    const savedNotification = await this.notificationRepository.save(newNotification);

    const payload = {
      id: savedNotification.id,
      userId: savedNotification.userId,
      type: savedNotification.type,
      message: savedNotification.message,
      isRead: savedNotification.isRead,
      createdAt: savedNotification.createdAt.toISOString(),
      relatedEntityType: savedNotification.relatedEntityType,
      relatedEntityId: savedNotification.relatedEntityId,
    };

    const channel = 'notifications:new';
    try {
      await this.redisPublisher.publish(channel, JSON.stringify(payload));
      console.log(`Published notification ${savedNotification.id} to ${channel}:`, payload);
    } catch (error) {
      console.error(`Failed to publish notification ${savedNotification.id} to Redis:`, error);
    }

    return savedNotification;
  }

  // TODO: Add methods for retrieving/marking notifications as read later
  // async getUserNotifications(userId: string): Promise<Notification[]> { ... }
  // async markNotificationAsRead(notificationId: string): Promise<Notification> { ... }
} 