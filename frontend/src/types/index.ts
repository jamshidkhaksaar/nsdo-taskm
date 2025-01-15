export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin';
  avatar?: string;
  department?: {
    id: number;
    name: string;
  };
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

export interface UserDetail {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
}
