// Simple test script to verify if login is working correctly
const axios = require('axios');

const baseURL = 'http://localhost:3001/api';

async function testLogin() {
  console.log('Testing login endpoint...');
  
  try {
    // Test the login endpoint with default credentials
    const response = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('Status code:', response.status);
    console.log('Access token:', response.data.access_token ? 'Received' : 'Missing');
    console.log('User info:', response.data.user);
    
    return response.data;
  } catch (error) {
    console.error('Login failed!');
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error('Status code:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Server might be down.');
    } else {
      // Something happened in setting up the request
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
}

// Test all authentication endpoints for debugging
async function testAllAuthEndpoints() {
  console.log('\n--- Testing Authentication Endpoints ---\n');
  
  try {
    // 1. Test the API root endpoint
    console.log('1. Testing API root endpoint...');
    const apiResponse = await axios.get(baseURL);
    console.log('API root response:', apiResponse.status, apiResponse.data);
    
    // 2. Test health endpoint
    console.log('\n2. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('Health response:', healthResponse.status, healthResponse.data);
    
    // 3. Test login endpoint
    console.log('\n3. Testing login endpoint...');
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        username: 'admin',
        password: 'admin123'
      });
      console.log('Login response:', loginResponse.status);
      console.log('Login data:', loginResponse.data);
      
      // Save the token for subsequent requests
      const token = loginResponse.data.access_token;
      
      if (token) {
        // 4. Test authenticated endpoint
        console.log('\n4. Testing authenticated endpoint...');
        try {
          const usersResponse = await axios.get(`${baseURL}/users`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('Users response:', usersResponse.status);
          console.log('Users count:', usersResponse.data.length);
        } catch (usersError) {
          console.error('Error fetching users:', usersError.response?.status, usersError.response?.data);
        }
      }
    } catch (loginError) {
      console.error('Login error:', loginError.response?.status, loginError.response?.data);
    }
    
    // 5. Test signin endpoint (alternative to login)
    console.log('\n5. Testing signin endpoint...');
    try {
      const signinResponse = await axios.post(`${baseURL}/auth/signin`, {
        username: 'admin',
        password: 'admin123'
      });
      console.log('Signin response:', signinResponse.status);
      console.log('Signin data:', signinResponse.data);
    } catch (signinError) {
      console.error('Signin error:', signinError.response?.status, signinError.response?.data);
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('\nTesting failed:', error.message);
  }
}

// Run the tests
testAllAuthEndpoints()
  .then(() => console.log('\nDone!'))
  .catch(error => console.error('\nError during testing:', error.message)); 