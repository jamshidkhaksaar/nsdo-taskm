import { apiClient } from './api';
import { Department, Task } from '@/types/index';
import { User } from '../types/user';

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
    getDepartments: async (): Promise<Department[]> => {
        try {
            const response = await apiClient.get<Department[]>('/departments');
            return response;
        } catch (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }
    },

    // Get a single department
    getDepartment: async (id: string): Promise<Department> => {
        try {
            const response = await apiClient.get<Department>(`/departments/${id}`);
            if (!response) {
                throw new Error(`Department with ID ${id} not found`);
            }
            return response;
        } catch (error) {
            console.error(`Error fetching department ${id}:`, error);
            throw error;
        }
    },

    // Get department members
    getDepartmentMembers: async (id: string): Promise<User[]> => {
        try {
            const response = await apiClient.get<User[]>(`/departments/${id}/members`);
            return response;
        } catch (error) {
            console.error(`Error fetching members for department ${id}:`, error);
            throw error;
        }
    },

    // Create a department
    createDepartment: async (departmentData: Omit<Department, 'id'>): Promise<Department> => {
        try {
            const response = await apiClient.post<Department>('/departments', departmentData);
            return response;
        } catch (error) {
            console.error('Error creating department:', error);
            throw error;
        }
    },

    // Update a department
    updateDepartment: async (id: string, departmentData: Partial<Department>): Promise<Department> => {
        try {
            console.log(`Updating department ${id} with data:`, departmentData);
            // Use the correct admin endpoint path
            const response = await apiClient.put<Department>(`/admin/departments/${id}`, departmentData);
            console.log('Department updated:', response);
            return response;
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
            return response;
        } catch (error) {
            console.error('Error fetching department statistics:', error);
            throw error;
        }
    },

    // Get department tasks
    getDepartmentTasks: async (id: string): Promise<Task[]> => {
        try {
            const response = await apiClient.get<Task[]>(`/departments/${id}/tasks`);
            return response;
        } catch (error) {
            console.error(`Error fetching tasks for department ${id}:`, error);
            throw error;
        }
    },

    // Get top performers in a department
    getDepartmentPerformers: async (id: string): Promise<DepartmentPerformer[]> => {
        try {
            const response = await apiClient.get<DepartmentPerformer[]>(`/departments/${id}/performers`);
            return response;
        } catch (error) {
            console.error(`Error fetching performers for department ${id}:`, error);
            throw error;
        }
    },

    // START: Add Member Management Functions
    addMemberToDepartment: async (departmentId: string, userId: string): Promise<Department> => { // Assuming backend returns updated department
        try {
            // Backend route was /departments/:id/members/:userId/
            const response = await apiClient.post<Department>(`/departments/${departmentId}/members/${userId}/`, {}); // POST request with empty body
            return response;
        } catch (error) {
            console.error(`Error adding member ${userId} to department ${departmentId}:`, error);
            throw error;
        }
    },

    removeMemberFromDepartment: async (departmentId: string, userId: string): Promise<void> => {
        try {
             // Backend route was /departments/:id/members/:userId/
            await apiClient.delete<void>(`/departments/${departmentId}/members/${userId}/`);
        } catch (error) {
            console.error(`Error removing member ${userId} from department ${departmentId}:`, error);
            throw error;
        }
    }
    // END: Add Member Management Functions
};

export type { Department }; 