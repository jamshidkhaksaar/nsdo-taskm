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

  @ApiProperty({
    description: "Type of the task",
    enum: TaskType,
    example: TaskType.USER,
  })
  @IsEnum(TaskType)
  @IsNotEmpty()
  type: TaskType;

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
  @ValidateIf((o) => o.type === TaskType.USER && !o.assignedToDepartmentIds && !o.assignedToProvinceId)
  assignedToUserIds?: string[];

  @ApiPropertyOptional({
    description: "Array of department UUIDs to assign the task to. Used for TaskType.DEPARTMENT and TaskType.PROVINCE_DEPARTMENT.",
    type: [String],
    format: "uuid",
    example: ["uuid-dept-1", "uuid-dept-2"],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  @ValidateIf((o) => (o.type === TaskType.DEPARTMENT || o.type === TaskType.PROVINCE_DEPARTMENT) && !o.assignedToUserIds)
  assignedToDepartmentIds?: string[];

  @ApiPropertyOptional({
    description: "UUID of the province to assign the task to. ONLY for specific cases, generally determined by Department's province. Consult PRD. (DEPRECATED - logic relies on department's province or specific task type)",
    format: "uuid",
    example: "uuid-province-1",
    deprecated: true,
  })
  @IsOptional()
  @IsUUID("4")
  @ValidateIf((o) => o.type === TaskType.PROVINCE_DEPARTMENT && false)
  assignedToProvinceId?: string;

  // TaskType is now explicitly set by the client.
  // createdByUserId will be set from the authenticated user
}
