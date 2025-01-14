export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: TaskPriority;
  due_date: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  assigned_to: {
    id: string;
    username: string;
    email: string;
  } | null;
  department: string | null;
  is_private: boolean;
}

export interface CreateTask {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: TaskPriority;
  due_date: string;
  created_by: string | null;
  assigned_to: string | null;
  department: string | null;
  is_private: boolean;
  updated_at?: string;
}
