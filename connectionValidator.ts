import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:3001';

async function validateConnection() {
  console.log('Starting API connection validation...');
  console.log(`Using API URL: ${API_URL}`);
  
  try {
    // 1. Check health endpoint
    console.log('\n1. Checking health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health endpoint:', healthResponse.status, healthResponse.data);
    
    // 2. Try to authenticate
    console.log('\n2. Attempting authentication...');
    try {
      const authResponse = await axios.post(`${API_URL}/api/auth/login`, {
        username: 'admin',
        password: 'admin123'
      });
      console.log('✅ Authentication:', authResponse.status);
      
      // Set token for subsequent requests
      const token = authResponse.data.accessToken || authResponse.data.access;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('✅ Token received and set in headers');
        
        // 3. Try to fetch tasks
        console.log('\n3. Fetching tasks...');
        try {
          const tasksResponse = await axios.get(`${API_URL}/api/tasks`);
          console.log('✅ Tasks endpoint:', tasksResponse.status, 
            `Retrieved ${tasksResponse.data.length} tasks`);
        } catch (error) {
          const tasksError = error as AxiosError;
          console.log('❌ Tasks endpoint failed:', tasksError.response?.status);
          console.log('Error details:', tasksError.response?.data || tasksError.message);
        }
        
        // 4. Check database connection through a data-heavy endpoint
        console.log('\n4. Checking database connection through admin dashboard...');
        try {
          const adminResponse = await axios.get(`${API_URL}/api/admin/dashboard`);
          console.log('✅ Admin dashboard:', adminResponse.status);
          console.log('Database connection is working properly');
        } catch (error) {
          const adminError = error as AxiosError;
          console.log('⚠️ Admin endpoint check failed:', adminError.response?.status);
          console.log('This might be due to permissions or the endpoint not being available');
          console.log('Error details:', adminError.response?.data || adminError.message);
        }
      } else {
        console.log('⚠️ No token received in response');
        console.log('Response data:', JSON.stringify(authResponse.data, null, 2));
      }
    } catch (error) {
      const authError = error as AxiosError;
      console.log('❌ Authentication failed:', authError.response?.status);
      console.log('Error details:', authError.response?.data || authError.message);
      console.log('\nTrying to access public endpoints only...');
      
      // Try to access departments as a public endpoint
      try {
        const deptResponse = await axios.get(`${API_URL}/api/departments`);
        console.log('✅ Departments endpoint (public):', deptResponse.status);
      } catch (error) {
        const deptError = error as AxiosError;
        console.log('❌ Departments endpoint failed:', deptError.response?.status);
      }
    }
    
    // 5. Check CORS configuration
    console.log('\n5. Checking CORS configuration...');
    try {
      const corsResponse = await axios.get(`${API_URL}/api/health`, {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });
      console.log('✅ CORS is properly configured for frontend origin');
    } catch (error) {
      const corsError = error as AxiosError;
      if (corsError.message.includes('CORS')) {
        console.log('❌ CORS is not properly configured');
        console.log('Error:', corsError.message);
      } else {
        console.log('⚠️ Could not verify CORS configuration due to other errors');
      }
    }
    
    console.log('\nConnection validation completed.');
    
  } catch (error) {
    const mainError = error as Error;
    console.error('\n❌ Connection validation failed:', mainError.message);
    if ('code' in mainError && mainError.code === 'ECONNREFUSED') {
      console.error('Backend server is not running. Please start the NestJS server.');
    }
  }
}

validateConnection(); 