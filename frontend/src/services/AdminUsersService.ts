import axiosInstance from '../utils/axios';
import { User } from '../types/user'; // Assuming a User type exists

// Interface for paginated user response, adjust as needed
export interface PaginatedUsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export const AdminUsersService = {
  async getUsers(page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedUsersResponse> {
    const response = await axiosInstance.get('/admin/users', {
      params: { page, limit, search },
    });
    // Assuming the backend returns data in a structure like { data: [], total: 0, ... }
    // If it's just User[], adjust accordingly.
    if (Array.isArray(response.data)) {
        // If backend returns a simple array without pagination info but GET /admin/users supports it.
        // This is a fallback, ideally backend sends pagination data.
        return { data: response.data, total: response.data.length, page:1, limit: response.data.length }; 
    }
    return response.data; 
  },

  async getUserById(userId: string): Promise<User> {
    const response = await axiosInstance.get(`/admin/users/${userId}`); // Assuming such an endpoint exists for detail
    return response.data;
  },

  // Add other user management methods like updateUser, deleteUser etc. if they exist

  async resetUser2FA(targetUserId: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post(`/admin/users/${targetUserId}/reset-2fa`);
      return response.data;
    } catch (error: any) {
      console.error(`Error resetting 2FA for user ${targetUserId}:`, error);
      throw error.response?.data || new Error('Failed to reset 2FA for the user.');
    }
  },
}; 