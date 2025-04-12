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
  description?: string;
  status?: TaskStatus;
  due_date?: string;
  dueDate?: string;
  priority?: TaskPriority;
  departmentId?: string;
  assigned_to?: string[];
  is_private?: boolean;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  departmentId?: string;
  assigned_to?: string[];
  is_private?: boolean;
}

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
