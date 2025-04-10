import axios from '../utils/axios';
import { CONFIG } from '../utils/config';
import { AxiosError } from 'axios';
import { MockUserService } from './mockUserService';

export interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'manager' | 'user';
    department: {
        id: string;
        name: string;
    } | null;
    position: string;
    status: 'active' | 'inactive';
    date_joined: string;
    last_login: string | null;
}

// Flag to determine if we should use mock data
// In production, this should be false
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

export const UserService = {
    // Get all users
    getUsers: async () => {
        try {
            console.log('[UserService] Fetching users from:', `${CONFIG.API_URL}/users/`);
            const response = await axios.get('/users/');
            return response.data;
        } catch (error: unknown) {
            console.error('[UserService] Error fetching users:', error);
            // Check if the error is a 404
            if (error instanceof AxiosError && error.response && error.response.status === 404) {
                console.error('[UserService] Endpoint not found. This endpoint may not be implemented in the backend.');
                
                // Use mock data in development
                if (USE_MOCK_DATA) {
                    console.log('[UserService] Using mock data as fallback');
                    return MockUserService.getUsers();
                }
                
                // Return an empty array instead of throwing
                return [];
            }
            
            // For other errors, use mock data in development
            if (USE_MOCK_DATA) {
                console.log('[UserService] Using mock data as fallback due to error');
                return MockUserService.getUsers();
            }
            
            throw error;
        }
    },

    // Get user by ID
    getUserById: async (id: string) => {
        try {
            console.log(`[UserService] Fetching user with ID: ${id}`);
            const response = await axios.get(`/users/${id}`);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error fetching user with ID ${id}:`, error);
            
            // Use mock data in development
            if (USE_MOCK_DATA) {
                console.log('[UserService] Using mock user as fallback');
                return MockUserService.getUserById(id);
            }
            
            throw error;
        }
    },

    // Get current user
    getCurrentUser: async () => {
        try {
            const response = await axios.get('/users/me/');
            return response.data;
        } catch (error: unknown) {
            console.error('[UserService] Error fetching current user:', error);
            if (error instanceof AxiosError && error.response && error.response.status === 404) {
                console.error('[UserService] Current user endpoint not found.');
                
                // Use mock data in development
                if (USE_MOCK_DATA) {
                    console.log('[UserService] Using mock current user as fallback');
                    return MockUserService.getCurrentUser();
                }
                
                return null;
            }
            
            // For other errors, use mock data in development
            if (USE_MOCK_DATA) {
                console.log('[UserService] Using mock current user as fallback due to error');
                return MockUserService.getCurrentUser();
            }
            
            throw error;
        }
    },

    // Get users by department
    getUsersByDepartment: async (departmentId: string) => {
        try {
            const response = await axios.get(`/users/by_department/?department_id=${departmentId}`);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error fetching users by department ${departmentId}:`, error);
            if (error instanceof AxiosError && error.response && error.response.status === 404) {
                console.error('[UserService] Department users endpoint not found.');
                
                // Use mock data in development
                if (USE_MOCK_DATA) {
                    console.log('[UserService] Using mock department users as fallback');
                    return MockUserService.getUsersByDepartment(departmentId);
                }
                
                return [];
            }
            
            // For other errors, use mock data in development
            if (USE_MOCK_DATA) {
                console.log('[UserService] Using mock department users as fallback due to error');
                return MockUserService.getUsersByDepartment(departmentId);
            }
            
            throw error;
        }
    },

    // Create a user
    createUser: async (user: Omit<User, 'id' | 'date_joined' | 'last_login'>) => {
        try {
            const response = await axios.post('/users/', user);
            return response.data;
        } catch (error: unknown) {
            console.error('[UserService] Error creating user:', error);
            
            // Use mock data in development
            if (USE_MOCK_DATA) {
                console.log('[UserService] Using mock create user as fallback');
                return MockUserService.createUser(user);
            }
            
            throw error;
        }
    },

    // Update a user
    updateUser: async (id: string, user: Partial<User>) => {
        try {
            const response = await axios.put(`/users/${id}`, user);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error updating user ${id}:`, error);
            
            // Use mock data in development
            if (USE_MOCK_DATA) {
                console.log('[UserService] Using mock update user as fallback');
                return MockUserService.updateUser(id, user);
            }
            
            throw error;
        }
    },

    // Delete a user
    deleteUser: async (id: string) => {
        try {
            await axios.delete(`/users/${id}`);
        } catch (error: unknown) {
            console.error(`[UserService] Error deleting user ${id}:`, error);
            
            // Use mock data in development
            if (USE_MOCK_DATA) {
                console.log('[UserService] Using mock delete user as fallback');
                await MockUserService.deleteUser(id);
                return;
            }
            
            throw error;
        }
    },

    // Reset user password
    resetPassword: async (id: string, password: string) => {
        try {
            const response = await axios.post(`/users/${id}/reset-password`, {
                password
            });
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error resetting password for user ${id}:`, error);
            
            // Use mock data in development
            if (USE_MOCK_DATA) {
                console.log('[UserService] Using mock reset password as fallback');
                return MockUserService.resetPassword(id, password);
            }
            
            throw error;
        }
    },

    // Toggle user status
    toggleUserStatus: async (id: string) => {
        try {
            const response = await axios.post(`/users/${id}/toggle-status`);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error toggling status for user ${id}:`, error);
            
            // Use mock data in development
            if (USE_MOCK_DATA) {
                console.log('[UserService] Using mock toggle status as fallback');
                return MockUserService.toggleUserStatus(id);
            }
            
            throw error;
        }
    },

    // Search users
    searchUsers: async (query: string) => {
        try {
            const response = await axios.get(`/users/search/?q=${query}`);
            return response.data;
        } catch (error: unknown) {
            console.error(`[UserService] Error searching users with query "${query}":`, error);
            if (error instanceof AxiosError && error.response && error.response.status === 404) {
                console.error('[UserService] User search endpoint not found.');
                
                // Use mock data in development
                if (USE_MOCK_DATA) {
                    console.log('[UserService] Using mock user search as fallback');
                    return MockUserService.searchUsers(query);
                }
                
                return [];
            }
            
            // For other errors, use mock data in development
            if (USE_MOCK_DATA) {
                console.log('[UserService] Using mock user search as fallback due to error');
                return MockUserService.searchUsers(query);
            }
            
            throw error;
        }
    }
};
