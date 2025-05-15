import axios from '../utils/axios';

// Define types that were previously imported or defined inline
export interface SecuritySettings {
  passwordExpiryDays: number;
  requireMfa: boolean;
  sessionTimeoutMinutes: number;
  loginAttemptsBeforeLockout: number;
  lockoutDurationMinutes: number;
}

export interface BackupSettings {
  automaticBackups: boolean;
  backupFrequencyDays: number;
  backupRetentionDays: number;
  backupLocation: string;
  includeAttachments: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  emailServer: string;
  emailPort: number;
  emailUsername: string;
  emailPassword: string;
  emailFromAddress: string;
  emailUseSsl: boolean;
  inAppNotifications: boolean;
}

export interface ApiSettings {
  apiEnabled: boolean;
  apiKey: string;
  rateLimitPerMinute: number;
  allowedOrigins: string;
}

// Define the missing type
export interface TwoFactorStatusResponse {
  enabled: boolean;
  method?: 'app' | 'email' | null;
}

export const SettingsService = {
  // Get security settings
  getSecuritySettings: async (): Promise<SecuritySettings> => {
    try {
      console.log('[SettingsService] Fetching security settings');
      const response = await axios.get('settings/security-settings/1/');
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error fetching security settings:', error);
      throw error;
    }
  },
  
  // Update security settings
  updateSecuritySettings: async (settings: Partial<SecuritySettings>): Promise<SecuritySettings> => {
    try {
      console.log('[SettingsService] Updating security settings');
      const response = await axios.patch('settings/security-settings/1/', settings);
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error updating security settings:', error);
      throw error;
    }
  },
  
  // Get backup settings
  getBackupSettings: async (): Promise<BackupSettings> => {
    try {
      console.log('[SettingsService] Fetching backup settings');
      const response = await axios.get('settings/backup-settings/1/');
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error fetching backup settings:', error);
      throw error;
    }
  },
  
  // Update backup settings
  updateBackupSettings: async (settings: Partial<BackupSettings>): Promise<BackupSettings> => {
    try {
      console.log('[SettingsService] Updating backup settings');
      const response = await axios.patch('settings/backup-settings/1/', settings);
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error updating backup settings:', error);
      throw error;
    }
  },
  
  // Get notification settings
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    try {
      console.log('[SettingsService] Fetching notification settings');
      const response = await axios.get('settings/notification-settings/1/');
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error fetching notification settings:', error);
      throw error;
    }
  },
  
  // Update notification settings
  updateNotificationSettings: async (settings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    try {
      console.log('[SettingsService] Updating notification settings');
      const response = await axios.patch('settings/notification-settings/1/', settings);
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error updating notification settings:', error);
      throw error;
    }
  },
  
  // Get API settings
  getApiSettings: async (): Promise<ApiSettings> => {
    try {
      console.log('[SettingsService] Fetching API settings');
      const response = await axios.get('settings/api-settings/1/');
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error fetching API settings:', error);
      throw error;
    }
  },
  
  // Update API settings
  updateApiSettings: async (settings: Partial<ApiSettings>): Promise<ApiSettings> => {
    try {
      console.log('[SettingsService] Updating API settings');
      const response = await axios.patch('settings/api-settings/1/', settings);
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error updating API settings:', error);
      throw error;
    }
  },
  
  // Test notification settings
  testEmailSettings: async (settings: Partial<NotificationSettings>): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('[SettingsService] Testing email settings');
      const response = await axios.post('settings/notification-settings/test-email/', settings);
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error testing email settings:', error);
      throw error;
    }
  },
  
  // Generate new API key
  generateApiKey: async (): Promise<{ apiKey: string }> => {
    try {
      console.log('[SettingsService] Generating new API key');
      const response = await axios.post('settings/api-settings/generate-key/');
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error generating API key:', error);
      throw error;
    }
  },

  updatePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      const response = await axios.patch('/profile/me/password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      
      // Don't refresh token or logout on successful password change
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error);
      
      throw error;
    }
  },

  // Get 2FA status
  get2FAStatus: async (): Promise<TwoFactorStatusResponse> => {
    try {
      const response = await axios.get('settings/2fa-status/');
      return response.data;
    } catch (error: any) {
      console.error('2FA status fetch error:', error);
      
      throw error;
    }
  },

  setup2FA: async (enabled: boolean, method: string = 'app') => {
    try {
      console.log(`Setting up 2FA with enabled=${enabled}, method=${method}`);
      
      // Ensure we're sending the exact structure expected by the DTO
      const payload = { enabled: enabled, method: method };
      console.log('2FA setup payload:', payload);
      
      const response = await axios.post('settings/setup_2fa/', payload);
      console.log('2FA setup response:', response.data);
      
      // Make sure we have a QR code if enabling with app method
      if (enabled && method === 'app' && !response.data.qr_code) {
        console.warn('2FA setup response missing QR code when enabling 2FA with app method');
      }

      return response.data;
    } catch (error: any) {
      console.error('2FA setup error:', error);
      
      throw error;
    }
  },

  verify2FA: async (verificationCode: string, rememberBrowser: boolean = false) => {
    try {
      if (!verificationCode || verificationCode.trim() === '') {
        throw new Error('Verification code is required');
      }
      
      console.log(`Verifying 2FA code: ${verificationCode.substring(0, 2)}***, rememberBrowser: ${rememberBrowser}`);
      const response = await axios.post('settings/verify_2fa/', {
        verification_code: verificationCode.trim(),
        remember_browser: rememberBrowser
      });
      console.log('2FA verification response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('2FA verification error:', error);
      
      throw error;
    }
  },

  send2FACode: async (email: string) => {
    try {
      console.log(`Requesting 2FA code via email for: ${email}`);
      const response = await axios.post('settings/send_2fa_code/', {
        email: email
      });
      console.log('Email 2FA code response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Email 2FA code request error:', error);
      
      throw error;
    }
  },

  downloadTasks: async (format: 'csv' | 'pdf') => {
    try {
      const response = await axios.get('settings/download-tasks/', {
        params: { format },
        responseType: 'blob',
        headers: {
          'Accept': format === 'csv' ? 'text/csv' : 'application/pdf',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      // Check if the response is valid
      if (response.data instanceof Blob) {
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },
}; 