import axios from 'axios';
import { refreshAccessToken } from './authUtils';
import { CONFIG } from './config';

// Create axios instance with the correct base URL
console.log('[CONFIG] API_URL:', CONFIG.API_URL);

// Force the baseURL to use the value from CONFIG + add the API prefix
let baseURL = CONFIG.API_URL + '/api/v1'; // Append the global prefix

// If baseURL is still empty or invalid, set a default (less likely now)
if (!baseURL || baseURL === '/api/v1') { // Adjust default check slightly
  baseURL = 'http://localhost:3001/api/v1';
  console.log('[CONFIG] Using default baseURL:', baseURL);
}

console.log('[CONFIG] Final baseURL:', baseURL);

const instance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
  withCredentials: true, // Enable sending cookies (for CSRF protection)
});

// Function to ensure the auth token is properly set in the axios instance
export const ensureAuthToken = () => {
  const token = localStorage.getItem('access_token');
  
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Also update the global axios instance
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
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
console.log('[PRODUCTION] Using real API requests to:', baseURL);

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
      
      // Verify token format - ONLY trigger token refresh for expired tokens
      // and do it asynchronously without blocking the request
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const tokenPayload = JSON.parse(atob(tokenParts[1]));
          const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
          
          // If token is expired or about to expire (within 60 seconds), refresh it before proceeding
          if (Date.now() >= expirationTime - 60000) {
            console.log('[Token] Token expired or about to expire, refreshing before request');
            try {
              // Wait for token refresh to complete before proceeding with the request
              const newToken = await refreshAccessToken();
              if (newToken) {
                // Update the request with the new token
                config.headers['Authorization'] = `Bearer ${newToken}`;
                console.log('[Token] Successfully refreshed token for request');
              }
            } catch (refreshError) {
              console.error('[Token] Failed to refresh token before request:', refreshError);
              // Continue with the request even if refresh fails
            }
          }
        }
      } catch (error) {
        console.error('[Token] Error parsing token:', error);
        // Continue with the request even if token parsing fails
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
          try {
            console.log('[Auth] Attempting to refresh token before request');
            // Wait for token refresh to complete
            const newToken = await refreshAccessToken();
            if (newToken) {
              // Update the request with the new token
              config.headers['Authorization'] = `Bearer ${newToken}`;
              console.log('[Auth] Successfully refreshed token for request');
            }
          } catch (refreshError) {
            console.error('[Auth] Token refresh failed:', refreshError);
            // Continue with the request even if refresh fails
          }
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
    
    // Don't retry if already a retry attempt or if it's a refresh token endpoint
    if (originalRequest._retry || 
        (originalRequest.url && originalRequest.url.includes('/auth/refresh'))) {
      console.log('[Auth] Token refresh failed or already retried, not logging out immediately');
      // Instead of logging out immediately, allow navigation to continue
      // The router guards will handle redirection if needed
      return Promise.reject(error);
    }
    
    // Only try refreshing token once
    originalRequest._retry = true;
    
    // If we are already refreshing, add this request to the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          if (token) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return instance(originalRequest);
          }
          return Promise.reject(error);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
    
    isRefreshing = true;
    
    try {
      console.log('[Auth] Attempting to refresh token after 401 error...');
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        console.log('[Auth] Token refreshed successfully, retrying request');
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
        console.log('[Auth] Token refresh failed, but not redirecting immediately');
        // Process queued requests with error
        processQueue(new Error('Failed to refresh token'), null);
        isRefreshing = false;
        return Promise.reject(error);
      }
    } catch (refreshError) {
      console.error('[Auth] Error during token refresh:', refreshError);
      // Process queued requests with error
      processQueue(refreshError as Error, null);
      isRefreshing = false;
      return Promise.reject(refreshError);
    }
  }
);

export default instance;
