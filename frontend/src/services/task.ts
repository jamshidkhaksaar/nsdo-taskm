import axios from '../utils/axios';
import { Task, CreateTask } from '../types/task';
import { User } from '../types/user';

export const TaskService = {
    // Get all tasks
    getTasks: async () => {
        const response = await axios.get<Task[]>('/api/tasks/');
        return response.data;
    },

    // Get tasks by department
    getTasksByDepartment: async (departmentId: string | number): Promise<Task[]> => {
        try {
            const response = await axios.get<Task[]>(`/api/tasks/?department=${departmentId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching department tasks:', error);
            throw error;
        }
    },

    // Get tasks assigned to user
    getAssignedTasks: async (userId: string) => {
        const response = await axios.get<Task[]>(`/api/tasks/?assigned_to=${userId}`);
        return response.data;
    },

    // Get tasks created by user
    getCreatedTasks: async (userId: string) => {
        const response = await axios.get<Task[]>(`/api/tasks/?created_by=${userId}`);
        return response.data;
    },

    // Create a new task
    createTask: async (task: CreateTask): Promise<Task> => {
        const payload = {
            ...task,
            assigned_to: task.assigned_to || [],
            department: task.department || '',
            created_by: task.created_by?.toString() || null
        };
        const response = await axios.post<Task>('/api/tasks/', payload);
        return response.data;
    },

    // Update a task
    updateTask: async (taskId: string, task: Partial<Task>) => {
        const response = await axios.patch<Task>(`/api/tasks/${taskId}/`, task);
        return response.data;
    },

    // Delete a task
    deleteTask: async (taskId: string) => {
        await axios.delete(`/api/tasks/${taskId}/`);
    },

    // Assign a task to a user
    assignTask: async (taskId: string, userId: string) => {
        const response = await axios.post<Task>(`/api/tasks/${taskId}/assign/`, {
            user_id: userId
        });
        return response.data;
    },

    // Change task status
    changeTaskStatus: async (taskId: string, status: Task['status']) => {
        const response = await axios.post<Task>(`/api/tasks/${taskId}/change_status/`, {
            status
        });
        return response.data;
    },

    // Get all users
    getUsers: async () => {
        const response = await axios.get<User[]>('/api/users/');
        return response.data;
    }
};
