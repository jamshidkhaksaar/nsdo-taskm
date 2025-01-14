export interface Task {
  id: string;
  title: string;
  description: string;
  created_at: string;
  due_date: string;
  status: 'todo' | 'in_progress' | 'done';
  created_by: {
    id: string;
    username: string;
  };
  assigned_to: {
    id: string;
    username: string;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
  is_private: boolean;
  priority: 'high' | 'medium' | 'low';
}
