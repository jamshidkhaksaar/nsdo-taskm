// User types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

// API Response types
export interface APIError {
  message: string;
  status: number;
}

export type APIResponse<T> = {
  data: T;
  status?: number;
  message?: string;
};

// Auth types
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

// Root State type
export interface RootState {
  auth: AuthState;
}

// Department type
export interface Department {
  id: number;
  name: string;
  description: string;
  provinceId?: string | number | null;
  headId?: string | number | null;
  head_name?: string;
  members_count?: number;
  createdAt: string;
  updatedAt: string;
}

// Task type
export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done'; // Example statuses
  userId: number | null; // Assignee User ID
  departmentId: number | null;
  createdAt: string;
  updatedAt: string;
} 