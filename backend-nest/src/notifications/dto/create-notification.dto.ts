import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { NotificationType } from "../entities/notification.entity";

export class CreateNotificationDto {
  @ApiProperty({ description: "Notification message" })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ description: "Notification type", enum: NotificationType })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: "User ID to notify", type: String })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: "Task ID related to the notification",
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiProperty({
    description: "Task ID related to the notification",
    required: false,
    type: String,
  })
  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;

  @ApiProperty({
    description: "Whether the notification has been read",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
