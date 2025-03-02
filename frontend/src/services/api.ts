import axios from 'axios';
import type { LoginResponse, JWTResponse } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<JWTResponse>('/auth/login/', {
      username,
      password,
    });
    
    if (!response.data.access) {
      throw new Error('No access token received');
    }

    // Store tokens first
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    
    // Then store role from backend
    const userRole = response.data.user.role;
    localStorage.setItem('user_role', userRole);

    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
    
    return {
      user: response.data.user,
      access: response.data.access,
      refresh: response.data.refresh
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Auth interceptors
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const logout = async (): Promise<void> => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
  api.defaults.headers.common['Authorization'] = '';
  return Promise.resolve();
};

export default api;