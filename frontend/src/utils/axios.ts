import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

// Create axios instance with the correct base URL
const instance = axios.create({
  baseURL: 'http://localhost:8000',  // Your NestJS backend URL
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor to add auth token
instance.interceptors.request.use(
  (config) => {
    // Log the request for debugging
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.baseURL}${config.url}`);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh and errors
instance.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`Error response from ${error.config?.url}:`, error.response.status, error.response.data);
      
      // Handle unauthorized errors (expired token)
      if (error.response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        store.dispatch(logout());
        window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default instance;
