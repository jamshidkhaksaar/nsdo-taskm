import { IsBoolean, IsUUID } from 'class-validator';

export class UpdateWorkflowPermissionDto {
  @IsUUID()
  roleId: string;

  @IsUUID()
  workflowStepId: string;

  @IsBoolean()
  hasPermission: boolean;
} 