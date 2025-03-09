import axios from '../utils/axios';
import { CONFIG } from '../utils/config';
import { AxiosError } from 'axios';
import { 
  SecuritySettings, 
  BackupSettings, 
  NotificationSettings, 
  ApiSettings, 
  MockSettingsService 
} from './mockSettingsService';

// Flag to determine if we should use mock data
// In production, this should be false
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

export const SettingsService = {
  // Get security settings
  getSecuritySettings: async () => {
    try {
      console.log('[SettingsService] Fetching security settings');
      const response = await axios.get('/api/settings/security-settings/1/');
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error fetching security settings:', error);
      
      // Check if the error is a 404
      if (error instanceof AxiosError && error.response && error.response.status === 404) {
        console.error('[SettingsService] Security settings endpoint not found. This endpoint may not be implemented in the backend.');
        
        // Use mock data in development
        if (USE_MOCK_DATA) {
          console.log('[SettingsService] Using mock security settings as fallback');
          return MockSettingsService.getSecuritySettings();
        }
      }
      
      // For other errors, use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[SettingsService] Using mock security settings as fallback due to error');
        return MockSettingsService.getSecuritySettings();
      }
      
      throw error;
    }
  },
  
  // Update security settings
  updateSecuritySettings: async (settings: Partial<SecuritySettings>) => {
    try {
      console.log('[SettingsService] Updating security settings');
      const response = await axios.patch('/api/settings/security-settings/1/', settings);
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error updating security settings:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[SettingsService] Using mock update security settings as fallback');
        return MockSettingsService.updateSecuritySettings(settings);
      }
      
      throw error;
    }
  },
  
  // Get backup settings
  getBackupSettings: async () => {
    try {
      console.log('[SettingsService] Fetching backup settings');
      const response = await axios.get('/api/settings/backup-settings/1/');
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error fetching backup settings:', error);
      
      // Check if the error is a 404
      if (error instanceof AxiosError && error.response && error.response.status === 404) {
        console.error('[SettingsService] Backup settings endpoint not found. This endpoint may not be implemented in the backend.');
        
        // Use mock data in development
        if (USE_MOCK_DATA) {
          console.log('[SettingsService] Using mock backup settings as fallback');
          return MockSettingsService.getBackupSettings();
        }
      }
      
      // For other errors, use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[SettingsService] Using mock backup settings as fallback due to error');
        return MockSettingsService.getBackupSettings();
      }
      
      throw error;
    }
  },
  
  // Update backup settings
  updateBackupSettings: async (settings: Partial<BackupSettings>) => {
    try {
      console.log('[SettingsService] Updating backup settings');
      const response = await axios.patch('/api/settings/backup-settings/1/', settings);
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error updating backup settings:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[SettingsService] Using mock update backup settings as fallback');
        return MockSettingsService.updateBackupSettings(settings);
      }
      
      throw error;
    }
  },
  
  // Get notification settings
  getNotificationSettings: async () => {
    try {
      console.log('[SettingsService] Fetching notification settings');
      const response = await axios.get('/api/settings/notification-settings/1/');
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error fetching notification settings:', error);
      
      // Check if the error is a 404
      if (error instanceof AxiosError && error.response && error.response.status === 404) {
        console.error('[SettingsService] Notification settings endpoint not found. This endpoint may not be implemented in the backend.');
        
        // Use mock data in development
        if (USE_MOCK_DATA) {
          console.log('[SettingsService] Using mock notification settings as fallback');
          return MockSettingsService.getNotificationSettings();
        }
      }
      
      // For other errors, use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[SettingsService] Using mock notification settings as fallback due to error');
        return MockSettingsService.getNotificationSettings();
      }
      
      throw error;
    }
  },
  
  // Update notification settings
  updateNotificationSettings: async (settings: Partial<NotificationSettings>) => {
    try {
      console.log('[SettingsService] Updating notification settings');
      const response = await axios.patch('/api/settings/notification-settings/1/', settings);
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error updating notification settings:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[SettingsService] Using mock update notification settings as fallback');
        return MockSettingsService.updateNotificationSettings(settings);
      }
      
      throw error;
    }
  },
  
  // Get API settings
  getApiSettings: async () => {
    try {
      console.log('[SettingsService] Fetching API settings');
      const response = await axios.get('/api/settings/api-settings/1/');
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error fetching API settings:', error);
      
      // Check if the error is a 404
      if (error instanceof AxiosError && error.response && error.response.status === 404) {
        console.error('[SettingsService] API settings endpoint not found. This endpoint may not be implemented in the backend.');
        
        // Use mock data in development
        if (USE_MOCK_DATA) {
          console.log('[SettingsService] Using mock API settings as fallback');
          return MockSettingsService.getApiSettings();
        }
      }
      
      // For other errors, use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[SettingsService] Using mock API settings as fallback due to error');
        return MockSettingsService.getApiSettings();
      }
      
      throw error;
    }
  },
  
  // Update API settings
  updateApiSettings: async (settings: Partial<ApiSettings>) => {
    try {
      console.log('[SettingsService] Updating API settings');
      const response = await axios.patch('/api/settings/api-settings/1/', settings);
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error updating API settings:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[SettingsService] Using mock update API settings as fallback');
        return MockSettingsService.updateApiSettings(settings);
      }
      
      throw error;
    }
  },
  
  // Test email settings
  testEmailSettings: async (settings: Partial<NotificationSettings>) => {
    try {
      console.log('[SettingsService] Testing email settings');
      const response = await axios.post('/api/settings/notification-settings/test-email/', settings);
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error testing email settings:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[SettingsService] Using mock test email as fallback');
        return MockSettingsService.testEmailSettings();
      }
      
      throw error;
    }
  },
  
  // Generate new API key
  generateApiKey: async () => {
    try {
      console.log('[SettingsService] Generating new API key');
      const response = await axios.post('/api/settings/api-settings/generate-key/');
      return response.data;
    } catch (error: unknown) {
      console.error('[SettingsService] Error generating API key:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[SettingsService] Using mock generate API key as fallback');
        return MockSettingsService.generateApiKey();
      }
      
      throw error;
    }
  },

  updatePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      const response = await axios.patch('/api/profile/me/password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      
      // Don't refresh token or logout on successful password change
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[SettingsService] Using mock password update as fallback');
        return { success: true, message: 'Password updated successfully (mock)' };
      }
      
      throw error;
    }
  },

  get2FAStatus: async () => {
    const response = await axios.get('/api/settings/2fa-status/');
    return response.data;
  },

  setup2FA: async (enabled: boolean) => {
    try {
      const response = await axios.post('/api/settings/setup_2fa/', {
        enabled,
      });
      return response.data;
    } catch (error: any) {
      console.error('2FA setup error:', error);
      throw error;
    }
  },

  verify2FA: async (verificationCode: string) => {
    try {
      if (!verificationCode || verificationCode.trim() === '') {
        throw new Error('Verification code is required');
      }
      
      const response = await axios.post('/api/settings/verify_2fa/', {
        verification_code: verificationCode.trim(),
      });
      return response.data;
    } catch (error: any) {
      console.error('2FA verification error:', error);
      throw error;
    }
  },

  downloadTasks: async (format: 'csv' | 'pdf') => {
    try {
      const response = await axios.get('/api/settings/download-tasks/', {
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