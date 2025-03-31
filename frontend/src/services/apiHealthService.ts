import axios from '../utils/axios';
import { AxiosError } from 'axios';
import { 
  EndpointStatus, 
  GroupStatus, 
  SystemHealth, 
  MockApiHealthService,
  StatusType
} from './mockApiHealthService';
import { refreshAccessToken, getAccessToken } from '../utils/authUtils';

// Flag to determine if we should use mock data
// In production, this should be false
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

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
        } else if (USE_MOCK_DATA) {
          console.log(`[ApiHealthService] No token available for ${endpointInfo.name}, using mock data`);
          return MockApiHealthService.checkEndpoint(groupKey, endpointInfo);
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
            } else if (USE_MOCK_DATA) {
              console.log(`[ApiHealthService] Token refresh failed for ${endpointInfo.name}, using mock data`);
              return MockApiHealthService.checkEndpoint(groupKey, endpointInfo);
            } else {
              throw new Error('Token refresh failed');
            }
          } catch (refreshError) {
            if (USE_MOCK_DATA) {
              console.log(`[ApiHealthService] Token refresh error for ${endpointInfo.name}, using mock data`);
              return MockApiHealthService.checkEndpoint(groupKey, endpointInfo);
            }
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
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log(`[ApiHealthService] Using mock data for ${endpointInfo.name} due to error`);
        return MockApiHealthService.checkEndpoint(groupKey, endpointInfo);
      }
      
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
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[ApiHealthService] Using mock system health as fallback');
        return MockApiHealthService.getSystemHealth();
      }
      
      throw error;
    }
  },
  
  // Check all endpoints
  checkAllEndpoints: async (API_ENDPOINTS: any): Promise<Record<string, GroupStatus>> => {
    try {
      console.log('[ApiHealthService] Checking all endpoints');
      
      // Initialize results structure
      const results: Record<string, GroupStatus> = {};
      
      // Initialize each group
      Object.keys(API_ENDPOINTS).forEach(groupKey => {
        results[groupKey] = {
          name: `${groupKey.charAt(0).toUpperCase() + groupKey.slice(1)} Endpoints`,
          status: 'pending' as StatusType,
          endpoints: API_ENDPOINTS[groupKey].map((endpoint: any, index: number) => ({
            name: endpoint.name,
            endpoint: endpoint.endpoint,
            status: 'pending' as StatusType,
            responseTime: 0,
            message: 'Pending check',
            lastChecked: new Date()
          })),
          successRate: 0
        };
      });
      
      // Check core endpoints first to get authentication token
      const coreEndpoints = API_ENDPOINTS.core;
      if (coreEndpoints) {
        for (let index = 0; index < coreEndpoints.length; index++) {
          const endpoint = coreEndpoints[index];
          const result = await ApiHealthService.checkEndpoint('core', endpoint);
          
          // Update the results
          if (results.core && results.core.endpoints) {
            results.core.endpoints[index] = result;
          }
        }
        
        // Calculate success rate for core group
        if (results.core && results.core.endpoints) {
          const coreEndpointsResults = results.core.endpoints;
          const coreSuccessCount = coreEndpointsResults.filter(e => e.status === 'success').length;
          results.core.successRate = (coreSuccessCount / coreEndpointsResults.length) * 100;
          
          // Determine core group status
          if (coreSuccessCount === coreEndpointsResults.length) {
            results.core.status = 'success';
          } else if (coreSuccessCount === 0) {
            results.core.status = 'error';
          } else {
            results.core.status = 'warning';
          }
        }
      }
      
      // Check remaining endpoint groups
      const remainingGroups = Object.keys(API_ENDPOINTS).filter(group => group !== 'core');
      
      for (let groupIndex = 0; groupIndex < remainingGroups.length; groupIndex++) {
        const groupKey = remainingGroups[groupIndex];
        const endpoints = API_ENDPOINTS[groupKey as keyof typeof API_ENDPOINTS];
        
        if (!endpoints) {
          console.warn(`[ApiHealthService] No endpoints found for group ${groupKey}`);
          continue;
        }
        
        for (let index = 0; index < endpoints.length; index++) {
          const endpoint = endpoints[index];
          const result = await ApiHealthService.checkEndpoint(groupKey, endpoint);
          
          // Update the results
          if (results[groupKey] && results[groupKey].endpoints) {
            results[groupKey].endpoints[index] = result;
          }
        }
        
        // Calculate success rate for the group
        if (results[groupKey] && results[groupKey].endpoints) {
          const groupEndpoints = results[groupKey].endpoints;
          const successCount = groupEndpoints.filter(e => e.status === 'success').length;
          const warningCount = groupEndpoints.filter(e => e.status === 'warning').length;
          results[groupKey].successRate = ((successCount + (warningCount * 0.5)) / groupEndpoints.length) * 100;
          
          // Determine group status
          if (successCount === groupEndpoints.length) {
            results[groupKey].status = 'success';
          } else if (successCount === 0 && warningCount === 0) {
            results[groupKey].status = 'error';
          } else {
            results[groupKey].status = 'warning';
          }
        }
      }
      
      return results;
    } catch (error: unknown) {
      console.error('[ApiHealthService] Error checking all endpoints:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[ApiHealthService] Using mock endpoint statuses as fallback');
        return MockApiHealthService.getEndpointStatuses();
      }
      
      throw error;
    }
  }
}; 