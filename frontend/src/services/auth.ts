import axios, { AxiosError } from 'axios';
import { storeTokens } from '../utils/authUtils';
import axiosInstance from '../utils/axios';

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
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  console.log(`Login attempt with username: ${username}, password: ${'*'.repeat(password.length)}`);
  
  try {
    const response = await axiosInstance.post('/api/auth/login', { username, password });
    
    // The backend returns { access, refresh, user }
    if (response.data && response.data.access) {
      // Store tokens in localStorage
      storeTokens(response.data.access, response.data.refresh || '');
      
      // Set the token in axios headers for future requests
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      
      return {
        success: true,
        message: 'Login successful',
        user: response.data.user,
        accessToken: response.data.access,
        refreshToken: response.data.refresh
      };
    } else {
      console.error('Login response missing token:', response.data);
      return {
        success: false,
        message: 'Invalid login response from server'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle error and return appropriate response
    if (axios.isAxiosError(error) && (error as AxiosError).response) {
      return {
        success: false,
        message: ((error as AxiosError).response?.data as any)?.message || 'Login failed',
      };
    }
    
    return {
      success: false,
      message: 'Login failed. Please try again.',
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
    delete axios.defaults.headers.common['Authorization'];
    delete axiosInstance.defaults.headers.common['Authorization'];
    
    // Log logout in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Logout successful. Auth headers cleared.');
      
      // Verify headers were cleared
      const globalHeader = axios.defaults.headers.common['Authorization'];
      const instanceHeader = axiosInstance.defaults.headers.common['Authorization'];
      
      if (globalHeader) {
        console.warn('Failed to clear global Authorization header');
      }
      
      if (instanceHeader) {
        console.warn('Failed to clear instance Authorization header');
      }
    }
    
    try {
      // We don't await this because we want to log out even if the server request fails
      axiosInstance.post('/auth/logout').catch(error => {
        console.warn('Error calling logout endpoint:', error);
      });
    } catch (error) {
      console.warn('Error during server logout:', error);
    }
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Error during logout:', error);
    return {
      success: false,
      message: 'Error during logout'
    };
  }
};

export const register = async (userData: { username: string; email: string; password: string }): Promise<void> => {
  console.log('Attempting registration with:', { username: userData.username, email: userData.email, password: '***' });
  
  try {
    const response = await axios.post('/api/auth/signup', userData);
    console.log('Registration response:', response);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

export const refreshToken = async (): Promise<{access: string, refresh: string} | null> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.error('No refresh token found');
    return null;
  }
  
  try {
    const response = await axios.post('/api/auth/refresh', {
      refresh_token: refreshToken
    });
    
    const { access, refresh } = response.data;
    
    // Store the new tokens
    storeTokens(access, refresh || refreshToken);
    
    return response.data;
  } catch (error) {
    console.error('Failed to refresh token:', error);
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
