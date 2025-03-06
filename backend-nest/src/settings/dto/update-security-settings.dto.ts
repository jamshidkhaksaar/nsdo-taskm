import { IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSecuritySettingsDto {
  @ApiProperty({ description: 'Enable two-factor authentication', required: false })
  @IsOptional()
  @IsBoolean()
  two_factor_enabled?: boolean;

  @ApiProperty({ description: 'Password expiry in days', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  password_expiry_days?: number;

  @ApiProperty({ description: 'Maximum login attempts before lockout', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  max_login_attempts?: number;

  @ApiProperty({ description: 'Account lockout duration in minutes', required: false })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440) // 24 hours
  lockout_duration_minutes?: number;

  @ApiProperty({ description: 'Require complex passwords', required: false })
  @IsOptional()
  @IsBoolean()
  password_complexity_required?: boolean;

  @ApiProperty({ description: 'Session timeout in minutes', required: false })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440) // 24 hours
  session_timeout_minutes?: number;
} 