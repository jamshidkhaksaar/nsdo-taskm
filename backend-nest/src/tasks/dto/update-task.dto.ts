import {
  IsString,
  IsOptional,
  IsDateString,
} from "class-validator";

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  // Removed status, priority, type, and assignment fields
  // These should be updated via specific endpoints/DTOs
  // (e.g., /tasks/:id/status, /tasks/:id/priority, /tasks/:id/delegate)
}
