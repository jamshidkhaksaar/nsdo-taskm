import axios from './axios';

// Store tokens in localStorage
export const storeTokens = (access: string, refresh: string) => {
  if (!access) {
    console.error('Attempted to store empty access token');
    return;
  }
  
  // Store tokens in localStorage
  localStorage.setItem('access_token', access);
  
  if (refresh) {
    localStorage.setItem('refresh_token', refresh);
  }
  
  // Set the token in axios headers - both in the instance and global axios
  try {
    // Import here to avoid circular dependency
    const axiosInstance = require('./axios').default;
    
    // Set token in the axios instance
    if (axiosInstance && axiosInstance.defaults) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    }
    
    // Also set in global axios
    axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    
    // Log token storage in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Tokens stored successfully. Auth headers updated.');
      
      // Verify the token was set correctly
      const instanceHeader = axiosInstance?.defaults?.headers?.common?.['Authorization'];
      const globalHeader = axios.defaults.headers.common['Authorization'];
      
      if (instanceHeader) {
        console.log('Instance Authorization header set:', instanceHeader.substring(0, 15) + '...');
      } else {
        console.warn('Failed to set instance Authorization header');
      }
      
      if (globalHeader) {
        console.log('Global Authorization header set:', globalHeader.substring(0, 15) + '...');
      } else {
        console.warn('Failed to set global Authorization header');
      }
    }
  } catch (error) {
    console.error('Error setting Authorization headers:', error);
    // Fallback to direct setting
    axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  }
};

// Parse JWT token to get payload
export const parseJwt = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error('Failed to parse JWT token:', e);
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
    console.error('Error checking authentication status:', error);
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
    console.log('No refresh token found, logging out');
    logout();
    return null;
  }

  try {
    console.log('Attempting to refresh token...');
    
    // Import the CONFIG to get the correct API URL
    const { CONFIG } = require('./config');
    const apiUrl = CONFIG.API_URL || 'http://localhost:3001';
    
    // Use the correct API URL for the refresh endpoint
    const response = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Token refresh response received');
    
    // Handle the response based on the backend's structure
    if (data.access) {
      // If the backend returns access and refresh tokens
      const { access, refresh } = data;
      console.log('New tokens received, storing them');
      storeTokens(access, refresh || refreshToken);
      return access;
    } else if (data.token) {
      // If the backend returns a token property instead
      const { token, refresh } = data;
      console.log('New token received, storing it');
      storeTokens(token, refresh || refreshToken);
      return token;
    } else if (data.accessToken) {
      // Another possible format
      const { accessToken, refreshToken: newRefreshToken } = data;
      console.log('New tokens received in different format, storing them');
      storeTokens(accessToken, newRefreshToken || refreshToken);
      return accessToken;
    }
    
    // If we couldn't get a new token
    console.log('No valid token in response, logging out');
    logout();
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    logout();
    return null;
  }
};
