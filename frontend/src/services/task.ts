import axios from '../utils/axios';
import { Task } from '../types/task';

export const TaskService = {
    // Get all tasks
    getTasks: async () => {
        const response = await axios.get('/api/tasks/');
        return response.data;
    },

    // Get tasks by department
    getTasksByDepartment: async (departmentId: string) => {
        const response = await axios.get(`/api/tasks/?department=${departmentId}`);
        return response.data;
    },

    // Get tasks assigned to user
    getAssignedTasks: async (userId: string) => {
        const response = await axios.get(`/api/tasks/?assigned_to=${userId}`);
        return response.data;
    },

    // Get tasks created by user
    getCreatedTasks: async (userId: string) => {
        const response = await axios.get(`/api/tasks/?created_by=${userId}`);
        return response.data;
    },

    // Create a new task
    createTask: async (task: Omit<Task, 'id' | 'created_at' | 'created_by'>) => {
        const response = await axios.post('/api/tasks/', task);
        return response.data;
    },

    // Update a task
    updateTask: async (taskId: string, task: Partial<Task>) => {
        const response = await axios.patch(`/api/tasks/${taskId}/`, task);
        return response.data;
    },

    // Delete a task
    deleteTask: async (taskId: string) => {
        await axios.delete(`/api/tasks/${taskId}/`);
    },

    // Assign a task to a user
    assignTask: async (taskId: string, userId: string) => {
        const response = await axios.post(`/api/tasks/${taskId}/assign/`, {
            user_id: userId
        });
        return response.data;
    },

    // Change task status
    changeTaskStatus: async (taskId: string, status: Task['status']) => {
        const response = await axios.post(`/api/tasks/${taskId}/change_status/`, {
            status
        });
        return response.data;
    }
}; 