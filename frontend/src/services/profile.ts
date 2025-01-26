import axios from '../utils/axios';

export const ProfileService = {
  getProfile: async () => {
    const response = await axios.get('/api/profile/me/');
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    // Remove avatar-related fields from the update
    const { avatar, avatar_url, ...dataToUpdate } = profileData;

    // Clean up the data before sending
    const cleanData = Object.fromEntries(
      Object.entries(dataToUpdate).map(([key, value]) => {
        // Handle URL fields
        if (['linkedin', 'github', 'twitter', 'website'].includes(key)) {
          return [key, value === '' ? null : value];
        }
        // Handle skills array
        if (key === 'skills' && !Array.isArray(value)) {
          return [key, []];
        }
        // Handle other fields
        return [key, value === '' ? null : value];
      })
    );

    const response = await axios.put('/api/profile/me/', cleanData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  updateAvatar: async (formData: FormData) => {
    const response = await axios.patch('/api/profile/me/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
}; 