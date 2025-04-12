import { IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
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
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsDate()
  dueDate?: Date;
  @IsOptional()
  @IsString({ each: true })
  assignedToUsers?: string[];

  @IsOptional()
  @IsString({ each: true })
  assignedToDepartmentIds?: string[];

  @IsOptional()
  @IsString()
  assignedToProvinceId?: string;
}
