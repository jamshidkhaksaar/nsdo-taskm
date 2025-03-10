import axios from '../utils/axios';
import { refreshAccessToken } from '../utils/authUtils';
import type { LoginResponse, JWTResponse } from '../types';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Custom error class for authentication errors
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Generic API client with token refresh capability
export const apiClient = {
  async get<T>(url: string, config: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.get(url, config);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        console.log(`Attempting to refresh token for GET ${url}`);
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // Retry the request with the new token
          console.log(`Token refreshed, retrying GET ${url}`);
          const retryResponse = await axios.get(url, config);
          return retryResponse.data;
        } else {
          throw new AuthError('Authentication failed');
        }
      }
      
      console.error(`Error in GET ${url}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },
  
  async post<T>(url: string, data: any, config: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.post(url, data, config);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        console.log(`Attempting to refresh token for POST ${url}`);
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // Retry the request with the new token
          console.log(`Token refreshed, retrying POST ${url}`);
          const retryResponse = await axios.post(url, data, config);
          return retryResponse.data;
        } else {
          throw new AuthError('Authentication failed');
        }
      }
      
      console.error(`Error in POST ${url}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },
  
  async put<T>(url: string, data: any, config: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.put(url, data, config);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        console.log(`Attempting to refresh token for PUT ${url}`);
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // Retry the request with the new token
          console.log(`Token refreshed, retrying PUT ${url}`);
          const retryResponse = await axios.put(url, data, config);
          return retryResponse.data;
        } else {
          throw new AuthError('Authentication failed');
        }
      }
      
      console.error(`Error in PUT ${url}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },
  
  async patch<T>(url: string, data: any, config: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.patch(url, data, config);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        console.log(`Attempting to refresh token for PATCH ${url}`);
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // Retry the request with the new token
          console.log(`Token refreshed, retrying PATCH ${url}`);
          const retryResponse = await axios.patch(url, data, config);
          return retryResponse.data;
        } else {
          throw new AuthError('Authentication failed');
        }
      }
      
      console.error(`Error in PATCH ${url}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },
  
  async delete<T>(url: string, config: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.delete(url, config);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        console.log(`Attempting to refresh token for DELETE ${url}`);
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // Retry the request with the new token
          console.log(`Token refreshed, retrying DELETE ${url}`);
          const retryResponse = await axios.delete(url, config);
          return retryResponse.data;
        } else {
          throw new AuthError('Authentication failed');
        }
      }
      
      console.error(`Error in DELETE ${url}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  }
};

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post<JWTResponse>('/auth/login/', {
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

    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
    
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
axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

export const logout = async (): Promise<void> => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
  axios.defaults.headers.common['Authorization'] = '';
  return Promise.resolve();
};

export default axios;