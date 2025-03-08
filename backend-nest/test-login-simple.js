// Super simple test for just the login endpoint
const axios = require('axios');

console.log('Testing login endpoint...');

// Basic GET request to check if server is up
axios.get('http://localhost:3001/api')
  .then(response => {
    console.log('Server is up! Response:', response.data);
    
    // Now try login
    return axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
  })
  .then(loginResponse => {
    console.log('Login successful!');
    console.log('Status:', loginResponse.status);
    console.log('Data:', JSON.stringify(loginResponse.data, null, 2));
  })
  .catch(error => {
    console.error('Error occurred:');
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Server might be down.');
    } else {
      // Something happened in setting up the request
      console.error('Error message:', error.message);
    }
  }); 