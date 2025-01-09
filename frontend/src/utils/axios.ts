import axios from 'axios';
import { logout } from './authUtils';

const instance = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Accept': 'application/json',
  }
});

// Add request interceptor to handle authentication
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          logout();
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired'));
        }
        
        const response = await axios.post(
          'http://localhost:8000/api/auth/refresh/',
          { refresh: refreshToken }
        );
        
        const { access } = response.data;
        
        // Store new token
        localStorage.setItem('token', access);
        instance.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        
        // Retry original request
        return instance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;
