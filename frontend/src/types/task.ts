import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user';

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

export type TaskContext = 'personal' | 'department' | 'user';

export interface DepartmentRef {
  id: string;
  name: string;
}

export type TaskType = 'user' | 'department' | 'user_to_user' | 'province';

export interface Task {
  id: string | number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  departmentId: string | null;
  department?: string | DepartmentRef | null;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  is_private?: boolean;
  assigned_to?: string[];
  created_by?: string;
  createdById?: string | null;
  context?: TaskContext;
  type?: TaskType;
  delegatedByUserId?: string | null;
  assignedToUsers?: User[];
  assignedToDepartmentIds?: string[] | null;
  assignedToProvinceId?: string | null;
}

export interface CreateTask {
  title: string;
  description: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  type: TaskType;
  assignedToUserIds?: string[];
  assignedToDepartmentIds?: string[];
  assignedToProvinceId?: string | null;
}

export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'assignedToUsers' | 'assignedToDepartments' | 'assignedToProvince' | 'delegatedBy' | 'delegatedFromTask'> & {
  assignedToUserIds?: string[];
  assignedToDepartmentIds?: string[];
  assignedToProvinceId?: string | null;
}>;

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface DashboardTasksResponse {
  myPersonalTasks: Task[];
  tasksICreatedForOthers: Task[];
  tasksAssignedToMe: Task[];
  tasksDelegatedByMe: Task[];
  tasksDelegatedToMe: Task[];
}
