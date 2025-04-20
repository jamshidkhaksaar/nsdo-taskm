import { IsArray, IsOptional, IsString, IsUUID, ArrayMinSize, IsDateString } from 'class-validator';

export class DelegateTaskDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  newAssigneeUserIds: string[];

  @IsOptional()
  @IsString()
  delegationReason?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  assignedToUserIds?: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  assignedToDepartmentIds?: string[];

  @IsUUID()
  @IsOptional()
  assignedToProvinceId?: string;
} 