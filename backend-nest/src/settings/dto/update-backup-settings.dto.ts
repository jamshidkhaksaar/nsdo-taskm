import { IsOptional, IsBoolean, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBackupSettingsDto {
  @ApiProperty({ description: 'Enable automatic backups', required: false })
  @IsOptional()
  @IsBoolean()
  auto_backup_enabled?: boolean;

  @ApiProperty({ description: 'Backup frequency in hours', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168) // 1 week
  backup_frequency_hours?: number;

  @ApiProperty({ description: 'Backup retention period in days', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365) // 1 year
  backup_retention_days?: number;

  @ApiProperty({ description: 'Backup storage location path', required: false })
  @IsOptional()
  @IsString()
  backup_location?: string;
} 