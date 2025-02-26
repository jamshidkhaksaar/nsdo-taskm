import axios from '../utils/axios';

// Initialize auth token from localStorage if it exists
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const login = async (username: string, password: string, verificationCode?: string, rememberMe: boolean = false) => {
  console.log('Attempting login with:', { username, password: '***', verificationCode: verificationCode ? '***' : undefined });
  
  const loginData = {
    username,
    password,
    verification_code: verificationCode,
    remember_me: rememberMe
  };
  
  try {
    // Try the login endpoint first (without trailing slash)
    try {
      console.log('Trying /api/auth/login endpoint...');
      const response = await axios.post('/api/auth/login', loginData);
      console.log('Login response:', response);

      if (response.data.access) {
        // Set the token in localStorage
        localStorage.setItem('token', response.data.access);
        // Set the Authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      }

      return response.data;
    } catch (loginError) {
      console.error('Login endpoint failed:', loginError);
      
      // Try signin endpoint as fallback (without trailing slash)
      console.log('Trying /api/auth/signin endpoint...');
      const response = await axios.post('/api/auth/signin', loginData);
      console.log('Signin response:', response);

      if (response.data.access) {
        // Set the token in localStorage
        localStorage.setItem('token', response.data.access);
        // Set the Authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      }

      return response.data;
    }
  } catch (error) {
    console.error('All login attempts failed:', error);
    
    // Check if the server is running
    try {
      await axios.get('/api');
      console.log('API server is running, but login endpoints are not working');
    } catch (serverError) {
      console.error('API server may not be running:', serverError);
    }
    
    throw error;
  }
};

export const logout = async () => {
  // Store the remembered username before clearing storage
  const rememberedUsername = localStorage.getItem('rememberedUsername');
  
  // Clear tokens and user data
  localStorage.clear();
  
  // Restore remembered username if it existed
  if (rememberedUsername) {
    localStorage.setItem('rememberedUsername', rememberedUsername);
  }
  
  // Remove Authorization header
  delete axios.defaults.headers.common['Authorization'];
};

export const AuthService = {
  login,
  logout
};

export default AuthService;
