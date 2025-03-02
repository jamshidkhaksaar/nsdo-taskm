// Mock settings service to provide fallback data when the API is unavailable

// Security settings interface
export interface SecuritySettings {
  two_factor_enabled: boolean;
  password_expiry_days: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  password_complexity_required: boolean;
  session_timeout_minutes: number;
}

// Backup settings interface
export interface BackupSettings {
  auto_backup_enabled: boolean;
  backup_frequency_hours: number;
  backup_retention_days: number;
  backup_location: string;
}

// Notification settings interface
export interface NotificationSettings {
  email_notifications_enabled: boolean;
  smtp_server: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_use_tls: boolean;
}

// API settings interface
export interface ApiSettings {
  api_enabled: boolean;
  api_key: string;
  weather_api_enabled: boolean;
  weather_api_key: string;
  api_rate_limit: number;
  api_allowed_ips: string;
}

// Mock security settings
const mockSecuritySettings: SecuritySettings = {
  two_factor_enabled: true,
  password_expiry_days: 90,
  max_login_attempts: 5,
  lockout_duration_minutes: 30,
  password_complexity_required: true,
  session_timeout_minutes: 60
};

// Mock backup settings
const mockBackupSettings: BackupSettings = {
  auto_backup_enabled: true,
  backup_frequency_hours: 24,
  backup_retention_days: 30,
  backup_location: '/var/backups'
};

// Mock notification settings
const mockNotificationSettings: NotificationSettings = {
  email_notifications_enabled: true,
  smtp_server: 'smtp.example.com',
  smtp_port: 587,
  smtp_username: 'notifications@example.com',
  smtp_password: '',
  smtp_use_tls: true
};

// Mock API settings
const mockApiSettings: ApiSettings = {
  api_enabled: true,
  api_key: 'mock-api-key-12345',
  weather_api_enabled: true,
  weather_api_key: '',
  api_rate_limit: 100,
  api_allowed_ips: '192.168.1.1,10.0.0.1'
};

export const MockSettingsService = {
  // Get security settings
  getSecuritySettings: async () => {
    console.log('[MockSettingsService] Returning mock security settings');
    return { ...mockSecuritySettings };
  },
  
  // Update security settings
  updateSecuritySettings: async (settings: Partial<SecuritySettings>) => {
    console.log('[MockSettingsService] Updating mock security settings:', settings);
    Object.assign(mockSecuritySettings, settings);
    return { ...mockSecuritySettings, updated_at: new Date().toISOString() };
  },
  
  // Get backup settings
  getBackupSettings: async () => {
    console.log('[MockSettingsService] Returning mock backup settings');
    return { ...mockBackupSettings };
  },
  
  // Update backup settings
  updateBackupSettings: async (settings: Partial<BackupSettings>) => {
    console.log('[MockSettingsService] Updating mock backup settings:', settings);
    Object.assign(mockBackupSettings, settings);
    return { ...mockBackupSettings, updated_at: new Date().toISOString() };
  },
  
  // Get notification settings
  getNotificationSettings: async () => {
    console.log('[MockSettingsService] Returning mock notification settings');
    return { ...mockNotificationSettings };
  },
  
  // Update notification settings
  updateNotificationSettings: async (settings: Partial<NotificationSettings>) => {
    console.log('[MockSettingsService] Updating mock notification settings:', settings);
    Object.assign(mockNotificationSettings, settings);
    return { ...mockNotificationSettings, updated_at: new Date().toISOString() };
  },
  
  // Get API settings
  getApiSettings: async () => {
    console.log('[MockSettingsService] Returning mock API settings');
    return { ...mockApiSettings };
  },
  
  // Update API settings
  updateApiSettings: async (settings: Partial<ApiSettings>) => {
    console.log('[MockSettingsService] Updating mock API settings:', settings);
    Object.assign(mockApiSettings, settings);
    return { ...mockApiSettings, updated_at: new Date().toISOString() };
  },
  
  // Test email settings
  testEmailSettings: async () => {
    console.log('[MockSettingsService] Testing mock email settings');
    return { success: true, message: 'Test email sent successfully' };
  },
  
  // Generate new API key
  generateApiKey: async () => {
    console.log('[MockSettingsService] Generating new mock API key');
    const newApiKey = `mock-api-key-${Math.random().toString(36).substring(2, 10)}`;
    mockApiSettings.api_key = newApiKey;
    return { api_key: newApiKey };
  }
}; 