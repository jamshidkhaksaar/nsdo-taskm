export interface Department {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  members_count?: number;
  tasks_count?: number;
  manager_id?: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
  };
} 