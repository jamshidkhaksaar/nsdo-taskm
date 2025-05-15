export interface User {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  department?: {
    id: string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
  avatar?: string;
  role?: any;
}

export enum UserRole {
  USER = 'user',
  LEADERSHIP = 'leadership',
  ADMIN = 'admin'
}
