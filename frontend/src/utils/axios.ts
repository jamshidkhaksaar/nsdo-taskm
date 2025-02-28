import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';
import { refreshAccessToken } from './authUtils';

// Create axios instance with the correct base URL
const instance = axios.create({
  baseURL: 'http://localhost:3001',  // Updated port to match backend
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Add request interceptor to add auth token
instance.interceptors.request.use(
  (config) => {
    // Log the request for debugging
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.baseURL}${config.url}`);
    
    // Use access_token consistently
    const token = localStorage.getItem('access_token');
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

// Track if we're currently refreshing the token
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
interface QueueItem {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}
let failedQueue: QueueItem[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add response interceptor to handle token refresh and errors
instance.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      console.error(`Error response from ${error.config?.url}:`, error.response.status, error.response.data);
      
      // Handle unauthorized errors (expired token)
      if (error.response.status === 401 && !originalRequest._retry) {
        console.log('Received 401 error, attempting to refresh token');
        
        if (isRefreshing) {
          // If we're already refreshing, add this request to the queue
          console.log('Token refresh already in progress, adding request to queue');
          return new Promise(function(resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              console.log('Queue processed, retrying request with new token');
              originalRequest.headers['Authorization'] = `Bearer ${token as string}`;
              return instance(originalRequest);
            })
            .catch(err => {
              console.error('Failed queue processing:', err);
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        // Try to refresh the token
        try {
          console.log('Attempting to refresh token');
          const newToken = await refreshAccessToken();
          if (newToken) {
            console.log('Token refreshed successfully');
            // Update the authorization header
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            // Process any requests that were waiting for the token refresh
            processQueue(null, newToken);
            // Retry the original request
            return instance(originalRequest);
          } else {
            console.error('Token refresh returned null');
            // If refresh failed, process queue with error and logout
            processQueue(new Error('Failed to refresh token'), null);
            store.dispatch(logout());
            window.location.href = '/login';
            return Promise.reject(error);
          }
        } catch (refreshError) {
          console.error('Token refresh error:', refreshError);
          // If refresh failed, process queue with error and logout
          processQueue(refreshError instanceof Error ? refreshError : new Error('Unknown refresh error'), null);
          store.dispatch(logout());
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
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
