import axios from '../utils/axios';

export interface Department {
    id: string;
    name: string;
    description: string;
    head: {
        id: string;
        username: string;
        first_name: string;
        last_name: string;
    } | null;
    created_at: string;
    updated_at: string;
    members_count: number;
    active_projects: number;
    completion_rate: number;
}

export interface DepartmentPerformer {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    completed_tasks: number;
    total_tasks: number;
    completion_rate: number;
}

export const DepartmentService = {
    // Get all departments
    getDepartments: async () => {
        try {
            const response = await axios.get('/api/departments/');
            return response.data;
        } catch (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }
    },

    // Get a single department
    getDepartment: async (id: string) => {
        try {
            const response = await axios.get(`/api/departments/${id}/`);
            if (!response.data) {
                throw new Error(`Department with ID ${id} not found`);
            }
            return response.data;
        } catch (error) {
            console.error(`Error fetching department ${id}:`, error);
            throw error;
        }
    },

    // Get department members
    getDepartmentMembers: async (id: string) => {
        try {
            const response = await axios.get(`/api/departments/${id}/members/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching members for department ${id}:`, error);
            throw error;
        }
    },

    // Create a department
    createDepartment: async (department: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const response = await axios.post('/api/departments/', department);
            return response.data;
        } catch (error) {
            console.error('Error creating department:', error);
            throw error;
        }
    },

    // Update a department
    updateDepartment: async (id: string, department: Partial<Department>) => {
        try {
            const response = await axios.put(`/api/departments/${id}/`, department);
            return response.data;
        } catch (error) {
            console.error(`Error updating department ${id}:`, error);
            throw error;
        }
    },

    // Delete a department
    deleteDepartment: async (id: string) => {
        try {
            await axios.delete(`/api/departments/${id}/`);
        } catch (error) {
            console.error(`Error deleting department ${id}:`, error);
            throw error;
        }
    },

    // Get department statistics
    getDepartmentStats: async () => {
        try {
            const response = await axios.get('/api/department-stats/');
            return response.data;
        } catch (error) {
            console.error('Error fetching department statistics:', error);
            throw error;
        }
    },

    // Get department tasks
    getDepartmentTasks: async (id: string) => {
        try {
            const response = await axios.get(`/api/departments/${id}/tasks/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching tasks for department ${id}:`, error);
            throw error;
        }
    },

    // Get top performers in a department
    getDepartmentPerformers: async (id: string) => {
        try {
            const response = await axios.get(`/api/departments/${id}/performers/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching performers for department ${id}:`, error);
            throw error;
        }
    }
}; 