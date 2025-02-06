// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { User } from './user';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  is_private: boolean;
  department: string | null;
  assigned_to: string[] | null;
  created_by: string | null;
  updated_at: string;
  isUpdating?: boolean;
  comments?: Comment[];
}

export interface CreateTask {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  created_by: string | null;
  assigned_to: string[] | null;
  department: string | null;
  is_private: boolean;
  updated_at: string;
}

// Add a type for task updates
export interface TaskUpdate {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  is_private?: boolean;
  department?: string | null;
  assigned_to?: string[] | null;
  updated_at: string;
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
