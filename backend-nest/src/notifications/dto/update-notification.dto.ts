import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Notification message', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType, required: false })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ description: 'Whether the notification has been read', required: false })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
} 