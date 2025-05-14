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

// Define the expected return type for the login method more accurately
interface LoginResponse {
  token: string;
  user: AuthUser;
  access?: string;
  refresh?: string;
  twoFactorRequired?: boolean; // Changed from need_2fa and made optional
  userId?: string; // Added userId for 2FA flow
  method?: string;
}

export class AuthService {
  static async login(username: string, password: string, captchaToken?: string, /* verificationCode?: string, */ rememberMe: boolean = false): Promise<LoginResponse> {
    let fingerprint = '';
    try {
      fingerprint = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${new Date().getTimezoneOffset()}`;
    } catch (error) {
      console.warn("Could not generate browser fingerprint:", error);
    }
    
    const loginData = {
      username,
      password,
      captchaToken,
      // verification_code is NOT sent in the initial login. It's for the 2FA step.
      remember_me: rememberMe,
      fingerprint
    };
    
    try {
      const response = await authAxios.post('/auth/signin', loginData);
      
      if (response.data.twoFactorRequired && response.data.userId) {
        return {
          token: '', 
          access: '',
          refresh: '',
          user: { 
            id: response.data.userId,
            username: '', 
            email: '',
            role: 'user', 
            permissions: [], 
            first_name: '',
            last_name: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as AuthUser,
          twoFactorRequired: true,
          userId: response.data.userId,
          method: response.data.method,
        };
      }
      
      if (response.data.access && response.data.user) {
        storeTokens(response.data.access, response.data.refresh || '');
        const userData = response.data.user;
        const authUser: AuthUser = {
          ...(userData as User),
          id: String(userData.id), // Ensure id is string
          role: userData.role?.name || userData.role || 'user', // Handle role object or string
          permissions: userData.role?.permissions?.map((p: any) => p.name) || userData.permissions || [],
          // Ensure all other required fields from AuthUser have defaults if not present
          username: userData.username || '',
          email: userData.email || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          created_at: userData.created_at || new Date().toISOString(),
          updated_at: userData.updated_at || new Date().toISOString(),
        };
        return {
          token: response.data.access,
          access: response.data.access,
          refresh: response.data.refresh,
          user: authUser,
          twoFactorRequired: false,
        };
      } else {
        console.error("Login response missing access token or user data:", response.data);
        throw new Error("Login failed: Server response incomplete.");
      }
      
    } catch (error: any) {
      console.error("Error during AuthService.login with /auth/signin:", error.response?.data || error.message);
      // No fallback to /auth/login anymore, just re-throw the error from /auth/signin
      throw error; 
    }
  }

  static async login2FA(userId: string, verificationCode: string, rememberDevice?: boolean): Promise<LoginResponse> {
    const response = await axiosInstance.post<{ access: string; refresh: string; user: User }>(
      '/auth/login/2fa',
      { userId, verificationCode, rememberDevice },
    );

    const backendUser = response.data.user; // This is of type User from backend
    let userRoleName: string = 'user';
    let userPermissions: string[] = [];

    if (backendUser.role) {
      if (typeof backendUser.role === 'object' && backendUser.role !== null && 'name' in backendUser.role) {
        userRoleName = (backendUser.role as any).name;
        // Attempt to get permissions from the role object
        if ((backendUser.role as any).permissions && Array.isArray((backendUser.role as any).permissions)) {
          userPermissions = (backendUser.role as any).permissions.map((p: any) => 
            typeof p === 'object' && p !== null && p.name ? p.name : typeof p === 'string' ? p : ''
          ).filter(p => p !== '');
        }
      } else if (typeof backendUser.role === 'string') {
        userRoleName = backendUser.role;
        // If role is a string, permissions might be directly on backendUser or need a lookup (not done here)
        if ((backendUser as any).permissions && Array.isArray((backendUser as any).permissions)) {
             userPermissions = (backendUser as any).permissions.map((p:any) => 
                typeof p === 'object' && p !== null && p.name ? p.name : typeof p === 'string' ? p : ''
             ).filter(p => p !== '');
        }
      }
    } else if ((backendUser as any).permissions && Array.isArray((backendUser as any).permissions)) {
        // Fallback if role is missing but permissions array exists directly on user
        userPermissions = (backendUser as any).permissions.map((p:any) => 
            typeof p === 'object' && p !== null && p.name ? p.name : typeof p === 'string' ? p : ''
        ).filter(p => p !== '');
    }

    const authUser: AuthUser = {
      ...(backendUser as Omit<User, 'role'>), // Spread backendUser, type assertion for an intermediate state
      id: String(backendUser.id), 
      role: userRoleName, 
      permissions: userPermissions,
      // Ensure all other required fields from AuthUser have defaults if not present
      username: backendUser.username || '',
      email: backendUser.email || '',
      first_name: backendUser.first_name || '',
      last_name: backendUser.last_name || '',
      created_at: backendUser.created_at || new Date().toISOString(),
      updated_at: backendUser.updated_at || new Date().toISOString(),
    };

    // Store tokens upon successful 2FA login
    if (response.data.access) {
      storeTokens(response.data.access, response.data.refresh || '');
      // Also update localStorage user, though the Redux store is primary UI source after this
      localStorage.setItem('user', JSON.stringify(authUser)); 
    }
    
    return {
      token: response.data.access, // Main token for immediate use
      access: response.data.access,
      refresh: response.data.refresh,
      user: authUser,
      twoFactorRequired: false, // Explicitly false after successful 2FA
    };
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

  // --- Methods for 2FA Management (Settings Page) ---

  static async getTwoFactorStatus(): Promise<{ enabled: boolean; method?: string }> {
    try {
      const response = await axiosInstance.get('/settings/2fa-status');
      return response.data;
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
      throw error;
    }
  }

  static async setupTwoFactor(enabled: boolean, method?: 'app' | 'email'): Promise<{ qr_code?: string; message?: string }> {
    try {
      const payload: { enabled: boolean; method?: string } = { enabled };
      if (method) {
        payload.method = method;
      }
      const response = await axiosInstance.post('/settings/setup_2fa/', payload);
      return response.data;
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      throw error;
    }
  }

  static async verifyTwoFactorSetup(verification_code: string, remember_browser?: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const payload: { verification_code: string; remember_browser?: boolean } = { verification_code };
      if (remember_browser !== undefined) {
        payload.remember_browser = remember_browser;
      }
      // The backend endpoint is /settings/verify_2fa/
      const response = await axiosInstance.post('/settings/verify_2fa/', payload);
      return response.data;
    } catch (error) {
      console.error("Error verifying 2FA setup:", error);
      throw error;
    }
  }

  // New method to resend OTP during login 2FA challenge
  static async resendLoginOtp(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.post('/auth/login/2fa/resend-code', { userId });
      return { success: true, message: response.data.message || 'Login OTP has been resent.' };
    } catch (error: any) {
      console.error("Error resending login OTP:", error);
      const errorMessage = error.response?.data?.message || 'Failed to resend login OTP. Please try again later.';
      throw new Error(errorMessage);
    }
  }

  static async forgotPassword(email: string): Promise<void> {
    await axiosInstance.post('auth/forgot-password', { email });
  }
} 