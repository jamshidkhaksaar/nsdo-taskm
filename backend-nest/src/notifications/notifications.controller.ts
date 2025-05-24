import { Controller, Get, Patch, Param, UseGuards, Req, Logger, ParseUUIDPipe } from '@nestjs/common';
import { NotificationsService } from './services/notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Notification } from './entities/notification.entity';
import { UpdateResult } from 'typeorm';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('user')
  @ApiOperation({ summary: 'Get all notifications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns a list of notifications', type: [Notification] })
  async getUserNotifications(@Req() req): Promise<Notification[]> {
    this.logger.log(`User ${req.user.userId} fetching all their notifications`);
    return this.notificationsService.getUserNotifications(req.user.userId);
  }

  @Get('user/unread')
  @ApiOperation({ summary: 'Get unread notifications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns a list of unread notifications', type: [Notification] })
  async getUnreadUserNotifications(@Req() req): Promise<Notification[]> {
    this.logger.log(`User ${req.user.userId} fetching their unread notifications`);
    return this.notificationsService.getUnreadUserNotifications(req.user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', type: Notification })
  @ApiResponse({ status: 404, description: 'Notification not found or does not belong to user' })
  async markNotificationAsRead(
    @Param('id', ParseUUIDPipe) notificationId: string,
    @Req() req,
  ): Promise<Notification> {
    this.logger.log(`User ${req.user.userId} marking notification ${notificationId} as read`);
    return this.notificationsService.markSpecificNotificationAsRead(notificationId, req.user.userId);
  }

  @Patch('user/read-all')
  @ApiOperation({ summary: 'Mark all notifications for the authenticated user as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read', type: UpdateResult })
  async markAllUserNotificationsAsRead(@Req() req): Promise<UpdateResult> {
    this.logger.log(`User ${req.user.userId} marking all their notifications as read`);
    return this.notificationsService.markAllUserNotificationsAsRead(req.user.userId);
  }
} 