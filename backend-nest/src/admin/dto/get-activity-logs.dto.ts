import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

// Define an enum for status if you have a predefined set
// export enum ActivityLogStatus {
//   SUCCESS = 'success',
//   WARNING = 'warning',
//   ERROR = 'error',
// }

export class GetActivityLogsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter logs from this date (ISO8601 format).',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter logs up to this date (ISO8601 format).',
    example: '2023-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter by action type (e.g., \'USER_LOGIN\', \'TASK_CREATE\').',
    example: 'USER_LOGIN',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter by target entity type (e.g., \'User\', \'Task\').',
    example: 'Task',
  })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID (UUID format).',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by log status (e.g., \'success\', \'error\').',
    example: 'success',
    // enum: ActivityLogStatus, // Uncomment if using the enum
  })
  @IsOptional()
  @IsString() // Or @IsEnum(ActivityLogStatus) if using the enum
  status?: string;

  @ApiPropertyOptional({
    description: 'Search term for free-text search across relevant fields.',
    example: 'Failed login attempt',
  })
  @IsOptional()
  @IsString()
  search?: string;
} 