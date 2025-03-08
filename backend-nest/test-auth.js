// Script to test the authentication endpoint directly
const axios = require('axios');

const API_URL = 'http://localhost:3001';

// Test both the API root and the auth login endpoint
async function testEndpoints() {
  console.log('Testing backend API connectivity...');
  
  try {
    // Test API root
    console.log('\nTesting API root endpoint...');
    const apiResponse = await axios.get(`${API_URL}/api`);
    console.log('API root response:', apiResponse.status, apiResponse.data);
    
    // Test login endpoint
    console.log('\nTesting login endpoint...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    console.log('Login response status:', loginResponse.status);
    console.log('Login response data:', loginResponse.data);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('\nError during testing:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Server might be down or unreachable.');
      console.error('Request details:', error.request._currentUrl);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    // Try to test if the test server is running
    try {
      console.log('\nAttempting to connect to the test server...');
      const testResponse = await axios.get(`${API_URL}/api`);
      console.log('Test server response:', testResponse.status, testResponse.data);
      console.log('The test server seems to be running!');
    } catch (testError) {
      console.error('Test server is also not reachable:', testError.message);
      console.error('Please ensure a server is running on port 3001');
    }
  }
}

// Run the tests
testEndpoints(); 