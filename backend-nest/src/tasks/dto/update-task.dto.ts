import { IsOptional, IsString, IsEnum, IsArray, IsDateString } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  assignedTo?: string[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;
} 