import axios from '../utils/axios';
import { CONFIG } from '../utils/config';
// Remove the internal Role import if not needed elsewhere
// import { Role } from '@/pages/admin/rbac/types'; 
// Import the central User type
import { User } from '@/types/index'; 

/* Remove or comment out the internal User interface definition
export interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    roleId?: string; 
    password?: string; 
    department: {
        id: string;
        name: string;
    } | null;
    position: string;
    status: 'active' | 'inactive';
    date_joined: string;
    last_login: string | null;
}
*/

export const UserService = {
    // Get all users
    getUsers: async (): Promise<User[]> => { // Use imported User type
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
    getUserById: async (id: string): Promise<User> => { // Use imported User type
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
    getCurrentUser: async (): Promise<User> => { // Use imported User type
        try {
            const response = await axios.get('users/me/');
            return response.data;
        } catch (error: unknown) {
            console.error('[UserService] Error fetching current user:', error);
            throw error; // Re-throw the error
        }
    },

    // Get users by department
    getUsersByDepartment: async (departmentId: string): Promise<User[]> => { // Use imported User type
        try {
            const response = await axios.get(`users/by_department/?department_id=${departmentId}`);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error fetching users by department ${departmentId}:`, error);
            throw error; // Re-throw the error
        }
    },

    // Create a user - Use imported User type
    createUser: async (user: Omit<User, 'id' | 'date_joined' | 'last_login'>): Promise<User> => { 
        try {
            const response = await axios.post('users/', user);
            return response.data;
        } catch (error: unknown) {
            console.error('[UserService] Error creating user:', error);
            throw error; // Re-throw the error
        }
    },

    // Update a user - Use imported User type
    updateUser: async (id: string, user: Partial<User>): Promise<User> => { 
        try {
            const response = await axios.put(`users/${id}`, user);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error updating user ${id}:`, error);
            throw error; // Re-throw the error
        }
    },

    // Delete a user
    deleteUser: async (id: string): Promise<void> => { // Return void
        try {
            await axios.delete(`users/${id}`);
            // No return needed for successful delete
        } catch (error: unknown) {
            console.error(`[UserService] Error deleting user ${id}:`, error);
            throw error; // Re-throw the error
        }
    },

    // Reset user password
    resetPassword: async (id: string, password: string): Promise<{ newPassword?: string }> => { // Define return type if known
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
    toggleUserStatus: async (id: string): Promise<User> => { // Return updated User
        try {
            const response = await axios.post(`users/${id}/toggle-status`);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error toggling status for user ${id}:`, error);
            throw error; // Re-throw the error
        }
    },

    // Search users
    searchUsers: async (query: string): Promise<User[]> => { // Use imported User type
        try {
            const response = await axios.get(`users/search/?q=${query}`);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error searching users with query "${query}":`, error);
            throw error; // Re-throw the error
        }
    },

    // Initiate Password Reset
    initiatePasswordReset: async (email: string): Promise<{ message: string }> => {
        try {
            const response = await axios.post('users/initiate-password-reset', { email });
            return response.data;
        } catch (error: unknown) {
            console.error('[UserService] Error initiating password reset:', error);
            throw error;
        }
    },

    // Confirm Password Reset (using token)
    confirmPasswordReset: async (token: string, newPassword: string): Promise<{ message: string }> => {
        try {
            // Note: Backend endpoint is /auth/reset-password
            const response = await axios.post('auth/reset-password', { token, newPassword });
            return response.data;
        } catch (error: unknown) {
            console.error('[UserService] Error confirming password reset:', error);
            throw error;
        }
    },
};
