import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';
import { TaskStatus, TaskContext } from '../entities/task.entity';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskContext)
  context?: TaskContext;

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