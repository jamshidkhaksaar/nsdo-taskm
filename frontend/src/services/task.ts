import { apiClient } from './api';
import { Task, CreateTask, TaskStatus, TaskUpdate } from '../types/task';
import { User } from '../types/user';

// Enhanced interface to support role-based task creation
interface GetTasksParams {
    task_type?: 'my_tasks' | 'assigned' | 'created' | 'all';
    department_id?: string;
    user_id?: string;
    include_all?: boolean; // For general managers and admins to see all tasks
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
    // Get all tasks with enhanced filtering for different user roles
    getTasks: async (params: GetTasksParams = {}): Promise<Task[]> => {
        try {
            // Add support for role-based filtering
            const tasks = await apiClient.get<Task[]>('/api/tasks/', { params });
            console.log('Tasks fetched:', tasks);
            
            // Map backend status to frontend status
            const mappedTasks = tasks.map(task => ({
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
            const tasks = await apiClient.get<Task[]>(`/api/tasks/?department=${departmentId}`);
            return tasks;
        } catch (error) {
            console.error('Error fetching tasks by department:', error);
            throw error;
        }
    },

    // Get tasks by department (alias for getTasksByDepartment for compatibility)
    getDepartmentTasks: async (departmentId: string | number): Promise<Task[]> => {
        return TaskService.getTasksByDepartment(departmentId);
    },

    // Get tasks assigned to user
    getAssignedTasks: async (userId: string) => {
        const tasks = await apiClient.get<Task[]>(`/api/tasks/?assigned_to=${userId}`);
        return tasks;
    },

    // Get tasks created by user
    getCreatedTasks: async (userId: string) => {
        const tasks = await apiClient.get<Task[]>(`/api/tasks/?created_by=${userId}`);
        return tasks;
    },

    // Create a new task
    createTask: async (taskData: CreateTask): Promise<Task> => {
        try {
            // Convert frontend status to backend status
            const status = taskData.status 
                ? frontendToBackendStatus[taskData.status] || 'TODO'
                : 'TODO';
            
            // Prepare the payload with proper backend field names
            const payload = {
                title: taskData.title,
                description: taskData.description || '',
                status,
                due_date: taskData.due_date,
                priority: taskData.priority || 'medium',
                department: taskData.department,
                assigned_to: taskData.assigned_to || null,
                is_private: taskData.is_private || false,
                context: taskData.context || 'personal'
            };
            
            console.log('Creating task with payload:', payload);

            const task = await apiClient.post<Task>('/api/tasks/', payload);
            console.log('Create task response:', task);

            return task;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    // Update an existing task
    updateTask: async (taskId: string, taskData: Partial<TaskUpdate>): Promise<Task> => {
        try {
            // Convert frontend status to backend status if provided
            const payload: any = { ...taskData };
            
            if (taskData.status) {
                payload.status = frontendToBackendStatus[taskData.status] || 'TODO';
            }
            
            console.log('Sending update payload:', payload);

            const task = await apiClient.patch<Task>(`/api/tasks/${taskId}/`, payload);
            console.log('Task update response:', task);

            return task;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    },

    // Delete a task
    deleteTask: async (taskId: string) => {
        await apiClient.delete(`/api/tasks/${taskId}/`);
    },

    // Assign a task to a user
    assignTask: async (taskId: string, userId: string) => {
        const task = await apiClient.post<Task>(`/api/tasks/${taskId}/assign/`, {
            user_id: userId
        });
        return task;
    },

    // Change task status
    changeTaskStatus: async (taskId: string, status: TaskStatus) => {
        const backendStatus = frontendToBackendStatus[status] || 'TODO';
        const task = await apiClient.patch<Task>(`/api/tasks/${taskId}/status`, {
            status: backendStatus
        });
        return task;
    },

    // Get users for task assignment
    getUsers: async (): Promise<User[]> => {
        try {
            const users = await apiClient.get<User[]>('/api/users/');
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Get a single task
    getTask: async (taskId: string): Promise<Task> => {
        try {
            const task = await apiClient.get<Task>(`/api/tasks/${taskId}/`);
            
            // Convert backend status to frontend status
            return {
                ...task,
                status: backendToFrontendStatus[task.status as any] || 'pending'
            };
        } catch (error) {
            console.error(`Error fetching task ${taskId}:`, error);
            throw error;
        }
    },

    // Get visible tasks with advanced filtering
    getVisibleTasks: async (
        type: 'my_tasks' | 'assigned' | 'created' | 'all' = 'my_tasks',
        filters: Record<string, any> = {}
    ): Promise<Task[]> => {
        try {
            const params = {
                task_type: type,
                ...filters,
            };
            
            const tasks = await apiClient.get<Task[]>('/api/tasks/', { params });
            
            // Map backend status to frontend status
            return tasks.map(task => ({
                ...task,
                status: backendToFrontendStatus[task.status as any] || 'pending'
            }));
        } catch (error) {
            console.error('Error fetching visible tasks:', error);
            throw error;
        }
    },
    
    // Alias for getVisibleTasks for backward compatibility
    getAllVisibleTasks: async (
        type: 'my_tasks' | 'assigned' | 'created' | 'all' = 'all',
        filters: Record<string, any> = {}
    ): Promise<Task[]> => {
        return TaskService.getVisibleTasks(type, filters);
    }
};
