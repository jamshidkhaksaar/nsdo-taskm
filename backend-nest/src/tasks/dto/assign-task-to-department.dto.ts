import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTaskToDepartmentDto {
  @IsNotEmpty()
  @IsUUID()
  departmentId: string;
} 