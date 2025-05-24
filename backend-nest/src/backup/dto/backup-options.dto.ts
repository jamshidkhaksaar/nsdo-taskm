import { IsString, IsOptional, IsEnum, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum BackupType {
  FULL = "full",
  PARTIAL = "partial",
}

export class BackupOptionsDto {
  @ApiProperty({
    description: "Type of backup",
    enum: BackupType,
    default: BackupType.FULL,
  })
  @IsEnum(BackupType)
  type: BackupType;

  @ApiProperty({
    description: "Backup storage location",
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: "Include database in backup",
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeDatabases?: boolean;

  @ApiProperty({
    description: "Include media files in backup",
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeMedia?: boolean;

  @ApiProperty({
    description: "Include system settings in backup",
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeSettings?: boolean;

  @ApiProperty({
    description: "Custom backup path",
    required: false,
  })
  @IsString()
  @IsOptional()
  customPath?: string;
}
