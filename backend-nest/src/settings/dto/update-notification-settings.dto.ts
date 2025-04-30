import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  Min,
  Max,
  IsPort,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateNotificationSettingsDto {
  @ApiProperty({ description: "Enable email notifications", required: false })
  @IsOptional()
  @IsBoolean()
  email_notifications_enabled?: boolean;

  @ApiProperty({ description: "SMTP server hostname", required: false })
  @IsOptional()
  @IsString()
  smtp_server?: string;

  @ApiProperty({ description: "SMTP server port", required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  smtp_port?: number;

  @ApiProperty({ description: "SMTP username", required: false })
  @IsOptional()
  @IsString()
  smtp_username?: string;

  @ApiProperty({ description: "SMTP password", required: false })
  @IsOptional()
  @IsString()
  smtp_password?: string;

  @ApiProperty({ description: "Use TLS for SMTP connection", required: false })
  @IsOptional()
  @IsBoolean()
  smtp_use_tls?: boolean;
}
