import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Notification message' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'User ID to notify', type: String })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Task ID related to the notification', required: false, type: String })
  @IsOptional()
  @IsString()
  task_id?: string;

  @ApiProperty({ description: 'Whether the notification has been read', default: false })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
} 