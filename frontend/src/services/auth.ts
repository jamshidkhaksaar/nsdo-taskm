import axios from '../utils/axios';

// Initialize auth token from localStorage if it exists
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const login = async (username: string, password: string, verificationCode?: string, rememberMe: boolean = false) => {
  const response = await axios.post('/api/auth/login/', {
    username,
    password,
    verification_code: verificationCode,
    remember_me: rememberMe
  });

  if (response.data.access) {
    // Set the token in localStorage
    localStorage.setItem('token', response.data.access);
    // Set the Authorization header for future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
  }

  return response.data;
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
