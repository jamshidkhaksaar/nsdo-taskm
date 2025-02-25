import axios from '../utils/axios';
import { User } from '../types/user';

export class AuthService {
  static async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const response = await axios.post('/api/auth/login/', { username, password });
    return response.data;
  }

  static async register(userData: Partial<User>): Promise<User> {
    const response = await axios.post('/api/auth/register/', userData);
    return response.data;
  }

  static async logout(): Promise<void> {
    await axios.post('/api/auth/logout/');
  }

  static async getCurrentUser(): Promise<User> {
    const response = await axios.get('/api/auth/user/');
    return response.data;
  }

  static async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await axios.put('/api/auth/user/', userData);
    return response.data;
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await axios.post('/api/auth/change-password/', { old_password: oldPassword, new_password: newPassword });
  }
} 