import axios from '../utils/axios'; // Assuming configured axios instance
import { User } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const USERS_API_URL = `${API_URL}/users`;

export const getUsers = async (): Promise<User[]> => {
  try {
    console.log('[User Service] Fetching users from API...');
    const response = await axios.get<User[]>(USERS_API_URL);
    // The backend currently returns: { id, username, email, role: {id, name}, isActive }
    // The frontend User type is more comprehensive. We might need to map or ensure compatibility.
    // For dropdowns, id and username/email are key.
    return response.data;
  } catch (error: any) {
    console.error('Error fetching users:', error);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to fetch users. Please check network or contact support.');
  }
}; 