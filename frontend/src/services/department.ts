import apiClient from '../utils/axios';
import { Department, Task, DepartmentPerformer, CreateDepartmentPayload } from '@/types/index';
import { User } from '../types/user';

export const DepartmentService = {
    // Get all departments
    getDepartments: async (): Promise<Department[]> => {
        try {
            const response = await apiClient.get<Department[]>('/departments');
            return response.data;
        } catch (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }
    },

    // Get a single department
    getDepartment: async (id: string): Promise<Department> => {
        try {
            const response = await apiClient.get<Department>(`/departments/${id}`);
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
    getDepartmentMembers: async (id: string): Promise<User[]> => {
        try {
            const response = await apiClient.get<User[]>(`/departments/${id}/members`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching members for department ${id}:`, error);
            throw error;
        }
    },

    // Create a department
    createDepartment: async (departmentData: CreateDepartmentPayload): Promise<Department> => {
        try {
            const response = await apiClient.post<Department>('/departments', departmentData);
            return response.data;
        } catch (error) {
            console.error('Error creating department:', error);
            throw error;
        }
    },

    // Update a department
    updateDepartment: async (id: string, departmentData: Partial<Department>): Promise<Department> => {
        try {
            console.log(`Updating department ${id} with data:`, departmentData);
            const response = await apiClient.put<Department>(`/admin/departments/${id}`, departmentData);
            console.log('Department updated:', response.data);
            return response.data;
        } catch (error) {
            console.error(`Error updating department ${id}:`, error);
            throw error;
        }
    },

    // Delete a department
    deleteDepartment: async (id: string): Promise<void> => {
        try {
            await apiClient.delete<void>(`/departments/${id}`);
        } catch (error) {
            console.error(`Error deleting department ${id}:`, error);
            throw error;
        }
    },

    // Get department statistics
    getDepartmentStats: async (): Promise<any> => {
        try {
            const response = await apiClient.get<any>('/department-stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching department statistics:', error);
            throw error;
        }
    },

    // Get department tasks
    getDepartmentTasks: async (id: string): Promise<Task[]> => {
        try {
            const response = await apiClient.get<Task[]>(`/departments/${id}/tasks`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching tasks for department ${id}:`, error);
            throw error;
        }
    },

    // Get top performers in a department
    getDepartmentPerformers: async (id: string): Promise<DepartmentPerformer[]> => {
        try {
            const response = await apiClient.get<DepartmentPerformer[]>(`/departments/${id}/performers`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching performers for department ${id}:`, error);
            throw error;
        }
    },

    // Member Management Functions
    addMemberToDepartment: async (departmentId: string, userId: string): Promise<Department> => {
        try {
            const response = await apiClient.post<Department>(`/departments/${departmentId}/members/${userId}`);
            return response.data;
        } catch (error) {
            console.error(`Error adding member to department ${departmentId}:`, error);
            throw error;
        }
    },

    removeMemberFromDepartment: async (departmentId: string, userId: string): Promise<Department> => {
        try {
            const response = await apiClient.delete<Department>(`/departments/${departmentId}/members/${userId}`);
            return response.data;
        } catch (error) {
            console.error(`Error removing member from department ${departmentId}:`, error);
            throw error;
        }
    },
};


