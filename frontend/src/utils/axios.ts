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
} else if (baseURL.includes('localhost:3000')) {
  // Replace frontend port 3000 with backend port 3001
  baseURL = baseURL.replace('localhost:3000', 'localhost:3001');
  console.log('[CONFIG] Replacing frontend port with backend port:', baseURL);
} else if (baseURL.match(/localhost:\d+/) && !baseURL.includes('localhost:3001')) {
  // Replace any other port with 3001
  baseURL = baseURL.replace(/localhost:\d+/, 'localhost:3001');
  console.log('[CONFIG] Forcing baseURL to use port 3001:', baseURL);
}

// If baseURL is still empty or invalid, set a default
if (!baseURL || baseURL === '') {
  baseURL = 'http://localhost:3001';
  console.log('[CONFIG] Using default baseURL:', baseURL);
}

console.log('[CONFIG] Final baseURL:', baseURL);

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
      console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Set the Authorization header with the latest token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Also update the default headers for future requests
      instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token format
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
        
        // If token is expired or about to expire (within 30 seconds), try to refresh
        if (Date.now() >= expirationTime - 30000) {
          console.log('[Token] Token expired or about to expire, triggering refresh');
          // Don't await here, just trigger the refresh in the background
          refreshAccessToken().catch(error => {
            console.error('[Token] Failed to refresh token:', error);
          });
        }
      } catch (error) {
        console.error('[Token] Error parsing token:', error);
      }
    } else {
      // Check if this is an authenticated route that should have a token
      const isAuthenticatedRoute = config.url && 
        !config.url.includes('/auth/login') && 
        !config.url.includes('/auth/signin') && 
        !config.url.includes('/auth/refresh') && 
        !config.url.includes('/health');
      
      if (isAuthenticatedRoute) {
        console.warn(`[Auth] No auth token available for authenticated route: ${config.url}`);
        // Try to refresh the token if we have a refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Instead of returning a promise chain, just log the issue
          console.log('[Auth] Attempting to refresh token before request');
          refreshAccessToken().catch(error => {
            console.error('[Auth] Token refresh failed:', error);
          });
        }
      }
    }
    
    return config;
  },
  (error) => {
    console.error('[Request Error]:', error);
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
    // Log successful responses in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Response] ${response.status} ${response.config.url}`);
    }
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
      console.log('[Auth] Token refresh failed, logging out user');
      // Clear auth state
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Redirect to login only if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    
    originalRequest._retry = true;
    
    try {
      console.log('[Auth] Attempting to refresh token after 401 error...');
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        console.log('[Auth] Token refreshed successfully, retrying request');
        // Update the Authorization header with the new token
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Also update the default headers for future requests
        instance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        // Retry the original request with the new token
        return instance(originalRequest);
      } else {
        console.log('[Auth] Token refresh failed, redirecting to login');
        // Clear auth state
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Redirect to login only if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    } catch (refreshError) {
      console.error('[Auth] Error during token refresh:', refreshError);
      // Clear auth state
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Redirect to login only if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    }
  }
);

export default instance;
