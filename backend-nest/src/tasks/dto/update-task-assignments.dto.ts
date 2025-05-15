import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateIf,
  ArrayNotEmpty,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateTaskAssignmentsDto {
  @ApiPropertyOptional({
    description: "Array of user UUIDs to assign the task to. Clears other assignments if provided.",
    type: [String],
    format: "uuid",
    example: ["uuid-user-1", "uuid-user-2"],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  // If users are provided, departments/province should not be (handled by service logic to clear others)
  assignedToUserIds?: string[];

  @ApiPropertyOptional({
    description: "Array of department UUIDs to assign the task to. Clears user assignments if provided.",
    type: [String],
    format: "uuid",
    example: ["uuid-dept-1", "uuid-dept-2"],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  // If departments are provided, users should not be (handled by service logic to clear others)
  assignedToDepartmentIds?: string[];

  @ApiPropertyOptional({
    description: "UUID of the province. If provided, assignedToDepartmentIds must also be provided and not empty. Clears user assignments.",
    format: "uuid",
    example: "uuid-province-1",
  })
  @IsOptional()
  // Allow null to explicitly remove province association
  @IsUUID("4")
  assignedToProvinceId?: string | null;

  // Validation Logic Notes for the service:
  // 1. If assignedToUserIds is present, it's a USER task. Other assignments are cleared.
  // 2. If assignedToDepartmentIds is present AND assignedToProvinceId is present, it's a PROVINCE_DEPARTMENT task. User assignments are cleared.
  //    assignedToDepartmentIds must not be empty in this case.
  // 3. If assignedToDepartmentIds is present AND assignedToProvinceId is null/absent, it's a DEPARTMENT task. User assignments are cleared.
  // 4. If ALL (assignedToUserIds, assignedToDepartmentIds, assignedToProvinceId) are explicitly passed as empty array/null, it becomes a PERSONAL task (assigned to creator).
  //    The DTO allows individual fields to be optional, so the service must interpret the combination.
  //    To make a task PERSONAL, perhaps send { assignedToUserIds: [], assignedToDepartmentIds: [], assignedToProvinceId: null }
} 