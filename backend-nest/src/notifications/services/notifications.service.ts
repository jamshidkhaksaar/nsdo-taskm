import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, UpdateResult } from "typeorm";
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
      this.logger.warn(
        `Redis publishing temporarily disabled. Would publish notification ${savedNotification.id} to ${channel}:`,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Error during temporarily disabled Redis publish step: ${error}`,
      ); 
    }
    return savedNotification;
  }

  // --- Methods for retrieving/marking notifications as read ---

  async getUserNotifications(userId: string): Promise<Notification[]> {
    this.logger.log(`Fetching all notifications for user ${userId}`);
    try {
      return await this.notificationRepository.find({
        where: { userId },
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch notifications for user ${userId}`, error.stack);
      throw new InternalServerErrorException("Could not fetch notifications.");
    }
  }

  async getUnreadUserNotifications(userId: string): Promise<Notification[]> {
    this.logger.log(`Fetching unread notifications for user ${userId}`);
    try {
      return await this.notificationRepository.find({
        where: { userId, isRead: false },
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch unread notifications for user ${userId}`, error.stack);
      throw new InternalServerErrorException("Could not fetch unread notifications.");
    }
  }

  async markSpecificNotificationAsRead(notificationId: string, userId: string): Promise<Notification> {
    this.logger.log(`Marking notification ${notificationId} as read for user ${userId}`);
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      this.logger.warn(`Notification ${notificationId} not found for user ${userId}`);
      throw new NotFoundException(`Notification ${notificationId} not found or does not belong to user.`);
    }

    if (notification.isRead) {
      this.logger.log(`Notification ${notificationId} is already read.`);
      return notification; // Already read, no change needed
    }

    notification.isRead = true;
    try {
      return await this.notificationRepository.save(notification);
    } catch (error) {
      this.logger.error(`Failed to mark notification ${notificationId} as read`, error.stack);
      throw new InternalServerErrorException("Could not mark notification as read.");
    }
  }

  async markAllUserNotificationsAsRead(userId: string): Promise<UpdateResult> {
    this.logger.log(`Marking all notifications as read for user ${userId}`);
    try {
      return await this.notificationRepository.update(
        { userId, isRead: false }, // Condition: only unread notifications for this user
        { isRead: true },          // Update: set isRead to true
      );
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read for user ${userId}`, error.stack);
      throw new InternalServerErrorException("Could not mark all notifications as read.");
    }
  }
}
