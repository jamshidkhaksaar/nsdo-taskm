// Permission types
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionFormData {
  name: string;
  description: string;
  resource: string;
  action: string;
}

// Role types
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleFormData {
  name: string;
  description: string;
}

export interface RolePermissionAssignment {
  roleId: string;
  permissionIds: string[];
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// UI types
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
} 