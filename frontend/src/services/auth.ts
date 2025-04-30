import axios, { AxiosError } from 'axios';
import { storeTokens } from '../utils/authUtils';
import axiosInstance from '../utils/axios';
import { CONFIG } from '../utils/config';

// Create a special instance for auth endpoints
const authAxios = axios.create({
  baseURL: `${CONFIG.API_URL || 'http://localhost:3001'}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

// Define interfaces
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

// Initialize auth token from localStorage if it exists
const token = localStorage.getItem('access_token');
if (token) {
  authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    // Try primary endpoint first
    try {
      const response = await authAxios.post('/auth/signin', { username, password });
      
      // The backend returns { access, refresh, user }
      if (response.data && (response.data.access || response.data.token)) {
        const accessToken = response.data.access || response.data.token;
        const refreshToken = response.data.refresh || '';
        
        // Store tokens in localStorage
        storeTokens(accessToken, refreshToken);
        
        // Set the token in axios headers for future requests
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        authAxios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        return {
          success: true,
          message: 'Login successful',
          user: response.data.user,
          accessToken,
          refreshToken
        };
      } else {
        return {
          success: false,
          message: 'Invalid login response from server'
        };
      }
    } catch (primaryError) {
      // If primary endpoint fails, try fallback endpoint
      try {
        const response = await authAxios.post('/auth/login', { username, password });
        
        if (response.data && (response.data.access || response.data.token)) {
          const accessToken = response.data.access || response.data.token;
          const refreshToken = response.data.refresh || '';
          
          // Store tokens in localStorage
          storeTokens(accessToken, refreshToken);
          
          // Set the token in axios headers for future requests
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          authAxios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          return {
            success: true,
            message: 'Login successful',
            user: response.data.user,
            accessToken,
            refreshToken
          };
        } else {
          throw new Error('Invalid login response from server');
        }
      } catch (fallbackError) {
        // If fallback also fails, throw the primary error
        throw primaryError;
      }
    }
  } catch (error) {
    // Handle error and return appropriate response
    if (axios.isAxiosError(error) && (error as AxiosError).response) {
      const errorResponse = (error as AxiosError).response;
      return {
        success: false,
        message: (errorResponse?.data as any)?.message || 'Login failed',
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed. Please try again.',
    };
  }
};

export const logout = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Clear Authorization header from axios instances
    delete axiosInstance.defaults.headers.common['Authorization'];
    delete authAxios.defaults.headers.common['Authorization'];
    
    try {
      // We don't await this because we want to log out even if the server request fails
      axiosInstance.post('/auth/logout').catch(() => {
        // Silent catch - we're logging out locally regardless
      });
    } catch {
      // Silent catch - we're logging out locally regardless
    }
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error during logout'
    };
  }
};

export const register = async (userData: { username: string; email: string; password: string }): Promise<void> => {
  try {
    const response = await authAxios.post('/auth/signup', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async (): Promise<{access: string, refresh: string} | null> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    return null;
  }
  
  try {
    // Use authAxios for auth endpoints 
    const response = await authAxios.post('/auth/refresh', {
      refresh_token: refreshToken
    });
    
    const { access, refresh } = response.data;
    
    // Store the new tokens
    storeTokens(access, refresh || refreshToken);
    
    return response.data;
  } catch (error) {
    return null;
  }
};

export const AuthService = {
  login,
  logout,
  register,
  refreshToken
};

export default AuthService;
