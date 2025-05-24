import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdatePermissionDto {
  @ApiPropertyOptional({
    description: 'New name for the permission (e.g., \'resource:action\')',
    example: 'task:edit',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_.-]+:[a-zA-Z0-9_.-]+$/,
    { message: 'Permission name must be in format resource:action' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated description for the permission',
    example: 'Allows editing existing tasks',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated grouping category for the permission',
    example: 'Tasks',
  })
  @IsOptional()
  @IsString()
  group?: string;
} 