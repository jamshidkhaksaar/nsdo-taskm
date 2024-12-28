export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface APIError {
  message: string;
  status: number;
}

export type APIResponse<T> = {
  data: T;
  status?: number;
  message?: string;
};

export interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface JWTResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RootState {
  auth: AuthState;
} 