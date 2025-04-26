import { Injectable, Inject, forwardRef, Optional, NotFoundException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
// import { TasksService } from '../tasks/tasks.service'; // Import later
// import { UsersService } from '../users/users.service'; // Import later
// import { User } from '../users/entities/user.entity'; // Import later
import { DeepPartial } from 'typeorm';
import { REDIS_PUBLISHER } from './notifications.module'; // Import token
import Redis from 'ioredis';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    // @Optional() @Inject(forwardRef(() => UsersService))
    // private usersService: UsersService,
    // @Optional() @Inject(forwardRef(() => TasksService))
    // private tasksService: TasksService,
    @Inject(REDIS_PUBLISHER) private readonly redisPublisher: Redis,
  ) {}

  /* Existing methods commented out until dependencies are ready
  async create(notificationData: DeepPartial<Notification>): Promise<Notification> {
    const notification = this.notificationsRepository.create(notificationData);
    return this.notificationsRepository.save(notification);
  }

  async findAll(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({ where: { id, userId } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }
    return notification;
  }

  async update(id: string, userId: string, updateData: DeepPartial<Notification>): Promise<Notification> {
    const notification = await this.findOne(id, userId);
    Object.assign(notification, updateData);
    return this.notificationsRepository.save(notification);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.notificationsRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return this.update(id, userId, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update({ userId, isRead: false }, { isRead: true });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({ where: { userId, isRead: false } });
  }
  */

  // Method for creating, saving, and publishing
  async createAndPublishNotification(payload: {
    type: string;
    message: string;
    userId: string; // Make userId mandatory for saving
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<Notification> { // Return the saved Notification
    this.logger.log(`Creating notification: ${payload.type} for user ${payload.userId}`);

    if (!payload.userId) {
        this.logger.error('Cannot create notification: userId is missing.', payload);
        throw new BadRequestException('Notification must have a target userId.');
    }

    // 1. Persist notification to the database
    let savedNotification: Notification | null = null;
    try {
        const newNotification = this.notificationsRepository.create({
            type: payload.type,
            message: payload.message,
            userId: payload.userId,
            relatedEntityType: payload.relatedEntityType,
            relatedEntityId: payload.relatedEntityId,
            isRead: false,
        });
        savedNotification = await this.notificationsRepository.save(newNotification);
        this.logger.log(`Notification saved with ID: ${savedNotification.id}`);
    } catch (dbError) {
        this.logger.error(`Failed to save notification to database: ${dbError.message}`, dbError.stack);
        throw new InternalServerErrorException(`Failed to save notification: ${dbError.message}`);
    }

    // 2. Publish to Redis channel
    const channel = 'notifications:new';
    const message = JSON.stringify(payload);

    try {
      await this.redisPublisher.publish(channel, message);
      this.logger.log(`Published notification structure to Redis channel ${channel}`);
    } catch (redisError) {
      this.logger.error(`Failed to publish notification to Redis (DB save was successful): ${redisError.message}`, redisError.stack);
      // Logged error, continue
    }

    // Return the created notification entity
    return savedNotification;
  }
}
