import axios from './axios';

// Store tokens in localStorage
export const storeTokens = (access: string, refresh: string) => {
  localStorage.setItem('token', access);
  localStorage.setItem('refreshToken', refresh);
  axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check if token is expired
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Get current access token
export const getAccessToken = (): string | null => {
  return localStorage.getItem('token');
};

// Get current refresh token
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
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
    const response = await axios.post('/api/auth/token/refresh/', {
      refresh: refreshToken
    });
    
    const { access } = response.data;
    storeTokens(access, refreshToken);
    return access;
  } catch (error) {
    logout();
    return null;
  }
};
