import apiClient from '../utils/axios';
import { AxiosResponse } from 'axios';
import { Task, CreateTask, TaskStatus, TaskUpdate, DepartmentRef } from '../types/task';
import { User } from '../types/user';
import { parseDate, toISOString } from '../utils/dateUtils';

// Enhanced interface to support role-based task creation
interface GetTasksParams {
    task_type?: 'my_tasks' | 'assigned' | 'created' | 'all';
    department_id?: string;
    user_id?: string;
    include_all?: boolean; // For general managers and admins to see all tasks
}

// Status mapping between frontend and backend
// No longer needed as backend now uses same values as frontend
const frontendToBackendStatus: Record<TaskStatus, string> = {
    [TaskStatus.PENDING]: 'pending',
    [TaskStatus.IN_PROGRESS]: 'in_progress',
    [TaskStatus.COMPLETED]: 'completed',
    [TaskStatus.CANCELLED]: 'cancelled',
};

const backendToFrontendStatus: Record<string, TaskStatus> = {
    'pending': TaskStatus.PENDING,
    'in_progress': TaskStatus.IN_PROGRESS,
    'completed': TaskStatus.COMPLETED,
    'cancelled': TaskStatus.CANCELLED,
};

// Helper function to ensure IDs are strings
const ensureStringId = (id: string | number): string => {
    return typeof id === 'number' ? id.toString() : id;
};

// Helper function to standardize task objects from API responses
const standardizeTask = (data: any): Task => {
    // Handle date conversion safely
    let dueDateStr = '';
    if (data.due_date) {
        dueDateStr = toISOString(data.due_date);
    } else if (data.dueDate) {
        dueDateStr = toISOString(data.dueDate);
    }

    return {
        id: ensureStringId(data.id),
        title: data.title || '',
        description: data.description || '',
        status: backendToFrontendStatus[data.status as string] || TaskStatus.PENDING,
        due_date: dueDateStr,
        priority: data.priority || 'medium',
        is_private: typeof data.is_private !== 'undefined' ? data.is_private : 
                    (typeof data.isPrivate !== 'undefined' ? data.isPrivate : false),
        department: data.department || null,
        assigned_to: Array.isArray(data.assigned_to) ? data.assigned_to.map(ensureStringId) : 
                    (Array.isArray(data.assignedTo) ? data.assignedTo.map(ensureStringId) : []),
        created_by: ensureStringId(data.created_by || data.createdBy),
        created_at: data.created_at || data.createdAt || new Date().toISOString(),
        updated_at: data.updated_at || data.updatedAt || new Date().toISOString(),
        context: data.context || 'personal'
    };
};

export const TaskService = {
    // Add helper functions to the TaskService object for compatibility
    standardizeTask,
    ensureStringId,
    
    // Get all tasks with enhanced filtering for different user roles
    getTasks: async (params: GetTasksParams = {}): Promise<Task[]> => {
        try {
            // Add support for role-based filtering
            const response = await apiClient.get<any[]>('/api/tasks/', { params });
            console.log('Tasks fetched from API:', response);
            
            // Map backend data to standardized frontend Task objects
            const mappedTasks = response.data.map(standardizeTask);
            
            console.log('Mapped tasks in TaskService:', mappedTasks);
            return mappedTasks;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    },

    // Get tasks by department
    getTasksByDepartment: async (departmentId: string | number): Promise<Task[]> => {
        try {
            // Convert departmentId to string for consistent handling
            const stringDepartmentId = ensureStringId(departmentId);
            const response = await apiClient.get<Task[]>(`/api/tasks/?department=${stringDepartmentId}`);
            return response.data.map(standardizeTask);
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
        const stringUserId = ensureStringId(userId);
        const response = await apiClient.get<Task[]>(`/api/tasks/?assigned_to=${stringUserId}`);
        return response.data.map(standardizeTask);
    },

    // Get tasks created by user
    getCreatedTasks: async (userId: string) => {
        const stringUserId = ensureStringId(userId);
        const response = await apiClient.get<Task[]>(`/api/tasks/?created_by=${stringUserId}`);
        return response.data.map(standardizeTask);
    },

    // Create a new task
    createTask: async (taskData: CreateTask): Promise<Task> => {
        try {
            // Map frontend status to backend status
            const status = frontendToBackendStatus[taskData.status || TaskStatus.PENDING] || 'pending';
            
            console.log('Creating task with status:', status);
            
            // Prepare the payload with only the fields the backend API expects
            const payload: any = {
                title: taskData.title,
                description: taskData.description || '',
                status,
                context: taskData.context,
            };

            // Map due_date to dueDate property that backend expects
            if (taskData.due_date) {
                // Convert to ISO string format that backend expects
                payload.dueDate = toISOString(taskData.due_date);
            }
            
            // Only add fields that are explicitly provided and supported by the backend
            // Add assigned_to if it exists - ensure all IDs are strings
            if (taskData.assigned_to && taskData.assigned_to.length > 0) {
                payload.assignedTo = taskData.assigned_to.map(ensureStringId);
            }
            
            // Only add department if the context is department - ensure ID is string
            if (taskData.context === 'department' && taskData.department) {
                // If department is a string, use it directly; if it's an object with id, use that id as string
                payload.departmentId = typeof taskData.department === 'string' 
                    ? taskData.department 
                    : ensureStringId((taskData.department as DepartmentRef).id);
            }
            
            // priority is not supported by the backend, so we don't include it
            if ('priority' in taskData) {
                console.log('Priority value exists in taskData but will not be sent to backend:', taskData.priority);
                // Explicitly check payload to ensure priority is not included
                if ('priority' in payload) {
                    console.error('ERROR: Priority is still in payload!', payload);
                    delete payload.priority;
                }
            }
            
            console.log('Final payload for task creation:', payload);
            
            // Make sure we have the correct API endpoint
            const response = await apiClient.post<{data: Task}>('/api/tasks/', payload);
            
            // Standardize the task object
            return standardizeTask(response.data);
        } catch (error) {
            console.error('Error in createTask:', error);
            
            // Provide more information about the error
            const axiosError = error as any;
            if (axiosError.response) {
                console.error('Error response:', axiosError.response.data);
            }
            
            throw error;
        }
    },

    // Update an existing task
    updateTask: async (taskId: string, taskData: Partial<TaskUpdate>): Promise<Task> => {
        try {
            // Ensure taskId is a string
            const stringTaskId = ensureStringId(taskId);
            
            // Start with a clean payload
            const payload: any = {};
            
            // Only add fields explicitly mentioned in taskData to avoid sending unnecessary fields
            // This is crucial because the backend rejects fields it doesn't expect
            if (taskData.title !== undefined) payload.title = taskData.title;
            if (taskData.description !== undefined) payload.description = taskData.description;
            
            // Convert frontend status to backend status if provided
            if (taskData.status) {
                payload.status = frontendToBackendStatus[taskData.status] || 'pending';
            }
            
            // Map due_date to dueDate property that backend expects
            if (taskData.due_date) {
                // Convert to ISO string format that backend expects
                payload.dueDate = toISOString(taskData.due_date);
            }
            
            // Map assigned_to to assignedTo that the backend expects
            if (taskData.assigned_to !== undefined) {
                payload.assignedTo = taskData.assigned_to ? taskData.assigned_to.map(ensureStringId) : [];
            }
            
            // Remove priority field if it exists - not supported by backend
            if ('priority' in taskData) {
                console.log('Priority exists in update data but not sending to backend:', taskData.priority);
            }
            
            console.log('Sending update payload:', payload);

            const response = await apiClient.patch<{data: Task}>(`/api/tasks/${stringTaskId}/`, payload);
            
            // Standardize the task object
            return standardizeTask(response.data);
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    },

    // Delete a task
    deleteTask: async (taskId: string) => {
        const stringTaskId = ensureStringId(taskId);
        await apiClient.delete(`/api/tasks/${stringTaskId}/`);
    },

    // Assign a task to a user
    assignTask: async (taskId: string, userId: string) => {
        try {
            const stringTaskId = ensureStringId(taskId);
            const stringUserId = ensureStringId(userId);
            
            const response = await apiClient.post<any>(`/api/tasks/${stringTaskId}/assign/`, {
                user_id: stringUserId
            });
            
            console.log('Task assignment response:', response);
            
            // Standardize the task object
            return standardizeTask(response);
        } catch (error) {
            console.error('Error assigning task:', error);
            throw error;
        }
    },

    // Change task status
    changeTaskStatus: async (taskId: string, status: TaskStatus) => {
        try {
            const stringTaskId = ensureStringId(taskId);
            console.log(`Changing task ${stringTaskId} status to ${status}`);
            
            // Use the updateTask endpoint with only the status field
            const response = await apiClient.patch<any>(`/api/tasks/${stringTaskId}/`, {
                status: status
            });
            
            console.log('Status change response:', response);
            
            // Standardize the task object
            return standardizeTask(response);
        } catch (error) {
            console.error('Error changing task status:', error);
            throw error;
        }
    },

    // Get users for task assignment
    getUsers: async (): Promise<User[]> => {
        try {
            const response = await apiClient.get<User[]>('/api/users/');
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Get a single task
    getTask: async (taskId: string): Promise<Task> => {
        try {
            const response = await apiClient.get<Task>(`/api/tasks/${taskId}/`);
            
            // Convert backend status to frontend status
            return standardizeTask(response.data);
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
            
            const response = await apiClient.get<Task[]>('/api/tasks/', { params });
            
            // Map backend status to frontend status
            return response.data.map(standardizeTask);
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
    },

    async fetchTasks(): Promise<Task[]> {
        try {
            console.log('Fetching tasks from API...');
            const response: AxiosResponse<any[]> = await apiClient.get('/api/tasks');
            console.log('API response for tasks:', response.data);
            console.log('Response status:', response.status);
            
            if (response.status === 200) {
                const tasks = response.data;
                console.log(`Received ${tasks.length} tasks from API`);
                
                // Map the backend tasks to our frontend Task model
                const mappedTasks = tasks.map((task: any) => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority || 'medium',
                    due_date: task.due_date || '',
                    created_at: task.created_at || new Date().toISOString(),
                    updated_at: task.updated_at || new Date().toISOString(),
                    context: task.context || 'personal',
                    department: task.department || null,
                    is_private: task.is_private || false,
                    created_by: task.created_by || null,
                    assigned_to: Array.isArray(task.assigned_to) ? task.assigned_to : (task.assigned_to ? [task.assigned_to] : []),
                }));
                
                console.log('Mapped tasks:', mappedTasks);
                return mappedTasks;
            }
            return [];
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
    }
};
