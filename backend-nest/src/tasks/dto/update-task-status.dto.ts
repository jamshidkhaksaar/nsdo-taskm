import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class UpdateTaskStatusDto {
  @IsNotEmpty()
  @IsEnum(TaskStatus, {
    message: `Status must be one of the following values: ${Object.values(TaskStatus).join(', ')}`,
  })
  status: TaskStatus;

  @ValidateIf(o => o.status === TaskStatus.CANCELLED)
  @IsNotEmpty({ message: 'Cancellation reason is required when cancelling a task' })
  @IsString()
  @MinLength(20, { message: 'Cancellation reason must be at least 20 characters long' })
  cancellationReason?: string;
} 