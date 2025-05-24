import { IsEnum, IsNotEmpty } from "class-validator";
import { TaskPriority } from "../entities/task.entity";

export class UpdateTaskPriorityDto {
  @IsNotEmpty()
  @IsEnum(TaskPriority, {
    message: `Priority must be one of the following values: ${Object.values(TaskPriority).join(", ")}`,
  })
  priority: TaskPriority;
}
