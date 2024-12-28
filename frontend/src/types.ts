// User types
export interface User {
  id?: number;
  username: string;
  email?: string;
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