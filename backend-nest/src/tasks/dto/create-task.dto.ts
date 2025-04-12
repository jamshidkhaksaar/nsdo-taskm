import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';
import { TaskStatus, TaskType } from '../entities/task.entity';

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
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  assignedToUsers?: string[];

  @IsOptional()
  @IsArray()
  assignedToDepartmentIds?: string[];

  @IsOptional()
  @IsString()
  assignedToProvinceId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
} 