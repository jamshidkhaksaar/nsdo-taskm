import axios from '../utils/axios';

// Initialize auth token from localStorage if it exists
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post('/api/auth/token/', {
      username,
      password,
    });

    if (response.data.access && response.data.refresh) {
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
    }

    return response.data;
  } catch (error) {
    throw new Error('Login failed');
  }
};

export { logout } from '../utils/authUtils';
