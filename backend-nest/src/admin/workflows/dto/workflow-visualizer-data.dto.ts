export interface WorkflowStepNodeDto {
  id: string;
  name: string;
  description?: string;
  permissionIdentifier: string;
  order: number;
}

export interface RoleNodeDto {
  id: string;
  name: string;
  description?: string;
  // any additional properties specific to visualizer role node if needed
}

export interface PermissionEdgeDto {
  roleId: string;
  workflowStepId: string;
  hasPermission: boolean;
}

export class WorkflowVisualizerDataDto {
  workflowId: string;
  workflowName: string;
  workflowSlug: string;
  steps: WorkflowStepNodeDto[];
  roles: RoleNodeDto[];
  permissions: PermissionEdgeDto[];
} 