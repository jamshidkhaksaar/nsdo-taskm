import axios from './axios';

/**
 * Utility for testing API endpoints with real data
 */
export class ApiTester {
  private token: string | null = null;
  private userId: string | null = null;
  private departmentId: string | null = null;
  private results: Record<string, any> = {};

  /**
   * Initialize the API tester
   */
  constructor() {
    console.log('API Tester initialized');
  }

  /**
   * Test authentication
   * @param username Username for login
   * @param password Password for login
   */
  async testAuthentication(username: string = 'admin', password: string = 'admin123'): Promise<boolean> {
    try {
      console.log(`Testing authentication with username: ${username}`);
      const response = await axios.post('/api/auth/login', { username, password });
      
      // Extract token from response
      if (response.data) {
        // Try different token formats based on the API response structure
        if (response.data.accessToken) {
          this.token = response.data.accessToken;
        } else if (response.data.access) {
          this.token = response.data.access;
        } else if (response.data.token) {
          this.token = response.data.token;
        }
        
        // Extract user ID if available
        if (response.data.user && response.data.user.id) {
          this.userId = response.data.user.id;
        }
        
        this.results.authentication = {
          success: true,
          status: response.status,
          message: 'Authentication successful',
          token: this.token ? `${this.token.substring(0, 10)}...` : null,
          userId: this.userId
        };
        
        return true;
      }
      
      this.results.authentication = {
        success: false,
        status: response.status,
        message: 'Authentication response did not contain token'
      };
      return false;
    } catch (error: any) {
      this.results.authentication = {
        success: false,
        status: error.response?.status || 0,
        message: error.message || 'Unknown error during authentication'
      };
      return false;
    }
  }

  /**
   * Test getting all departments
   */
  async testGetDepartments(): Promise<boolean> {
    try {
      console.log('Testing get all departments');
      const headers: Record<string, string> = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      const response = await axios.get('/api/departments', { headers });
      
      // Extract department ID if available
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        this.departmentId = response.data[0].id;
      }
      
      this.results.departments = {
        success: true,
        status: response.status,
        count: Array.isArray(response.data) ? response.data.length : 0,
        departmentId: this.departmentId,
        data: response.data
      };
      
      return true;
    } catch (error: any) {
      this.results.departments = {
        success: false,
        status: error.response?.status || 0,
        message: error.message || 'Unknown error getting departments'
      };
      return false;
    }
  }

  /**
   * Test department performance endpoint
   */
  async testDepartmentPerformance(): Promise<boolean> {
    if (!this.departmentId) {
      this.results.departmentPerformance = {
        success: false,
        message: 'No department ID available for testing'
      };
      return false;
    }
    
    try {
      console.log(`Testing department performance for ID: ${this.departmentId}`);
      const headers: Record<string, string> = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      const response = await axios.get(`/api/departments/${this.departmentId}/performance`, { headers });
      
      this.results.departmentPerformance = {
        success: true,
        status: response.status,
        data: response.data
      };
      
      return true;
    } catch (error: any) {
      this.results.departmentPerformance = {
        success: false,
        status: error.response?.status || 0,
        message: error.message || 'Unknown error getting department performance'
      };
      return false;
    }
  }

  /**
   * Test getting all tasks
   */
  async testGetTasks(): Promise<boolean> {
    try {
      console.log('Testing get all tasks');
      const headers: Record<string, string> = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      const response = await axios.get('/api/tasks', { headers });
      
      this.results.tasks = {
        success: true,
        status: response.status,
        count: Array.isArray(response.data) ? response.data.length : 0,
        data: response.data
      };
      
      return true;
    } catch (error: any) {
      this.results.tasks = {
        success: false,
        status: error.response?.status || 0,
        message: error.message || 'Unknown error getting tasks'
      };
      return false;
    }
  }

  /**
   * Test admin dashboard endpoint
   */
  async testAdminDashboard(): Promise<boolean> {
    try {
      console.log('Testing admin dashboard');
      const headers: Record<string, string> = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      const response = await axios.get('/api/admin/dashboard', { headers });
      
      this.results.adminDashboard = {
        success: true,
        status: response.status,
        data: response.data
      };
      
      return true;
    } catch (error: any) {
      this.results.adminDashboard = {
        success: false,
        status: error.response?.status || 0,
        message: error.message || 'Unknown error getting admin dashboard'
      };
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<Record<string, any>> {
    console.log('Running all API tests with real data');
    
    // Reset results
    this.results = {};
    
    // Run tests in sequence
    await this.testAuthentication();
    await this.testGetDepartments();
    
    // Only run these if we have the required IDs
    if (this.departmentId) {
      await this.testDepartmentPerformance();
    }
    
    await this.testGetTasks();
    await this.testAdminDashboard();
    
    return this.results;
  }

  /**
   * Get test results
   */
  getResults(): Record<string, any> {
    return this.results;
  }
}

// Create a named instance before exporting
const apiTesterInstance = new ApiTester();
export default apiTesterInstance; 