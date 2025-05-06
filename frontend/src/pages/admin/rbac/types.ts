// Shared interfaces for RBAC management

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  isSystemRole: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleFormData {
  name: string;
  description: string;
  permissionIds?: string[];
}

export interface PermissionFormData {
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface RolePermissionAssignment {
  roleId: string;
  permissionIds: string[];
} 