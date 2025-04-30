import axios from 'axios';
import { refreshAccessToken } from './authUtils';
import { CONFIG } from './config';

// Create axios instance with the correct base URL
let baseURL = CONFIG.API_URL;

// If baseURL is still empty or invalid, set a default
if (!baseURL) {
  baseURL = 'http://localhost:3001';
}

// Create separate axios instances for regular API calls and auth endpoints
const instance = axios.create({
  baseURL: `${baseURL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
  withCredentials: true, // Enable sending cookies (for CSRF protection)
});

// Function to ensure the auth token is properly set in the axios instance
export const ensureAuthToken = () => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (token) {
      // Set token in the instance headers
      instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Also update the global axios instance
      import('axios').then(axiosModule => {
        const globalAxios = axiosModule.default;
        globalAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }).catch(() => {
        // If dynamic import fails, fail silently
      });
    }
  } catch (error) {
    // If there's an error accessing localStorage (e.g., in SSR contexts)
    // just continue without setting the token
  }
};

// Call immediately to set token on initialization
ensureAuthToken();

// Global variables to handle token refresh
let isRefreshing = false;
const failedQueue: {resolve: (value?: unknown) => void; reject: (reason?: unknown) => void}[] = [];

// Process the failed requests queue
const processQueue = (error: Error | null, token: string | null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  
  // Clear the queue
  failedQueue.length = 0;
};

// Request interceptor
instance.interceptors.request.use(
  async (config) => {
    // For authenticated routes, ensure we have the latest token
    const token = localStorage.getItem('access_token');
    
    // Set the Authorization header with the latest token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Also update the default headers for future requests
      instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } 
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If there's no response at all, it's a network error
    if (!error.response) {
      return Promise.reject(error);
    }
    
    // If the error is not a 401 Unauthorized, just reject it
    if (error.response.status !== 401) {
      return Promise.reject(error);
    }
    
    // Avoid infinite loops - don't retry if:
    // 1. It's already a retry attempt
    // 2. It's a refresh token endpoint
    // 3. It's any auth endpoint
    if (originalRequest._retry || 
        (originalRequest.url && (
          originalRequest.url.includes('/auth/refresh') || 
          originalRequest.url.includes('/auth/login') ||
          originalRequest.url.includes('/auth/logout')
        ))) {
      return Promise.reject(error);
    }
    
    // Only try refreshing token once
    originalRequest._retry = true;
    
    // If we are already refreshing, add this request to the queue
    if (isRefreshing) {
      try {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (token) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return instance(originalRequest);
            }
            return Promise.reject(new Error('Failed to refresh token'));
          })
          .catch(err => {
            return Promise.reject(err);
          });
      } catch (queueError) {
        return Promise.reject(queueError);
      }
    }
    
    isRefreshing = true;
    
    try {
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        // Update the Authorization header with the new token
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Update all headers for future requests
        instance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        // Process any queued requests
        processQueue(null, newToken);
        
        // Retry the original request with the new token
        isRefreshing = false;
        return instance(originalRequest);
      } else {
        // Process queued requests with error
        processQueue(new Error('Failed to refresh token'), null);
        isRefreshing = false;
        return Promise.reject(new Error('Failed to refresh token'));
      }
    } catch (refreshError) {
      // Process queued requests with error
      processQueue(refreshError as Error, null);
      isRefreshing = false;
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default instance;