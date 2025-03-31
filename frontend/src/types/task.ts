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

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  created_at: string;
  updated_at: string;
  is_private: boolean;
  department: string | { id: string; name: string } | null;
  assigned_to: string[];
  created_by: string;
  context: TaskContext;
}

export interface CreateTask {
  title: string;
  description?: string;
  status?: TaskStatus;
  due_date?: string;
  created_by?: string;
  priority?: TaskPriority;
  context?: TaskContext;
  assigned_to?: string[];
  department?: string | { id: string; name: string } | null;
  is_private?: boolean;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  updated_at?: string;
  assigned_to?: string[];
  department?: string | { id: string; name: string } | null;
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
