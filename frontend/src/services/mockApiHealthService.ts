// Mock API health service to provide fallback data when the API is unavailable

// Define types for API health data
export interface EndpointStatus {
  name: string;
  endpoint: string;
  status: 'success' | 'error' | 'warning' | 'pending' | 'unknown';
  statusCode?: number;
  responseTime: number;
  message: string;
  lastChecked: Date;
}

export interface GroupStatus {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending' | 'unknown';
  endpoints: EndpointStatus[];
  successRate: number;
}

export interface SystemHealth {
  timestamp: string;
  status: string;
  database: {
    connected: boolean;
    tables: {
      users: number;
      departments: number;
      tasks: number;
    }
  };
  system: {
    uptime: number;
    memory: {
      total: number;
      used: number;
      rss: number;
      external: number;
    };
    node: {
      version: string;
      platform: string;
      arch: string;
    }
  };
  api: {
    endpoints: Array<{
      name: string;
      path: string;
      status: string;
    }>;
    errors: any[];
  };
  environment: {
    nodeEnv: string;
    port: number;
    dbType: string;
  }
}

// Generate mock endpoint statuses
const generateMockEndpointStatuses = (): Record<string, GroupStatus> => {
  const now = new Date();
  
  return {
    core: {
      name: 'Core Endpoints',
      status: 'success',
      endpoints: [
        {
          name: 'Health Check',
          endpoint: '/api/health',
          status: 'success',
          statusCode: 200,
          responseTime: 85.4,
          message: 'Status 200 OK',
          lastChecked: now
        },
        {
          name: 'Authentication',
          endpoint: '/api/auth/login',
          status: 'success',
          statusCode: 201,
          responseTime: 180.8,
          message: 'Status 201 OK',
          lastChecked: now
        }
      ],
      successRate: 100
    },
    tasks: {
      name: 'Tasks Endpoints',
      status: 'warning',
      endpoints: [
        {
          name: 'Get All Tasks',
          endpoint: '/api/tasks',
          status: 'success',
          statusCode: 200,
          responseTime: 120.5,
          message: 'Status 200 OK',
          lastChecked: now
        },
        {
          name: 'Task Statistics',
          endpoint: '/api/tasks/user/:userId/statistics',
          status: 'warning',
          statusCode: 404,
          responseTime: 95.2,
          message: 'This endpoint is not implemented in the current backend version',
          lastChecked: now
        }
      ],
      successRate: 75
    },
    departments: {
      name: 'Departments Endpoints',
      status: 'warning',
      endpoints: [
        {
          name: 'Get All Departments',
          endpoint: '/api/departments',
          status: 'success',
          statusCode: 200,
          responseTime: 110.3,
          message: 'Status 200 OK',
          lastChecked: now
        },
        {
          name: 'Department Performance',
          endpoint: '/api/departments/:departmentId/performance',
          status: 'warning',
          statusCode: 404,
          responseTime: 90.1,
          message: 'This endpoint is not implemented in the current backend version',
          lastChecked: now
        }
      ],
      successRate: 75
    },
    admin: {
      name: 'Admin Endpoints',
      status: 'warning',
      endpoints: [
        {
          name: 'Admin Dashboard',
          endpoint: '/api/admin/dashboard',
          status: 'success',
          statusCode: 200,
          responseTime: 150.2,
          message: 'Status 200 OK',
          lastChecked: now
        },
        {
          name: 'Admin Health',
          endpoint: '/api/admin/health',
          status: 'success',
          statusCode: 200,
          responseTime: 130.4,
          message: 'Status 200 OK',
          lastChecked: now
        },
        {
          name: 'User Management',
          endpoint: '/api/admin/users',
          status: 'success',
          statusCode: 200,
          responseTime: 140.8,
          message: 'Status 200 OK',
          lastChecked: now
        },
        {
          name: 'System Logs',
          endpoint: '/api/admin/logs',
          status: 'warning',
          statusCode: 404,
          responseTime: 95.6,
          message: 'This endpoint is not implemented in the current backend version',
          lastChecked: now
        }
      ],
      successRate: 75
    }
  };
};

// Generate mock system health data
const generateMockSystemHealth = (): SystemHealth => {
  return {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    database: {
      connected: true,
      tables: {
        users: 15,
        departments: 5,
        tasks: 48
      }
    },
    system: {
      uptime: 345600, // 4 days in seconds
      memory: {
        total: 8589934592, // 8GB in bytes
        used: 4294967296, // 4GB in bytes
        rss: 2147483648, // 2GB in bytes
        external: 536870912 // 512MB in bytes
      },
      node: {
        version: 'v18.16.0',
        platform: 'win32',
        arch: 'x64'
      }
    },
    api: {
      endpoints: [
        { name: 'Auth', path: '/api/auth', status: 'operational' },
        { name: 'Tasks', path: '/api/tasks', status: 'operational' },
        { name: 'Departments', path: '/api/departments', status: 'operational' },
        { name: 'Admin', path: '/api/admin', status: 'operational' }
      ],
      errors: []
    },
    environment: {
      nodeEnv: 'development',
      port: 3001,
      dbType: 'sqlite'
    }
  };
};

export const MockApiHealthService = {
  // Get all endpoint statuses
  getEndpointStatuses: async (): Promise<Record<string, GroupStatus>> => {
    console.log('[MockApiHealthService] Returning mock endpoint statuses');
    return generateMockEndpointStatuses();
  },
  
  // Get system health
  getSystemHealth: async (): Promise<SystemHealth> => {
    console.log('[MockApiHealthService] Returning mock system health');
    return generateMockSystemHealth();
  },
  
  // Check a specific endpoint
  checkEndpoint: async (
    groupKey: string,
    endpointInfo: any
  ): Promise<EndpointStatus> => {
    console.log(`[MockApiHealthService] Checking mock endpoint: ${endpointInfo.name}`);
    
    // Get the mock data
    const mockData = generateMockEndpointStatuses();
    
    // Find the endpoint in the mock data
    const group = mockData[groupKey];
    if (!group) {
      return {
        name: endpointInfo.name,
        endpoint: endpointInfo.endpoint,
        status: 'error',
        responseTime: 0,
        message: 'Group not found in mock data',
        lastChecked: new Date()
      };
    }
    
    const endpoint = group.endpoints.find(e => e.name === endpointInfo.name);
    if (!endpoint) {
      return {
        name: endpointInfo.name,
        endpoint: endpointInfo.endpoint,
        status: 'error',
        responseTime: 0,
        message: 'Endpoint not found in mock data',
        lastChecked: new Date()
      };
    }
    
    return {
      ...endpoint,
      lastChecked: new Date() // Update the last checked time
    };
  }
}; 