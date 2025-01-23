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
}; 