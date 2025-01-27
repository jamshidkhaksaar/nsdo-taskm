import axios from '../utils/axios';

export const SettingsService = {
  getAPISettings: async () => {
    const response = await axios.get('/api/api-settings/1/');
    return response.data;
  },

  updateAPISettings: async (settings: any) => {
    const response = await axios.patch('/api/api-settings/1/', settings);
    return response.data;
  },

  updatePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const response = await axios.post('/api/settings/update_password/', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  setup2FA: async (enabled: boolean) => {
    const response = await axios.post('/api/settings/setup_2fa/', {
      enabled,
    });
    return response.data;
  },

  verify2FA: async (verificationCode: string) => {
    const response = await axios.post('/api/settings/verify_2fa/', {
      verification_code: verificationCode,
    });
    return response.data;
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