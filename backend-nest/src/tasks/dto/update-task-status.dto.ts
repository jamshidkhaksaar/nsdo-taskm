import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class UpdateTaskStatusDto {
  @IsNotEmpty()
  @IsEnum(TaskStatus, {
    message: `Status must be one of the following values: ${Object.values(TaskStatus).join(', ')}`,
  })
  status: TaskStatus;
} 