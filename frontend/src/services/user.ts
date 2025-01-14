import axios from '../utils/axios';

export interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'user';
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
        const response = await axios.get('/api/users/');
        return response.data;
    },

    // Get current user
    getCurrentUser: async () => {
        const response = await axios.get('/api/users/me/');
        return response.data;
    },

    // Get users by department
    getUsersByDepartment: async (departmentId: string) => {
        const response = await axios.get(`/api/users/by_department/?department_id=${departmentId}`);
        return response.data;
    },

    // Create a user
    createUser: async (user: Omit<User, 'id' | 'date_joined' | 'last_login'>) => {
        const response = await axios.post('/api/users/', user);
        return response.data;
    },

    // Update a user
    updateUser: async (id: string, user: Partial<User>) => {
        const response = await axios.patch(`/api/users/${id}/`, user);
        return response.data;
    },

    // Delete a user
    deleteUser: async (id: string) => {
        await axios.delete(`/api/users/${id}/`);
    },

    // Reset user password
    resetPassword: async (id: string, password: string) => {
        const response = await axios.post(`/api/users/${id}/reset_password/`, {
            password
        });
        return response.data;
    },

    // Toggle user status
    toggleUserStatus: async (id: string) => {
        const response = await axios.post(`/api/users/${id}/toggle_status/`);
        return response.data;
    }
}; 