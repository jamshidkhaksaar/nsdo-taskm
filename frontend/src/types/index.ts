import { Dayjs } from 'dayjs';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin' | 'manager';
  isActive?: boolean;
  status?: string;
  avatar?: string;
  department?: {
    id: string;
    name: string;
  };
  position?: string;
  date_joined?: string;
  last_login?: string | null;
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
  role: 'user' | 'admin';
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
  CANCELLED = 'cancelled'
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
}

// Define CreateTask interface (matching CreateTaskDto from backend, excluding backend-managed fields)
export interface CreateTask {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type: TaskType;
  dueDate?: string | Dayjs | null; // Allow Dayjs for picker, convert before sending
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
  newAssigneeUserId: string;
  delegationReason?: string;
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
  tasks: Task[];
  counts: DashboardTaskCounts;
}

// END: Add Task and Dashboard Types
