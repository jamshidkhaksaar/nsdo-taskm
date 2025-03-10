import { User as BaseUser } from './user';

// Extended User type with role for authentication
export interface AuthUser extends BaseUser {
  role: string;
}

export interface LoginResponse {
  user: AuthUser;
  token?: string;
  access?: string;
  refresh?: string;
  need_2fa?: boolean;
  method?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
} 