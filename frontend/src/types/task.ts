export interface Task {
  id: string;
  title: string;
  description: string;
  createdBy: {
    id: string;
    name: string;
  };
  assignedTo: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
  };
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;
  isPrivate: boolean;
}
