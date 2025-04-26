import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus, TaskType } from '../entities/task.entity';

export class RecycleBinQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  userId?: string;
  
  @IsOptional()
  @IsString()
  departmentId?: string;
  
  @IsOptional()
  @IsString()
  provinceId?: string;
  
  @IsOptional()
  @IsEnum(TaskStatus, { each: true })
  status?: TaskStatus[];
  
  @IsOptional()
  @IsEnum(TaskType, { each: true })
  type?: TaskType[];

  @IsOptional()
  @IsString()
  fromDate?: string;
  
  @IsOptional()
  @IsString()
  toDate?: string;
  
  @IsOptional()
  @IsString()
  deletedByUserId?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;
  
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
  
  @IsOptional()
  @IsString()
  page?: string;
  
  @IsOptional()
  @IsString()
  limit?: string;
} 