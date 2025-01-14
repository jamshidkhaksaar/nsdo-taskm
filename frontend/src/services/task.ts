import axios from '../utils/axios';
import { Task } from '../types/task';

export const TaskService = {
    // Get all tasks
    getTasks: async () => {
        const response = await axios.get<Task[]>('/api/tasks/');
        return response.data;
    },

    // Get tasks by department
    getTasksByDepartment: async (departmentId: number) => {
        const response = await axios.get<Task[]>(`/api/tasks/?department=${departmentId}`);
        return response.data;
    },

    // Get tasks assigned to user
    getAssignedTasks: async (userId: number) => {
        const response = await axios.get<Task[]>(`/api/tasks/?assigned_to=${userId}`);
        return response.data;
    },

    // Get tasks created by user
    getCreatedTasks: async (userId: number) => {
        const response = await axios.get<Task[]>(`/api/tasks/?created_by=${userId}`);
        return response.data;
    },

    // Create a new task
    createTask: async (task: Omit<Task, 'id' | 'created_at' | 'created_by'>) => {
        const response = await axios.post<Task>('/api/tasks/', task);
        return response.data;
    },

    // Update a task
    updateTask: async (taskId: number, task: Partial<Task>) => {
        const response = await axios.patch<Task>(`/api/tasks/${taskId}/`, task);
        return response.data;
    },

    // Delete a task
    deleteTask: async (taskId: number) => {
        await axios.delete(`/api/tasks/${taskId}/`);
    },

    // Assign a task to a user
    assignTask: async (taskId: number, userId: number) => {
        const response = await axios.post<Task>(`/api/tasks/${taskId}/assign/`, {
            user_id: userId
        });
        return response.data;
    },

    // Change task status
    changeTaskStatus: async (taskId: number, status: Task['status']) => {
        const response = await axios.post<Task>(`/api/tasks/${taskId}/change_status/`, {
            status
        });
        return response.data;
    }
}; 