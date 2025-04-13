import { IsString, IsOptional, IsEnum, IsDateString, IsArray, IsUUID } from 'class-validator';
import { TaskStatus, TaskPriority, TaskType } from '../entities/task.entity';

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
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assignedToUserIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assignedToDepartmentIds?: string[];

  @IsOptional()
  @IsUUID('4')
  assignedToProvinceId?: string;
}
