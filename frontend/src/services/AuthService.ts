import axios from '../utils/axios';
import { User } from '../types/user';

export class AuthService {
  static async login(username: string, password: string, verificationCode?: string, rememberMe: boolean = false): Promise<{ token: string; user: User; access?: string; need_2fa?: boolean }> {
    const loginData = {
      username,
      password,
      verification_code: verificationCode,
      remember_me: rememberMe
    };
    
    try {
      const response = await axios.post('/api/auth/signin', loginData);
      console.log('Login response:', response);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async register(userData: { username: string; email: string; password: string }): Promise<void> {
    const response = await axios.post('/api/auth/signup', userData);
    return response.data;
  }

  static async logout(): Promise<void> {
    await axios.post('/api/auth/logout');
  }

  static async getCurrentUser(): Promise<User> {
    const response = await axios.get('/api/auth/user');
    return response.data;
  }

  static async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await axios.put('/api/auth/user', userData);
    return response.data;
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await axios.post('/api/auth/change-password', { old_password: oldPassword, new_password: newPassword });
  }
} 