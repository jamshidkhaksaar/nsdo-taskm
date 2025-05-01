import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateIf,
} from "class-validator";
import { TaskPriority } from "../entities/task.entity";

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority = TaskPriority.MEDIUM; // Default priority

  @IsOptional()
  @IsDateString()
  dueDate?: string; // ISO 8601 format

  // Context-specific assignment fields

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  @ValidateIf((o) => !o.assignedToDepartmentIds && !o.assignedToProvinceId)
  assignedToUserIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  @ValidateIf((o) => !o.assignedToUserIds)
  assignedToDepartmentIds?: string[];

  @IsOptional()
  @IsUUID("4")
  @ValidateIf((o) => !!o.assignedToDepartmentIds && !o.assignedToUserIds)
  assignedToProvinceId?: string;

  // Note: TaskType will be determined by the backend based on which assignment fields are present
  //       createdByUserId will be set from the authenticated user
}
