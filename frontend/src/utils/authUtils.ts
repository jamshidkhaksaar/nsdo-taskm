import axios from './axios';
import { CONFIG } from './config';
import { store } from '../store';
import { updateToken } from '../store/slices/authSlice';

// Store tokens in localStorage
export const storeTokens = (access: string, refresh: string) => {
  if (!access) {
    return;
  }
  
  // Store tokens in localStorage
  localStorage.setItem('access_token', access);
  
  if (refresh) {
    localStorage.setItem('refresh_token', refresh);
  }
  
  // Set the token in axios headers - both in the instance and global axios
  try {
    const axiosInstance = axios;
    
    // Set token in the axios instance
    if (axiosInstance && axiosInstance.defaults) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    }
    
    // Also set in global axios
    axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  } catch (error) {
    // Fallback to direct setting
    axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  }
};

// Parse JWT token to get payload
export const parseJwt = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

// Check if a token is expired
export const isTokenExpired = (token: string): boolean => {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  
  // Add 10-second buffer to prevent edge cases
  return (payload.exp * 1000) < (Date.now() - 10000);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('access_token');
  if (!token) return false;
  
  try {
    // If token is not expired, user is authenticated
    if (!isTokenExpired(token)) {
      return true;
    }
    
    // If access token is expired, check refresh token
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken && !isTokenExpired(refreshToken)) {
      // We have a valid refresh token, so we consider the user authenticated
      // The axios interceptor will handle actual token refresh when needed
      return true;
    }
    
    // Both tokens expired
    return false;
  } catch (error) {
    return false;
  }
};

// Get current access token
export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Get current refresh token
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token'); // Remove legacy token key
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
};

// Refresh access token
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.error('Refresh token not found, logging out.');
    logout();
    return null;
  }

  try {
    // Use the configured axios instance
    // Note: The interceptor in axios.ts should prevent infinite loops for /auth/refresh
    const response = await axios.post('/auth/refresh', { 
      refresh_token: refreshToken 
    });

    const data = response.data;

    // Handle the response based on the backend's structure
    let newToken = data.access || data.accessToken;
    let newRefreshToken = data.refresh || data.refreshToken || refreshToken;

    if (newToken) {
      storeTokens(newToken, newRefreshToken);

      // Update Redux state
      try {
        store.dispatch(updateToken({ 
          token: newToken, 
          refreshToken: newRefreshToken 
        }));
      } catch (storeError) {
        console.error('Failed to update Redux store after token refresh:', storeError);
        // Continue even if Redux update fails
      }

      return newToken;
    } else {
      console.error('No new access token received from refresh endpoint.');
      logout();
      return null;
    }

  } catch (error: any) {
    console.error('Failed to refresh access token:', error.response?.data || error.message);
    logout(); // Logout on any refresh error
    return null;
  }
};
