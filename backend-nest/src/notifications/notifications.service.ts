import {
  Injectable,
  Inject,
  forwardRef,
  Optional,
  NotFoundException,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./entities/notification.entity";
// import { TasksService } from '../tasks/tasks.service'; // Import later
// import { UsersService } from '../users/users.service'; // Import later
// import { User } from '../users/entities/user.entity'; // Import later
import { DeepPartial } from "typeorm";
import { REDIS_PUBLISHER } from "./notifications.module"; // Import token
import Redis from "ioredis";
import { NotificationType } from "./entities/notification.entity"; // Corrected import path

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

  // --- Start Uncommented Methods ---
  async create(
    notificationData: DeepPartial<Notification>,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create(notificationData);
    return this.notificationsRepository.save(notification);
  }

  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async findUnreadForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<Notification> {
    // Removed userId check - admin might need to find any notification?
    // Or add separate admin method later.
    const notification = await this.notificationsRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }
    return notification;
  }

  async update(
    id: string,
    updateData: DeepPartial<Notification>,
  ): Promise<Notification> {
    // Removed userId check - let controller handle auth if needed
    const notification = await this.findOne(id);
    Object.assign(notification, updateData);
    return this.notificationsRepository.save(notification);
  }

  async remove(id: string): Promise<void> {
    // Removed userId check - let controller handle auth
    const result = await this.notificationsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    // This assumes update can handle partial updates
    return this.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, isRead: false },
    });
  }
  // --- End Uncommented Methods ---

  // Method for creating, saving, and publishing
  async createAndPublishNotification(payload: {
    type: string;
    message: string;
    userId: string; // Make userId mandatory for saving
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<Notification | null> {
    // Adjusted return type
    this.logger.log(
      `Creating notification: ${payload.type} for user ${payload.userId}`,
    );

    if (!payload.userId) {
      this.logger.error(
        "Cannot create notification: userId is missing.",
        payload,
      );
      throw new BadRequestException("Notification must have a target userId.");
    }

    // Validate payload.type against NotificationType enum
    const notificationType = payload.type as NotificationType;
    if (!Object.values(NotificationType).includes(notificationType)) {
      this.logger.error(`Invalid NotificationType provided: ${payload.type}`);
      throw new BadRequestException(
        `Invalid notification type: ${payload.type}`,
      );
    }

    // 1. Persist notification to the database
    let savedNotification: Notification | null = null;
    try {
      const newNotification = this.notificationsRepository.create({
        type: notificationType, // Use the validated enum value
        message: payload.message,
        userId: payload.userId,
        relatedEntityType: payload.relatedEntityType,
        relatedEntityId: payload.relatedEntityId,
        isRead: false,
      });
      savedNotification =
        await this.notificationsRepository.save(newNotification);
      // Add null check
      if (!savedNotification) {
        throw new InternalServerErrorException(
          "Failed to save notification, repository returned null.",
        );
      }
      this.logger.log(`Notification saved with ID: ${savedNotification.id}`);
    } catch (dbError) {
      this.logger.error(
        `Failed to save notification to database: ${dbError.message}`,
        dbError.stack,
      );
      // Return null or rethrow depending on desired behavior on DB error
      // Returning null for now to satisfy type check, but consider throwing
      return null;
    }

    // 2. Publish to Redis channel
    const channel = "notifications:new";
    const message = JSON.stringify(payload);

    try {
      await this.redisPublisher.publish(channel, message);
      this.logger.log(
        `Published notification structure to Redis channel ${channel}`,
      );
    } catch (redisError) {
      this.logger.error(
        `Failed to publish notification to Redis (DB save was successful): ${redisError.message}`,
        redisError.stack,
      );
      // Logged error, continue
    }

    // Return the created notification entity
    return savedNotification;
  }
}
