import axios from '../utils/axios';
import { Task, CreateTask, TaskPriority, TaskStatus } from '../types/task';
import { User } from '../types/user';

interface GetTasksParams {
    task_type?: 'my_tasks' | 'assigned' | 'created' | 'all';
}

// Status mapping between frontend and backend
const frontendToBackendStatus: Record<string, string> = {
    'pending': 'TODO',
    'in_progress': 'IN_PROGRESS',
    'completed': 'DONE',
    'cancelled': 'DONE', // Map cancelled to DONE for now
};

const backendToFrontendStatus: Record<string, TaskStatus> = {
    'TODO': 'pending',
    'IN_PROGRESS': 'in_progress',
    'DONE': 'completed',
};

export const TaskService = {
    // Get all tasks
    getTasks: async (params: GetTasksParams = {}): Promise<Task[]> => {
        try {
            const response = await axios.get<Task[]>('/api/tasks/', { params });
            console.log('Tasks fetched:', response.data);
            
            // Map backend status to frontend status
            const mappedTasks = response.data.map(task => ({
                ...task,
                status: backendToFrontendStatus[task.status as any] || 'pending'
            }));
            
            return mappedTasks;
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

    // Get tasks by department (alias for getTasksByDepartment for compatibility)
    getDepartmentTasks: async (departmentId: string | number): Promise<Task[]> => {
        return TaskService.getTasksByDepartment(departmentId);
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
                status: frontendToBackendStatus[task.status] || 'TODO'
            };
            console.log('Creating task with payload:', payload);

            const response = await axios.post<Task>('/api/tasks/', payload);
            console.log('Create task response:', response.data);

            // Map the response status back to frontend format
            const createdTask: Task = {
                ...response.data,
                priority: (response.data.priority?.toLowerCase() as TaskPriority) || payload.priority,
                status: backendToFrontendStatus[response.data.status as any] || 'pending'
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

            // Handle status update - convert frontend status to backend status
            if (updates.status) {
                payload.status = frontendToBackendStatus[updates.status] || 'TODO';
            }
            
            // Handle other updates
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

            // Convert backend status to frontend status in the response
            return {
                ...response.data,
                status: backendToFrontendStatus[response.data.status as any] || 'pending'
            };
        } catch (error) {
            console.error('Error updating task:', error);
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
    changeTaskStatus: async (taskId: string, status: TaskStatus) => {
        const backendStatus = frontendToBackendStatus[status] || 'TODO';
        const response = await axios.patch<Task>(`/api/tasks/${taskId}/status`, {
            status: backendStatus
        });
        
        // Map response back to frontend format
        return {
            ...response.data,
            status: backendToFrontendStatus[response.data.status as any] || 'pending'
        };
    },

    // Get all users
    getUsers: async (): Promise<User[]> => {
        try {
            const response = await axios.get('/api/users/');
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
            
            // Convert backend status to frontend status
            return {
                ...response.data,
                status: backendToFrontendStatus[response.data.status as any] || 'pending'
            };
        } catch (error) {
            console.error('Error fetching task:', error);
            throw error;
        }
    }
};
