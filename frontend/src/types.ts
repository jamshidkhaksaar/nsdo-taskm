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