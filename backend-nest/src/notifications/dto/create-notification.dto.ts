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

  @ApiProperty({ description: 'User ID to notify' })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: 'Task ID related to the notification', required: false })
  @IsOptional()
  @IsNumber()
  task_id?: number;

  @ApiProperty({ description: 'Whether the notification has been read', default: false })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
} 