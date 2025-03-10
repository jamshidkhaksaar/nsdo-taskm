import axios from '../utils/axios';
import { User } from '../types/user';
import { AuthUser } from '../types/auth';
// Remove FingerprintJS dynamic import

export class AuthService {
  static async login(username: string, password: string, verificationCode?: string, rememberMe: boolean = false): Promise<{ token: string; user: AuthUser; access?: string; need_2fa?: boolean; method?: string }> {
    // Generate browser fingerprint for 2FA remember me feature - simplified approach
    let fingerprint = '';
    try {
      // Generate a simple browser fingerprint as a fallback
      // This is less secure but ensures login will work
      fingerprint = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${new Date().getTimezoneOffset()}`;
      console.log('Using simplified browser fingerprint');
    } catch (error) {
      console.warn('Failed to generate browser fingerprint:', error);
    }
    
    const loginData = {
      username,
      password,
      verification_code: verificationCode,
      remember_me: rememberMe,
      fingerprint
    };
    
    // Log the request data (with password masked)
    console.log('Login request:', {
      ...loginData,
      password: '********'
    });
    
    try {
      const response = await axios.post('/api/auth/signin', loginData);
      console.log('Login response:', response);
      
      // Transform the user data to include role if it doesn't exist
      const userData = response.data.user || {};
      const authUser: AuthUser = {
        ...(userData as User),
        role: userData.role || 'user' // Ensure role is always defined
      };
      
      return {
        ...response.data,
        user: authUser
      };
    } catch (error: any) {
      console.error('Login error:', error);
      // Log more detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      }
      throw error;
    }
  }

  static async requestEmailCode(username: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post('/api/auth/request-email-code', { username, password });
      console.log('Email code request response:', response);
      return response.data;
    } catch (error) {
      console.error('Email code request error:', error);
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

  static async getCurrentUser(): Promise<AuthUser> {
    const response = await axios.get('/api/auth/user');
    const userData = response.data;
    
    // Ensure user has role property
    return {
      ...userData,
      role: userData.role || 'user'
    };
  }

  static async updateProfile(userData: Partial<User>): Promise<AuthUser> {
    const response = await axios.put('/api/auth/user', userData);
    const updatedUser = response.data;
    
    // Ensure user has role property
    return {
      ...updatedUser,
      role: updatedUser.role || 'user'
    };
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await axios.post('/api/auth/change-password', { old_password: oldPassword, new_password: newPassword });
  }
} 