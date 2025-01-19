import axios from '../utils/axios';
import { Task, CreateTask, TaskPriority } from '../types/task';
import { User } from '../types/user';
import { AxiosError } from 'axios';

export const TaskService = {
    // Get all tasks
    getTasks: async () => {
        try {
            const response = await axios.get<Task[]>('/api/tasks/');
            console.log('Tasks fetched:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
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
        try {
            const payload = {
                ...task,
                priority: task.priority?.toLowerCase(),
                assigned_to: task.assigned_to || [],
                department: task.department || '',
                created_by: task.created_by?.toString() || null
            };
            console.log('Creating task with payload:', payload);

            const response = await axios.post<Task>('/api/tasks/', payload);
            console.log('Create task response:', response.data);

            const createdTask: Task = {
                ...response.data,
                priority: response.data.priority?.toLowerCase() as TaskPriority || 'medium',
                status: response.data.status?.toLowerCase() as Task['status'] || 'todo'
            };

            return createdTask;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    // Update a task
    updateTask: async (taskId: string, updates: Partial<Task>) => {
        try {
            // Format the payload properly
            const payload = {
                ...updates,
                priority: updates.priority?.toLowerCase(),
                // Ensure status is properly formatted
                status: updates.status?.toLowerCase().replace(/\s+/g, '_'),
                updated_at: new Date().toISOString()
            };
            console.log('Sending update payload:', payload);

            const response = await axios.patch<Task>(`/api/tasks/${taskId}/`, payload);
            console.log('Task update response:', response.data);
            
            if (!response.data) {
                throw new Error('No data received from server');
            }

            // Ensure all required fields are present and properly formatted
            const updatedTask: Task = {
                ...response.data,
                priority: response.data.priority?.toLowerCase() as TaskPriority || 'medium',
                status: response.data.status?.toLowerCase() as Task['status'] || 'todo',
                id: response.data.id,
                title: response.data.title,
                description: response.data.description || '',
                due_date: response.data.due_date,
                is_private: response.data.is_private,
                department: response.data.department,
                assigned_to: response.data.assigned_to || [],
                created_by: response.data.created_by,
                updated_at: response.data.updated_at
            };

            console.log('Formatted updated task:', updatedTask);
            return updatedTask;
        } catch (error) {
            if ((error as any).response?.status === 401) {
                throw new Error('Session expired. Please login again.');
            }
            console.error('Task update error:', error);
            console.error('Error details:', {
                message: (error as AxiosError)?.message || 'Unknown error',
                response: (error as AxiosError)?.response?.data
            });
            throw error;
        }
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
    getUsers: async (): Promise<User[]> => {
        try {
            const response = await axios.get<User[]>('/api/users/');
            console.log('Users response:', response.data); // For debugging
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }
};
