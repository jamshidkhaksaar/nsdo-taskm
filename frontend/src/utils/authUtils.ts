import axios from './axios';

// Store tokens in localStorage
export const storeTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('access_token');
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
    // Use the correct refresh token endpoint
    const response = await axios.post('/api/auth/refresh', {
      refresh_token: refreshToken
    });
    
    console.log('Token refresh response:', response.status);
    
    // Handle the response based on the backend's structure
    if (response.data.access) {
      // If the backend returns access and refresh tokens
      const { access, refresh } = response.data;
      console.log('New tokens received, storing them');
      storeTokens(access, refresh || refreshToken);
      return access;
    } else if (response.data.token) {
      // If the backend returns a token property instead
      const { token, refresh } = response.data;
      console.log('New token received, storing it');
      storeTokens(token, refresh || refreshToken);
      return token;
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
