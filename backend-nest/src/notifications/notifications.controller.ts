import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new notification" })
  @ApiResponse({
    status: 201,
    description: "Notification created successfully",
  })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get("user")
  @ApiOperation({ summary: "Get all notifications for the current user" })
  @ApiResponse({
    status: 200,
    description: "Return all notifications for the user",
  })
  findForCurrentUser(@Request() req) {
    return this.notificationsService.findAllForUser(req.user.userId);
  }

  @Get("user/unread")
  @ApiOperation({ summary: "Get unread notifications for the current user" })
  @ApiResponse({
    status: 200,
    description: "Return unread notifications for the user",
  })
  findUnreadForCurrentUser(@Request() req) {
    return this.notificationsService.findUnreadForUser(req.user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a notification by id" })
  @ApiResponse({ status: 200, description: "Return a notification" })
  findOne(@Param("id") id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a notification" })
  @ApiResponse({
    status: 200,
    description: "Notification updated successfully",
  })
  update(
    @Param("id") id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiResponse({ status: 200, description: "Notification marked as read" })
  markAsRead(@Param("id") id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch("user/read-all")
  @ApiOperation({
    summary: "Mark all notifications as read for the current user",
  })
  @ApiResponse({ status: 200, description: "All notifications marked as read" })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a notification" })
  @ApiResponse({
    status: 200,
    description: "Notification deleted successfully",
  })
  remove(@Param("id") id: string) {
    return this.notificationsService.remove(id);
  }
}
