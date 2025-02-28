import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';
import { refreshAccessToken } from './authUtils';
import { CONFIG } from './config';

// Create axios instance with the correct base URL
console.log('[CONFIG] API_URL:', CONFIG.API_URL);

// Force the baseURL to use port 3001 instead of 8000 if needed
let baseURL = CONFIG.API_URL;
if (baseURL.includes('localhost:8000')) {
  baseURL = baseURL.replace('localhost:8000', 'localhost:3001');
  console.log('[CONFIG] Forcing baseURL to use port 3001:', baseURL);
} else if (baseURL.match(/localhost:\d+/) && !baseURL.includes('localhost:3001')) {
  // Replace any other port with 3001
  baseURL = baseURL.replace(/localhost:\d+/, 'localhost:3001');
  console.log('[CONFIG] Forcing baseURL to use port 3001:', baseURL);
}

const instance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Function to ensure the auth token is properly set in the axios instance
export const ensureAuthToken = () => {
  const token = localStorage.getItem('access_token');
  
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth token loaded from localStorage and set in axios instance');
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.log('No auth token found in localStorage during initialization');
  }
};

// Call immediately to set token on initialization
ensureAuthToken();

// Log that we're using real API requests
if (process.env.NODE_ENV !== 'production') {
  console.log('[REAL] Using real API requests to:', baseURL);
}

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // For authenticated routes, ensure we have the latest token
    const token = localStorage.getItem('access_token');
    
    // Log request in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Set the Authorization header with the latest token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Also update the default headers for future requests
      instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // Check if this is an authenticated route that should have a token
      const isAuthenticatedRoute = config.url && !config.url.includes('/auth/login') && !config.url.includes('/health');
      
      if (isAuthenticatedRoute && process.env.NODE_ENV !== 'production') {
        console.warn(`Warning: No auth token available for authenticated route: ${config.url}`);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

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

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is not related to authentication, just reject it
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }
    
    // Prevent infinite loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    
    // If we're already refreshing, add this request to the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          return instance(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
    
    originalRequest._retry = true;
    isRefreshing = true;
    
    try {
      // Attempt to refresh the token
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        // Update the token in the current request
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        // Process any queued requests with the new token
        processQueue(null, newToken);
        // Return the original request with the new token
        return instance(originalRequest);
      } else {
        // If refresh failed, logout and reject all queued requests
        store.dispatch(logout());
        processQueue(new Error('Token refresh failed'), null);
        return Promise.reject(error);
      }
    } catch (refreshError) {
      // If refresh throws an error, logout and reject all queued requests
      store.dispatch(logout());
      processQueue(refreshError as Error, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default instance;
