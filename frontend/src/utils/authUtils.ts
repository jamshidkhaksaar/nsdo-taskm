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
    logout();
    return null;
  }

  try {
    // Get the base URL without /api/v1 for auth endpoints
    const apiUrl = CONFIG.API_URL || 'http://localhost:3001';
    
    // Use the correct API URL for the refresh endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
    
    try {
      // Auth endpoints use the /api/v1 prefix like other endpoints
      const refreshUrl = `${apiUrl}/api/v1/auth/refresh`;
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: controller.signal,
        credentials: 'include' // Include cookies if using HTTP-only cookies
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Clear auth state on refresh failure
        logout();
        return null;
      }
      
      const data = await response.json();
      
      // Handle the response based on the backend's structure
      let newToken = null;
      let newRefreshToken = null;
      
      if (data.access || data.accessToken) {
        // If the backend returns access and refresh tokens
        newToken = data.access || data.accessToken;
        newRefreshToken = data.refresh || data.refreshToken || refreshToken;
      } else if (data.token) {
        // If the backend returns a token property instead
        newToken = data.token;
        newRefreshToken = data.refresh || data.refreshToken || refreshToken;
      }
      
      if (newToken) {
        storeTokens(newToken, newRefreshToken || refreshToken);
        
        // Import store and update Redux state
        try {
          store.dispatch(updateToken({ 
            token: newToken, 
            refreshToken: newRefreshToken || refreshToken 
          }));
        } catch (storeError) {
          // Continue even if Redux update fails
        }
        
        return newToken;
      } else {
        logout();
        return null;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    logout();
    return null;
  }
};
