import axiosInstance from '../utils/axios';
import axiosOriginal from 'axios';
import { User } from '../types/user';
import { AuthUser } from '../types/auth';
import { storeTokens } from '../utils/authUtils';
import { CONFIG } from '../utils/config';
// Remove FingerprintJS dynamic import

// Create a special instance for auth endpoints
const authAxios = axiosOriginal.create({
  baseURL: `${CONFIG.API_URL || 'http://localhost:3001'}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

export class AuthService {
  static async login(username: string, password: string, captchaToken?: string, verificationCode?: string, rememberMe: boolean = false): Promise<{ token: string; user: AuthUser; access?: string; refresh?: string; need_2fa?: boolean; method?: string }> {
    // Generate browser fingerprint for 2FA remember me feature - simplified approach
    let fingerprint = '';
    try {
      // Generate a simple browser fingerprint as a fallback
      fingerprint = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${new Date().getTimezoneOffset()}`;
    } catch (error) {
      // Continue without fingerprint if it fails
    }
    
    const loginData = {
      username,
      password,
      captchaToken,
      verification_code: verificationCode,
      remember_me: rememberMe,
      fingerprint
    };
    
    try {
      // Try the /auth/signin endpoint first
      const response = await authAxios.post('/auth/signin', loginData);
      
      // Transform the user data to include role if it doesn't exist
      const userData = response.data.user || {};
      const authUser: AuthUser = {
        ...(userData as User),
        role: userData.role || 'user' // Ensure role is always defined
      };
      
      // Store tokens if they exist in the response
      if (response.data.access) {
        storeTokens(response.data.access, response.data.refresh || '');
      }
      
      return {
        token: response.data.access || response.data.token,
        access: response.data.access || response.data.token,
        refresh: response.data.refresh,
        user: authUser,
        need_2fa: response.data.need_2fa,
        method: response.data.method
      };
    } catch (error: any) {
      // Try legacy login endpoint as fallback
      try {
        const fallbackResponse = await authAxios.post('/auth/login', loginData);
        
        const userData = fallbackResponse.data.user || {};
        const authUser: AuthUser = {
          ...(userData as User),
          role: userData.role || 'user'
        };
        
        // Store tokens if they exist in the response
        if (fallbackResponse.data.access || fallbackResponse.data.token) {
          storeTokens(
            fallbackResponse.data.access || fallbackResponse.data.token, 
            fallbackResponse.data.refresh || ''
          );
        }
        
        return {
          token: fallbackResponse.data.access || fallbackResponse.data.token,
          access: fallbackResponse.data.access || fallbackResponse.data.token,
          refresh: fallbackResponse.data.refresh,
          user: authUser,
          need_2fa: fallbackResponse.data.need_2fa,
          method: fallbackResponse.data.method
        };
      } catch (fallbackError) {
        // If both login attempts fail, throw the original error
        throw error;
      }
    }
  }

  static async requestEmailCode(username: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.post('auth/request-email-code', { username, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async register(userData: { username: string; email: string; password: string }): Promise<void> {
    const response = await axiosInstance.post('auth/signup', userData);
    return response.data;
  }

  static async logout(): Promise<void> {
    try {
      await axiosInstance.post('auth/logout');
    } catch (error) {
      // Still clear local storage even if server logout fails
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      delete axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  static async getCurrentUser(): Promise<AuthUser> {
    const response = await axiosInstance.get('auth/user');
    const userData = response.data;
    
    // Ensure user has role property
    return {
      ...userData,
      role: userData.role || 'user'
    };
  }

  static async updateProfile(userData: Partial<User>): Promise<AuthUser> {
    const response = await axiosInstance.put('auth/user', userData);
    const updatedUser = response.data;
    
    // Ensure user has role property
    return {
      ...updatedUser,
      role: updatedUser.role || 'user'
    };
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await axiosInstance.post('auth/change-password', { old_password: oldPassword, new_password: newPassword });
  }
} 