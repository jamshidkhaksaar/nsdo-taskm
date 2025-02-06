import axios from '../utils/axios';
import { Task, CreateTask, TaskPriority } from '../types/task';
import { User } from '../types/user';

interface GetTasksParams {
    task_type?: 'my_tasks' | 'assigned' | 'created' | 'all';
}

export const TaskService = {
    // Get all tasks
    getTasks: async (params: GetTasksParams = {}): Promise<Task[]> => {
        try {
            const response = await axios.get<Task[]>('/api/tasks/', { params });
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
            const { updated_at, ...rest } = task;
            const payload = {
                ...rest,
                priority: task.priority?.toLowerCase() || 'medium',
                assigned_to: task.assigned_to || [],
                department: task.department,
                created_by: task.created_by?.toString() || null,
                status: task.status || 'TODO'
            };
            console.log('Creating task with payload:', payload);

            const response = await axios.post<Task>('/api/tasks/', payload);
            console.log('Create task response:', response.data);

            // Ensure the returned task has the correct format
            const createdTask: Task = {
                ...response.data,
                priority: (response.data.priority?.toLowerCase() as TaskPriority) || payload.priority,
                status: response.data.status as Task['status'] || 'TODO'
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
            // Ensure priority is properly formatted
            const formattedPriority = updates.priority?.toLowerCase() as TaskPriority;
            
            // Create a clean payload with only the fields being updated
            const payload: any = {
                updated_at: new Date().toISOString()
            };

            // Handle priority update
            if (formattedPriority) {
                if (!['low', 'medium', 'high'].includes(formattedPriority)) {
                    throw new Error(`Invalid priority value: ${formattedPriority}`);
                }
                payload.priority = formattedPriority;
                console.log('Setting priority in payload:', formattedPriority);
            }

            // Handle other updates
            if (updates.status) payload.status = updates.status;  // Don't convert status case
            if (updates.title) payload.title = updates.title;
            if (updates.description) payload.description = updates.description;
            if (updates.due_date) payload.due_date = updates.due_date;
            if (updates.is_private !== undefined) payload.is_private = updates.is_private;
            if (updates.department) payload.department = updates.department;
            if (updates.assigned_to) payload.assigned_to = updates.assigned_to;

            console.log('Sending update payload:', payload);

            const response = await axios.patch<Task>(`/api/tasks/${taskId}/`, payload);
            console.log('Task update response:', response.data);

            if (!response.data) {
                throw new Error('No data received from server');
            }

            // Verify the update was successful
            const verificationResponse = await axios.get<Task>(`/api/tasks/${taskId}/`);
            const verifiedTask = verificationResponse.data;

            // If priority was updated but verification shows mismatch, force another update
            if (formattedPriority && verifiedTask.priority !== formattedPriority) {
                console.warn('Priority verification failed, forcing update:', {
                    expected: formattedPriority,
                    actual: verifiedTask.priority
                });
                
                // Force another update with just the priority
                const forceUpdateResponse = await axios.patch<Task>(`/api/tasks/${taskId}/`, {
                    priority: formattedPriority,
                    updated_at: new Date().toISOString()
                });
                
                return {
                    ...forceUpdateResponse.data,
                    priority: formattedPriority,
                    status: forceUpdateResponse.data.status as Task['status']
                };
            }

            // Return the verified task data
            return {
                ...verifiedTask,
                priority: (verifiedTask.priority?.toLowerCase() as TaskPriority) || 'medium',
                status: verifiedTask.status as Task['status']
            };

        } catch (error) {
            if ((error as any).response?.status === 401) {
                throw new Error('Session expired. Please login again.');
            }
            console.error('Task update error:', error);
            console.error('Error response:', (error as any).response?.data);
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
    },

    // Get a single task by ID
    getTask: async (taskId: string): Promise<Task> => {
        try {
            const response = await axios.get<Task>(`/api/tasks/${taskId}/`);
            return {
                ...response.data,
                priority: (response.data.priority?.toLowerCase() as TaskPriority) || 'medium',
                status: response.data.status as Task['status'] || 'todo'
            };
        } catch (error) {
            console.error('Error fetching task:', error);
            throw error;
        }
    }
};
