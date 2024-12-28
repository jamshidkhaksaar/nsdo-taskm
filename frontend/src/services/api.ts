import axios from 'axios';
import type { User } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

interface JWTResponse {
  access: string;
  refresh: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

interface LoginResponse {
  data: {
    token: string;
    user: User;
  };
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<JWTResponse>('/auth/login/', {
      username,
      password,
    });
    
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      
      return {
        data: {
          token: response.data.access,
          user: response.data.user || {
            id: 0,
            username,
            email: '',
          }
        }
      };
    }
    throw new Error('No access token received');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Auth interceptors
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const logout = async (): Promise<void> => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  api.defaults.headers.common['Authorization'] = '';
  return Promise.resolve();
};

export default api;