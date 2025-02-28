import axios from '../utils/axios';
import { storeTokens } from '../utils/authUtils';

// Initialize auth token from localStorage if it exists
const token = localStorage.getItem('access_token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const login = async (username: string, password: string, verificationCode?: string, rememberMe: boolean = false) => {
  console.log('Attempting login with:', { username, password: '***', verificationCode: verificationCode ? '***' : undefined });
  
  const loginData = {
    username,
    password,
    verification_code: verificationCode,
    remember_me: rememberMe
  };
  
  try {
    // Use the signin endpoint directly
    console.log('Trying /api/auth/signin endpoint...');
    const response = await axios.post('/api/auth/signin', loginData);
    console.log('Signin response:', response);

    // Handle different response formats
    const accessToken = response.data.access || response.data.token;
    const refreshToken = response.data.refresh || '';
    
    if (accessToken) {
      // Store tokens consistently
      storeTokens(accessToken, refreshToken);
      
      // Store user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response.data;
  } catch (error) {
    console.error('Login attempt failed:', error);
    
    // Check if the server is running
    try {
      await axios.get('/api');
      console.log('API server is running, but login endpoint is not working');
    } catch (serverError) {
      console.error('API server may not be running:', serverError);
    }
    
    throw error;
  }
};

export const logout = async () => {
  try {
    // Call logout endpoint if available
    await axios.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Clear all tokens and user data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token'); // Remove legacy token
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
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

export const AuthService = {
  login,
  logout,
  register
};

export default AuthService;
