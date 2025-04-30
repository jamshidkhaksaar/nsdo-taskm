import axios from '../utils/axios';
import { CONFIG } from '../utils/config';

export interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'user' | 'leadership';
    department: {
        id: string;
        name: string;
    } | null;
    position: string;
    status: 'active' | 'inactive';
    date_joined: string;
    last_login: string | null;
}

export const UserService = {
    // Get all users
    getUsers: async () => {
        try {
            console.log('[UserService] Fetching users from:', `${CONFIG.API_URL}/users/`);
            const response = await axios.get('users/');
            return response.data;
        } catch (error: unknown) {
            console.error('[UserService] Error fetching users:', error);
            throw error; // Re-throw the error
        }
    },

    // Get user by ID
    getUserById: async (id: string) => {
        try {
            console.log(`[UserService] Fetching user with ID: ${id}`);
            const response = await axios.get(`users/${id}`);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error fetching user with ID ${id}:`, error);
            throw error; // Re-throw the error
        }
    },

    // Get current user
    getCurrentUser: async () => {
        try {
            const response = await axios.get('users/me/');
            return response.data;
        } catch (error: unknown) {
            console.error('[UserService] Error fetching current user:', error);
            throw error; // Re-throw the error
        }
    },

    // Get users by department
    getUsersByDepartment: async (departmentId: string) => {
        try {
            const response = await axios.get(`users/by_department/?department_id=${departmentId}`);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error fetching users by department ${departmentId}:`, error);
            throw error; // Re-throw the error
        }
    },

    // Create a user
    createUser: async (user: Omit<User, 'id' | 'date_joined' | 'last_login'>) => {
        try {
            const response = await axios.post('users/', user);
            return response.data;
        } catch (error: unknown) {
            console.error('[UserService] Error creating user:', error);
            throw error; // Re-throw the error
        }
    },

    // Update a user
    updateUser: async (id: string, user: Partial<User>) => {
        try {
            const response = await axios.put(`users/${id}`, user);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error updating user ${id}:`, error);
            throw error; // Re-throw the error
        }
    },

    // Delete a user
    deleteUser: async (id: string) => {
        try {
            await axios.delete(`users/${id}`);
            // No return needed for successful delete
        } catch (error: unknown) {
            console.error(`[UserService] Error deleting user ${id}:`, error);
            throw error; // Re-throw the error
        }
    },

    // Reset user password
    resetPassword: async (id: string, password: string) => {
        try {
            const response = await axios.post(`users/${id}/reset-password`, {
                password
            });
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error resetting password for user ${id}:`, error);
            throw error; // Re-throw the error
        }
    },

    // Toggle user status
    toggleUserStatus: async (id: string) => {
        try {
            const response = await axios.post(`users/${id}/toggle-status`);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error toggling status for user ${id}:`, error);
            throw error; // Re-throw the error
        }
    },

    // Search users
    searchUsers: async (query: string) => {
        try {
            const response = await axios.get(`users/search/?q=${query}`);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error searching users with query "${query}":`, error);
            throw error; // Re-throw the error
        }
    },
};
