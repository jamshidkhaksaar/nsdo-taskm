import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Notification,
  NotificationType,
} from "../entities/notification.entity";
import { InternalServerErrorException } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    userId: string,
    type: string,
    message: string,
    relatedEntityType?: string,
    relatedEntityId?: string,
  ): Promise<Notification> {
    const notificationType = type as NotificationType;
    if (!Object.values(NotificationType).includes(notificationType)) {
      this.logger.error(`Invalid NotificationType provided: ${type}`);
      throw new BadRequestException(`Invalid notification type: ${type}`);
    }

    const newNotificationData = {
      userId,
      type: notificationType,
      message,
      isRead: false,
      relatedEntityType,
      relatedEntityId,
    };

    const newNotification: Notification =
      this.notificationRepository.create(newNotificationData);

    const savedNotification: Notification =
      await this.notificationRepository.save(newNotification);

    if (!savedNotification) {
      this.logger.error(
        "Failed to save notification, repository returned null/undefined",
      );
      throw new InternalServerErrorException("Failed to save notification");
    }

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

    const channel = "notifications:new";
    try {
      // Temporarily comment out publishing
      // await this.redisPublisher.publish(channel, JSON.stringify(payload));
      this.logger.warn(
        `Redis publishing temporarily disabled. Would publish notification ${savedNotification.id} to ${channel}:`,
        payload,
      );
      // console.log(`Published notification ${savedNotification.id} to ${channel}:`, payload);
    } catch (error) {
      // this.logger.error(`Failed to publish notification ${savedNotification.id} to Redis:`, error);
      this.logger.error(
        `Error during temporarily disabled Redis publish step: ${error}`,
      ); // Log if error still occurs somehow
      // console.error(`Failed to publish notification ${savedNotification.id} to Redis:`, error);
    }

    return savedNotification;
  }

  // TODO: Add methods for retrieving/marking notifications as read later
  // async getUserNotifications(userId: string): Promise<Notification[]> { ... }
  // async markNotificationAsRead(notificationId: string): Promise<Notification> { ... }
}
