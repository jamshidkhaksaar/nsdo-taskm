import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'New name for the role', example: 'Senior Editor' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated description for the role', example: 'Can edit and publish website content' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Complete array of permission UUIDs to set for the role (replaces existing)',
    type: [String],
    example: ['uuid1', 'uuid3', 'uuid4'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[]; // Note: Often updates replace all, not patch.
} 