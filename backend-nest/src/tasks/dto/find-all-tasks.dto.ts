import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { TaskStatus, TaskPriority, TaskType } from '../entities/task.entity';

export class FindAllTasksDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search term for task title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Filter by task status' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Filter by task priority' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskType, description: 'Filter by task type' })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiPropertyOptional({ description: 'Filter by assigned user ID (UUID)' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional({ description: 'Filter by creating user ID (UUID)' })
  @IsOptional()
  @IsUUID()
  createdById?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned department ID (UUID)' })
  @IsOptional()
  @IsUUID()
  assignedDepartmentId?: string;

  @ApiPropertyOptional({ description: 'Filter tasks due from this date (ISO8601)' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  dueDateFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter tasks due up to this date (ISO8601)' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  dueDateTo?: Date;

  // Add other potential filters like is_private, provinceId, etc.
} 