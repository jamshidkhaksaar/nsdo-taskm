import axios from '../utils/axios';
import { refreshAccessToken } from '../utils/authUtils';

interface ProfileData {
  avatar?: File;
  avatar_url?: string | null;
  bio?: string;
  phone_number?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
  skills?: string[];
  theme_preference?: string;
}

const formatSocialMediaUrl = (platform: string, value: string): string | null => {
  if (!value || value.trim() === '') {
    return null;
  }

  // Remove any existing protocol, www, and trailing slashes
  let username = value.replace(/^https?:\/\//, '')
                     .replace(/^www\./, '')
                     .replace(/^.*?([^/]+)$/, '$1')
                     .replace(/^@/, '');

  switch (platform) {
    case 'linkedin':
      return `https://linkedin.com/in/${username}`;
    case 'github':
      return `https://github.com/${username}`;
    case 'twitter':
      return `https://twitter.com/${username}`;
    case 'website':
      // For website, keep the full domain but ensure https://
      return `https://${value.replace(/^https?:\/\//, '')}`;
    default:
      return null;
  }
};

export const ProfileService = {
  getProfile: async () => {
    try {
      const response = await axios.get('profile/me/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      
      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        console.log('Attempting to refresh token before fetching profile again');
        const newToken = await refreshAccessToken();
        
        // If token refresh successful, retry the request
        if (newToken) {
          try {
            console.log('Token refreshed, retrying profile fetch');
            const retryResponse = await axios.get('profile/me/');
            return retryResponse.data;
          } catch (retryError: any) {
            console.error('Error fetching profile after token refresh:', retryError);
            throw retryError;
          }
        }
      }
      
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  updateProfile: async (profileData: ProfileData) => {
    try {
      // Remove avatar-related fields from the update
      const { avatar, avatar_url, ...dataToUpdate } = profileData;

      // Clean up the data before sending
      const cleanData = Object.fromEntries(
        Object.entries(dataToUpdate).map(([key, value]: [string, any]) => {
          // Handle URL fields
          if (['linkedin', 'github', 'twitter', 'website'].includes(key)) {
            return [key, value ? formatSocialMediaUrl(key, value) : null];
          }
          // Handle skills array
          if (key === 'skills') {
            return [key, Array.isArray(value) ? value : []];
          }
          // Handle other string fields
          if (typeof value === 'string') {
            return [key, value.trim() === '' ? null : value.trim()];
          }
          // Return other values as is
          return [key, value];
        })
      );

      console.log('Cleaned data to send:', cleanData); // Debug log

      const response = await axios.put('profile/me/', cleanData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        console.log('Attempting to refresh token before updating profile again');
        const newToken = await refreshAccessToken();
        
        // If token refresh successful, retry the request
        if (newToken) {
          try {
            // Remove avatar-related fields from the update
            const { avatar, avatar_url, ...dataToUpdate } = profileData;
            const cleanData = Object.fromEntries(
              Object.entries(dataToUpdate).map(([key, value]: [string, any]) => {
                if (['linkedin', 'github', 'twitter', 'website'].includes(key)) {
                  return [key, value ? formatSocialMediaUrl(key, value) : null];
                }
                if (key === 'skills') {
                  return [key, Array.isArray(value) ? value : []];
                }
                if (typeof value === 'string') {
                  return [key, value.trim() === '' ? null : value.trim()];
                }
                return [key, value];
              })
            );
            
            console.log('Token refreshed, retrying profile update');
            const retryResponse = await axios.put('profile/me/', cleanData, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
            return retryResponse.data;
          } catch (retryError: any) {
            console.error('Error updating profile after token refresh:', retryError);
            throw retryError;
          }
        }
      }
      
      console.error('Error updating profile:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  updateAvatar: async (formData: FormData) => {
    try {
      const response = await axios.patch('profile/me/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        console.log('Attempting to refresh token before updating avatar again');
        const newToken = await refreshAccessToken();
        
        // If token refresh successful, retry the request
        if (newToken) {
          try {
            console.log('Token refreshed, retrying avatar update');
            const retryResponse = await axios.patch('profile/me/', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            return retryResponse.data;
          } catch (retryError: any) {
            console.error('Error updating avatar after token refresh:', retryError);
            throw retryError;
          }
        }
      }
      
      console.error('Error updating avatar:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },
}; 