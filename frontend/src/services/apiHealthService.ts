import axios from '../utils/axios';
import { AxiosError } from 'axios';
import { refreshAccessToken, getAccessToken } from '../utils/authUtils';

// Define types that were previously imported from mockApiHealthService
export type StatusType = 'success' | 'warning' | 'error' | 'unknown';

export interface EndpointStatus {
  name: string;
  endpoint: string;
  status: StatusType;
  statusCode: number;
  responseTime: number;
  message: string;
  lastChecked: Date;
}

export interface GroupStatus {
  name: string;
  endpoints: EndpointStatus[];
  status: StatusType;
  lastChecked: Date;
}

export interface SystemHealth {
  status: StatusType;
  timestamp: Date;
  groups: GroupStatus[];
  version: string;
  environment: string;
  uptime: number;
  memoryUsage: {
    total: number;
    used: number;
    free: number;
  };
}

export const ApiHealthService = {
  // Check a specific endpoint
  checkEndpoint: async (
    groupKey: string,
    endpointInfo: any
  ): Promise<EndpointStatus> => {
    try {
      console.log(`[ApiHealthService] Checking endpoint: ${endpointInfo.name}`);
      
      const startTime = performance.now();
      let status: StatusType = 'unknown';
      let statusCode = 0;
      let message = '';
      let response: any = null;
      
      // Replace dynamic parameters if needed
      let url = endpointInfo.endpoint;
      if (endpointInfo.dynamicParams) {
        if (url.includes(':userId')) {
          const userId = localStorage.getItem('userId');
          if (userId) {
            url = url.replace(':userId', userId);
          } else if (endpointInfo.optional) {
            status = 'warning';
            message = endpointInfo.fallbackMessage || 'User ID required but not available';
            const endTime = performance.now();
            return {
              name: endpointInfo.name,
              endpoint: endpointInfo.endpoint,
              status,
              statusCode: 0,
              responseTime: endTime - startTime,
              message,
              lastChecked: new Date()
            };
          } else {
            throw new Error('User ID required but not available');
          }
        }
        
        // Handle both :departmentId and :id parameters for department endpoints
        if (url.includes(':departmentId') || url.includes(':id')) {
          const departmentId = localStorage.getItem('departmentId') || '1'; // Default to '1' if not available
          
          if (departmentId) {
            url = url.replace(':departmentId', departmentId).replace(':id', departmentId);
            console.log(`[ApiHealthService] Replaced department ID in URL: ${url}`);
          } else if (endpointInfo.optional) {
            status = 'warning';
            message = endpointInfo.fallbackMessage || 'Department ID required but not available';
            const endTime = performance.now();
            return {
              name: endpointInfo.name,
              endpoint: endpointInfo.endpoint,
              status,
              statusCode: 0,
              responseTime: endTime - startTime,
              message,
              lastChecked: new Date()
            };
          } else {
            throw new Error('Department ID required but not available');
          }
        }
      }
      
      // Set auth header if required
      const headers: Record<string, string> = {};
      if (endpointInfo.requiresAuth) {
        const token = getAccessToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          throw new Error('Authentication required but no token available');
        }
      }
      
      // Make the request with a timeout
      const requestConfig = { 
        headers,
        timeout: 10000 // 10 second timeout to prevent hanging requests
      };
      
      try {
        if (endpointInfo.method === 'GET') {
          response = await axios.get(url, requestConfig);
        } else if (endpointInfo.method === 'POST') {
          response = await axios.post(url, endpointInfo.payload || {}, requestConfig);
        } else {
          throw new Error(`Unsupported method: ${endpointInfo.method}`);
        }
      } catch (error: any) {
        // Handle 401 Unauthorized error by attempting to refresh the token
        if (error.response && error.response.status === 401 && endpointInfo.requiresAuth) {
          console.log('Received 401 error, attempting to refresh token...');
          try {
            // Try to refresh the token
            const newToken = await refreshAccessToken();
            if (newToken) {
              console.log('Token refreshed successfully, retrying request...');
              // Update headers with new token
              headers['Authorization'] = `Bearer ${newToken}`;
              
              // Retry the request with the new token
              if (endpointInfo.method === 'GET') {
                response = await axios.get(url, { ...requestConfig, headers });
              } else if (endpointInfo.method === 'POST') {
                response = await axios.post(url, endpointInfo.payload || {}, { ...requestConfig, headers });
              }
            } else {
              throw new Error('Token refresh failed');
            }
          } catch (refreshError) {
            throw refreshError;
          }
        } else {
          throw error;
        }
      }
      
      // Process the response
      statusCode = response.status;
      
      // Special handling for health endpoint
      if (endpointInfo.name === 'Health Check' && response.data) {
        // Store system health data if available
        if (response.data.status && response.data.timestamp) {
          // We'll handle this in the component
        }
      }
      
      status = 'success';
      message = `Status ${statusCode} OK`;
      
      const endTime = performance.now();
      
      return {
        name: endpointInfo.name,
        endpoint: endpointInfo.endpoint,
        status,
        statusCode,
        responseTime: endTime - startTime,
        message,
        lastChecked: new Date()
      };
    } catch (error: any) {
      console.error(`[ApiHealthService] Error checking endpoint ${endpointInfo.name}:`, error);
      
      const endTime = performance.now();
      let status: StatusType = 'error';
      let message = '';
      let statusCode = 0;
      
      if (error.response) {
        statusCode = error.response.status;
        
        if (statusCode === 404 && endpointInfo.optional) {
          status = 'warning';
          message = endpointInfo.fallbackMessage || `Endpoint not found (404): ${endpointInfo.endpoint}`;
        } else if (statusCode === 500 && endpointInfo.optional) {
          status = 'warning';
          message = endpointInfo.fallbackMessage || `Server error (500): ${endpointInfo.endpoint}`;
        } else if (statusCode === 401 || statusCode === 403) {
          status = 'error';
          message = `Authentication error (${statusCode}): ${error.message || 'No details available'}`;
        } else {
          status = 'error';
          message = `HTTP error ${statusCode}: ${error.message || 'No details available'}`;
        }
      } else if (error.request) {
        status = 'error';
        message = `No response received: ${error.message || 'Request timed out'}`;
      } else if (error.message && error.message.includes('User ID required')) {
        if (endpointInfo.optional) {
          status = 'warning';
          message = endpointInfo.fallbackMessage || error.message;
        } else {
          status = 'error';
          message = error.message;
        }
      } else if (error.message && error.message.includes('Department ID required')) {
        if (endpointInfo.optional) {
          status = 'warning';
          message = endpointInfo.fallbackMessage || error.message;
        } else {
          status = 'error';
          message = error.message;
        }
      } else if (error.message && error.message.includes('Authentication required')) {
        status = 'error';
        message = error.message;
      } else {
        status = 'error';
        message = `Error: ${error.message || 'Unknown error'}`;
      }
      
      return {
        name: endpointInfo.name,
        endpoint: endpointInfo.endpoint,
        status,
        statusCode,
        responseTime: endTime - performance.now(),
        message,
        lastChecked: new Date()
      };
    }
  },
  
  // Get system health
  getSystemHealth: async (): Promise<SystemHealth> => {
    try {
      console.log('[ApiHealthService] Fetching system health');
      const response = await axios.get('/api/health');
      return response.data;
    } catch (error: unknown) {
      console.error('[ApiHealthService] Error fetching system health:', error);
      
      // Return a basic error status
      return {
        status: 'error',
        timestamp: new Date(),
        groups: [],
        version: 'unknown',
        environment: 'unknown',
        uptime: 0,
        memoryUsage: {
          total: 0,
          used: 0,
          free: 0,
        }
      };
    }
  },
  
  // Check the API health
  checkApiHealth: async (): Promise<GroupStatus[]> => {
    console.log('[ApiHealthService] Running API health check');
    
    // Define the API endpoints to check
    const endpointGroups = [
      {
        key: 'auth',
        name: 'Authentication',
        endpoints: [
          {
            name: 'Login',
            method: 'POST',
            endpoint: '/auth/login',
            requiresAuth: false,
            payload: { username: 'health_check', password: 'health_check' },
            optional: true,
            fallbackMessage: 'Login endpoint error - this is expected for health checks'
          },
          {
            name: 'Refresh Token',
            method: 'POST',
            endpoint: '/auth/refresh',
            requiresAuth: false,
            optional: true,
            fallbackMessage: 'Refresh token endpoint error - this is expected for health checks'
          }
        ]
      },
      {
        key: 'users',
        name: 'User Management',
        endpoints: [
          {
            name: 'User Profile',
            method: 'GET',
            endpoint: '/users/profile',
            requiresAuth: true,
            dynamicParams: false
          },
          {
            name: 'User List',
            method: 'GET',
            endpoint: '/users',
            requiresAuth: true
          }
        ]
      },
      {
        key: 'tasks',
        name: 'Task Management',
        endpoints: [
          {
            name: 'Tasks List',
            method: 'GET',
            endpoint: '/tasks',
            requiresAuth: true
          },
          {
            name: 'Task Categories',
            method: 'GET',
            endpoint: '/tasks/categories',
            requiresAuth: true,
            optional: true
          }
        ]
      },
      {
        key: 'departments',
        name: 'Department Management',
        endpoints: [
          {
            name: 'Departments List',
            method: 'GET',
            endpoint: '/departments',
            requiresAuth: true
          },
          {
            name: 'Department Details',
            method: 'GET',
            endpoint: '/departments/:id',
            requiresAuth: true,
            dynamicParams: true,
            optional: true
          }
        ]
      },
      {
        key: 'settings',
        name: 'Settings',
        endpoints: [
          {
            name: 'Security Settings',
            method: 'GET',
            endpoint: '/settings/security-settings/1',
            requiresAuth: true,
            optional: true
          },
          {
            name: 'Notification Settings',
            method: 'GET',
            endpoint: '/settings/notification-settings/1',
            requiresAuth: true,
            optional: true
          }
        ]
      },
      {
        key: 'system',
        name: 'System',
        endpoints: [
          {
            name: 'Health Check',
            method: 'GET',
            endpoint: '/health',
            requiresAuth: false
          },
          {
            name: 'API Status',
            method: 'GET',
            endpoint: '/api/status',
            requiresAuth: false,
            optional: true
          }
        ]
      }
    ];
    
    // Check each endpoint in each group
    const groupResults: GroupStatus[] = [];
    
    for (const group of endpointGroups) {
      console.log(`[ApiHealthService] Checking group: ${group.name}`);
      
      const endpointResults: EndpointStatus[] = [];
      let groupStatus: StatusType = 'success';
      
      for (const endpoint of group.endpoints) {
        try {
          const result = await this.checkEndpoint(group.key, endpoint);
          endpointResults.push(result);
          
          // Update group status based on endpoint status
          if (result.status === 'error') {
            groupStatus = 'error';
          } else if (result.status === 'warning' && groupStatus !== 'error') {
            groupStatus = 'warning';
          }
        } catch (error) {
          console.error(`[ApiHealthService] Error checking endpoint ${endpoint.name}:`, error);
          
          endpointResults.push({
            name: endpoint.name,
            endpoint: endpoint.endpoint,
            status: 'error',
            statusCode: 0,
            responseTime: 0,
            message: `Failed to check endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
            lastChecked: new Date()
          });
          
          groupStatus = 'error';
        }
      }
      
      groupResults.push({
        name: group.name,
        endpoints: endpointResults,
        status: groupStatus,
        lastChecked: new Date()
      });
    }
    
    return groupResults;
  }
}; 