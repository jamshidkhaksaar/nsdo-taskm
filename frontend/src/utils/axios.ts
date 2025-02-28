import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';
import { refreshAccessToken } from './authUtils';
import { CONFIG } from './config';
import { 
  mockTasks, 
  mockUsers, 
  mockDepartments, 
  mockDashboardData,
  delay 
} from '../services/mockData';
import { mockDepartmentPerformance, mockDepartmentTasks } from '../mocks/mockData';

// Force mock data mode to true for development
if (process.env.NODE_ENV !== 'production') {
  // Set to true to use mock data instead of real API calls
  CONFIG.USE_MOCK_DATA = true;
}

// Create axios instance with the correct base URL
console.log('[CONFIG] API_URL:', CONFIG.API_URL);
console.log('[CONFIG] USE_MOCK_DATA:', CONFIG.USE_MOCK_DATA);

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

// Helper function to determine if we should use mock data
const shouldUseMockData = () => {
  // Always return true to use mock data
  return true;
};

// Track if we've already logged messages
let mockModeLoggedToConsole = false;
let mockRequestLoggedToConsole = false;

// If mock data is enabled, completely replace the axios adapter
// to prevent any actual network requests
if (shouldUseMockData()) {
  // Log once in development
  if (process.env.NODE_ENV === 'development' && !mockRequestLoggedToConsole) {
    console.log('[MOCK] Mock data mode enabled - no real API requests will be made');
    mockRequestLoggedToConsole = true;
  }
  
  // Replace the default adapter with our mock adapter
  instance.defaults.adapter = async (config) => {
    // Simulate network delay
    if (CONFIG.MOCK_DELAY > 0) {
      await delay(CONFIG.MOCK_DELAY);
    }
    
    // Return a mock response based on the request
    return await handleMockResponse(config);
  };
} else {
  // Log that we're using real API requests
  if (process.env.NODE_ENV !== 'production' && !mockRequestLoggedToConsole) {
    console.log('[REAL] Using real API requests to:', baseURL);
    mockRequestLoggedToConsole = true;
  }
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

// Mock API response handler
const handleMockResponse = async (config: any) => {
  // Extract URL and method
  const url = config.url || '';
  const method = config.method?.toLowerCase() || 'get';
  
  // Only log in development and not excessively
  if (process.env.NODE_ENV === 'development' && !mockModeLoggedToConsole) {
    console.log(`[MOCK] ${method.toUpperCase()} ${url}`);
    // Don't log for subsequent common endpoints
    if (!url.includes('/api/tasks') && !url.includes('/api/users')) {
      mockModeLoggedToConsole = true;
    }
  }
  
  // Handle auth endpoints
  if (url.includes('/api/auth/signin') || url.includes('/api/auth/login')) {
    if (method === 'post') {
      const requestData = JSON.parse(config.data || '{}');
      const username = requestData.username || 'user';
      
      // Create mock user data
      const mockUser = {
        id: 1,
        username: username,
        email: `${username}@example.com`,
        role: username.includes('admin') ? 'admin' : 'user',
        name: username.charAt(0).toUpperCase() + username.slice(1),
        avatar: null
      };
      
      // Create mock tokens
      const mockAccessToken = 'mock-access-token-' + Date.now();
      const mockRefreshToken = 'mock-refresh-token-' + Date.now();
      
      console.log('[MOCK] Login successful, returning mock auth data');
      
      return { 
        data: {
          user: mockUser,
          token: mockAccessToken,
          access: mockAccessToken,
          refresh: mockRefreshToken,
          message: 'Login successful'
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    }
  }
  
  // Handle tasks endpoints
  if (url.includes('/api/tasks')) {
    if (method === 'get') {
      return { 
        data: mockTasks,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    }
  }
  
  // Handle users endpoints
  if (url.includes('/api/users')) {
    if (method === 'get') {
      return { 
        data: mockUsers,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    }
  }
  
  // Handle departments endpoints
  if (url.includes('/api/departments')) {
    // Get all departments
    if (method === 'get' && !url.includes('performance') && !url.includes('tasks')) {
      return { 
        data: mockDepartments,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    }
    
    // Get department performance
    if (method === 'get' && url.includes('performance')) {
      const departmentId = url.split('/').slice(-2)[0] as keyof typeof mockDepartmentPerformance;
      const performance = mockDepartmentPerformance[departmentId];
      
      if (!performance) {
        return {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Department not found' },
          headers: {},
          config
        };
      }
      
      return {
        data: performance,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    }
    
    // Get department tasks
    if (method === 'get' && url.includes('tasks')) {
      const departmentId = url.split('/').slice(-2)[0] as keyof typeof mockDepartmentTasks;
      const tasks = mockDepartmentTasks[departmentId];
      
      if (!tasks) {
        return {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Department not found' },
          headers: {},
          config
        };
      }
      
      return {
        data: tasks,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    }
  }
  
  // Handle admin dashboard endpoint
  if (url.includes('/api/admin/dashboard')) {
    if (method === 'get') {
      return { 
        data: mockDashboardData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    }
  }
  
  // Handle admin health endpoint
  if (url.includes('/api/admin/health')) {
    if (method === 'get') {
      return { 
        data: {
          timestamp: new Date().toISOString(),
          status: 'ok',
          database: {
            connected: true,
            tables: {
              users: 4,
              departments: 3,
              tasks: 5
            }
          },
          system: {
            uptime: 3600,
            memory: {
              total: 8192,
              used: 4096,
              rss: 2048,
              external: 1024
            },
            node: {
              version: '16.14.0',
              platform: 'win32',
              arch: 'x64'
            }
          },
          api: {
            endpoints: [
              { name: 'Auth', path: '/api/auth', status: 'ok' },
              { name: 'Tasks', path: '/api/tasks', status: 'ok' },
              { name: 'Users', path: '/api/users', status: 'ok' },
              { name: 'Departments', path: '/api/departments', status: 'ok' }
            ],
            errors: []
          },
          environment: {
            nodeEnv: 'development',
            port: 3001,
            dbType: 'sqlite'
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    }
  }
  
  // Handle activity logs endpoint
  if (url.includes('/api/activity-logs')) {
    if (method === 'get') {
      return { 
        data: {
          logs: mockDashboardData.recent_activities,
          total: mockDashboardData.recent_activities.length,
          page: 0,
          limit: 10,
          pages: 1
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    }
  }
  
  // Handle health check endpoint
  if (url.includes('/api/health')) {
    return {
      data: { status: 'ok', message: 'Mock API is operational' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    };
  }
  
  // Default empty response
  return { 
    data: null,
    status: 404,
    statusText: 'Not Found',
    headers: {},
    config
  };
};

// Add response interceptor to handle token refresh and errors
instance.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Response from ${response.config.url}:`, response.status);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      console.error('Original request is undefined:', error);
      return Promise.reject(error);
    }
    
    // Log network errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      console.error(`Network error for ${originalRequest.url}:`, error.message);
      console.error('Please ensure your backend API is running and accessible.');
      return Promise.reject(error);
    }
    
    if (error.response) {
      // Log errors in development
      if (process.env.NODE_ENV !== 'production') {
        console.error(`Error response from ${originalRequest.url}:`, error.response.status, error.response.data);
      }
      
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
            
            // Retry the original request that failed
            return instance(originalRequest);
          } else {
            console.error('Token refresh returned null, logging out user');
            // If refresh failed, process queue with error and logout
            processQueue(new Error('Failed to refresh token'), null);
            store.dispatch(logout());
            
            // Redirect to login page
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }
        } catch (refreshError) {
          console.error('Token refresh error:', refreshError);
          // If refresh failed, process queue with error and logout
          processQueue(refreshError instanceof Error ? refreshError : new Error('Unknown refresh error'), null);
          store.dispatch(logout());
          
          // Redirect to login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;
