import { Dayjs } from 'dayjs';
import { Role } from '@/pages/admin/rbac/types';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: Role;
  roleId?: string;
  password?: string;
  department?: {
    id: string;
    name: string;
  } | null;
  departments?: Department[]; // Array of departments for the user
  position?: string;
  status: 'active' | 'inactive';
  date_joined: string;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface APIError {
  message: string;
  status: number;
}

export type APIResponse<T> = {
  data: T;
  status?: number;
  message?: string;
};

export interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginResponse {
  user: User;
  access: string;
  refresh?: string;
}

export interface JWTResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RootState {
  auth: AuthState;
}

export interface UserDetail {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'leadership' | 'admin';
  avatar?: string;
}

// START: Add Province and related types
export interface Department {
  id: string;
  name: string;
  description?: string;
  provinceId?: string | null;
  province_name?: string | null;
  headId?: string | null;
  head?: User | null;
  head_name?: string | null;
  members?: User[];
  members_count?: number;
  createdAt: string;
  updatedAt: string;
  // Add other relevant fields from backend entity if needed
}

export interface Province {
  id: string; // Changed to string based on backend UUIDs
  name: string;
  description?: string;
  departments?: Department[]; // Departments associated with this province
}

export interface CreateProvinceDto {
  name: string;
  description?: string;
}

export type UpdateProvinceDto = Partial<CreateProvinceDto>;

export interface AssignDepartmentsDto {
  departmentIds: string[];
}
// END: Add Province and related types

// START: Add Task and Dashboard Types

// Define Task Status, Priority, Type Enums (match backend)
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DELEGATED = 'delegated',
  DELETED = 'deleted',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum TaskType {
  PERSONAL = 'personal',
  DEPARTMENT = 'department',
  USER = 'user',
  PROVINCE_DEPARTMENT = 'province_department'
}

export enum DelegationRequestStatus {
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// Define Task interface (ensure properties match backend entity)
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  dueDate?: string | null; // Use string for ISO date representation
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: User; // Optional relation
  assignedToUserIds?: string[]; // Array of IDs
  assignedToUsers?: User[];   // Array of related User objects
  assignedToDepartmentIds?: string[]; // Array of IDs
  assignedToDepartments?: Department[]; // Array of related Department objects
  assignedToProvinceId?: string | null;
  assignedToProvince?: Province | null; // Optional relation
  isDelegated: boolean;
  delegatedFromTaskId?: string | null;
  delegatedFromTask?: Task | null; // Optional relation
  delegatedByUserId?: string | null;
  delegatedBy?: User | null; // Optional relation
  delegationStatus?: DelegationRequestStatus | null;
  delegationReason?: string | null; // Reason from delegator
  pendingDelegatedToUserId?: string | null;
  pendingDelegatedToUser?: User | null;
  delegationReviewComment?: string | null; // Comment from creator on approval/rejection
  delegatedToTaskId?: string | null; // ID of the new task created upon delegation approval
  delegatedToTask?: Task | null; // Relation to the new task
}

// Define CreateTask interface (matching CreateTaskDto from backend, excluding backend-managed fields)
export interface CreateTask {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type: TaskType;
  dueDate?: string | Dayjs | null; // Allow Dayjs for picker, convert before sending
  createdById?: string; // Add createdById as it's needed by the backend
  assignedToUserIds?: string[];
  assignedToDepartmentIds?: string[];
  assignedToProvinceId?: string | null;
  isDelegated?: boolean;
  delegatedFromTaskId?: string | null;
  delegatedByUserId?: string | null;
}

// Define TaskUpdate interface (similar to UpdateTaskDto from backend)
export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdById' | 'assignedToUsers' | 'assignedToDepartments' | 'assignedToProvince' | 'delegatedFromTask' | 'delegatedBy'>> & {
  assignedToUserIds?: string[];
  assignedToDepartmentIds?: string[];
  assignedToProvinceId?: string | null;
};

// Define DelegateTaskData interface
export interface DelegateTaskData {
  newAssigneeUserIds: string[]; // Array of user IDs to delegate to (Renamed to match backend DTO)
  delegationReason?: string; // Optional comment (Renamed to match backend DTO)
  // Maybe include original Task ID if needed by backend
}

// Define Dashboard Task Count Type
export interface DashboardTaskCounts {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total: number;
}

// Define response type for fetching dashboard tasks
export interface DashboardTasksResponse {
  myPersonalTasks: Task[];
  tasksICreatedForOthers: Task[];
  tasksAssignedToMe: Task[];
  tasksAssignedToMyDepartments?: Task[];
  tasksDelegatedByMe: Task[];
  tasksDelegatedToMe: Task[];
}

// END: Add Task and Dashboard Types

// START: Department Performer Type
export interface DepartmentPerformer {
  id: string;
  name: string; // Assuming name exists
  taskCount?: number; // Assuming a performance metric exists
  // Add other relevant fields based on actual API response
}
// END: Department Performer Type

// START: Activity Log Type
export interface ActivityLog {
  id: string;
  timestamp: string;
  userId?: string; // User who performed the action
  username?: string; // Username (denormalized for display)
  user?: { username: string }; // Alternative nested user object
  action: string; // e.g., 'create', 'update', 'delete', 'login'
  target?: string; // e.g., 'task', 'user', 'department'
  targetId?: string; // ID of the affected entity
  details: string; // Human-readable description of the action
  ipAddress?: string; // IP address of the user
  ip?: string; // Alternative field name for IP
  status?: 'success' | 'failed' | 'info'; // Optional status
}
// END: Activity Log Type

// Export types/interfaces from other files within the types directory
// Add specific files as needed, e.g.:
// export * from './auth'; 
// export * from './userTypes'; // If user types were in a separate file

// Export types from .d.ts files if necessary
export type { CreateDepartmentPayload } from './index.d'; // Export the missing type

// Selectively re-export types from service files if needed
export type { TaskStatusCountsResponse } from '../services/task';

// Remove the previous incorrect export blocks entirely

// DTO for updating task assignments - mirrors backend DTO
export interface UpdateTaskAssignmentsDto {
  assignedToUserIds?: string[];
  assignedToDepartmentIds?: string[];
  assignedToProvinceId?: string | null;
}

// DTO for creator-specific task delegation (re-assignment)
export interface CreatorDelegateTaskDto {
  delegatedToUserIds: string[];
}
