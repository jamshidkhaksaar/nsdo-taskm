import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Name of the permission, typically in format \'resource:action\'',
    example: 'task:create',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_.-]+:[a-zA-Z0-9_.-]+$/,
    { message: 'Permission name must be in format resource:action (e.g., task:create, user:view:profile)' })
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description for the permission',
    example: 'Allows creating new tasks',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional grouping category for the permission (e.g., Tasks, Users)',
    example: 'Tasks',
  })
  @IsOptional()
  @IsString()
  group?: string;
} 