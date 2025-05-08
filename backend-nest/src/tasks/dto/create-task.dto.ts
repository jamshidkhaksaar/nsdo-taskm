import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateIf,
  MaxLength,
} from "class-validator";
import { TaskPriority, TaskType } from "../entities/task.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTaskDto {
  @ApiProperty({ description: "Title of the task", example: "Refactor authentication module" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: "Detailed description of the task", example: "Update service to use new RBAC logic..." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Priority of the task",
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: "Due date for the task (ISO 8601 format)",
    example: "2024-12-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  // Context-specific assignment fields

  @ApiPropertyOptional({
    description: "Array of user UUIDs to assign the task to directly. Cannot be used with department/province IDs.",
    type: [String],
    format: "uuid",
    example: ["uuid-user-1", "uuid-user-2"],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  @ValidateIf((o) => !o.assignedToDepartmentIds && !o.assignedToProvinceId)
  assignedToUserIds?: string[];

  @ApiPropertyOptional({
    description: "Array of department UUIDs to assign the task to. Can be used with province ID.",
    type: [String],
    format: "uuid",
    example: ["uuid-dept-1", "uuid-dept-2"],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  @ValidateIf((o) => !o.assignedToUserIds)
  assignedToDepartmentIds?: string[];

  @ApiPropertyOptional({
    description: "UUID of the province to assign the task to. Requires assignedToDepartmentIds.",
    format: "uuid",
    example: "uuid-province-1",
  })
  @IsOptional()
  @IsUUID("4")
  @ValidateIf((o) => !!o.assignedToDepartmentIds && !o.assignedToUserIds)
  assignedToProvinceId?: string;

  // Note: TaskType will be determined by the backend based on which assignment fields are present
  //       createdByUserId will be set from the authenticated user
}
