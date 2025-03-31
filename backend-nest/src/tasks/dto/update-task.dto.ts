import { IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
import { TaskStatus, TaskPriority, TaskContext } from '../entities/task.entity';

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
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskContext)
  context?: TaskContext;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsDate()
  dueDate?: Date;
} 
