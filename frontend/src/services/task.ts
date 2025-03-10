import { apiClient } from './api';
import { AxiosResponse } from 'axios';
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
            const response = await apiClient.get<any[]>('/api/tasks/', { params });
            console.log('Tasks fetched from API:', response);
            
            // Map backend status to frontend status and ensure all required fields are present
            const mappedTasks = response.map(task => {
                // Convert numeric IDs to strings if needed
                const taskId = task.id?.toString() || '';
                
                return {
                    ...task,
                    id: taskId,
                    status: backendToFrontendStatus[task.status as any] || 'pending',
                    title: task.title || '',
                    description: task.description || '',
                    // Ensure created_at exists
                    created_at: task.created_at || new Date().toISOString(),
                    // Ensure other required fields exist
                    due_date: task.due_date || null,
                    context: task.context || 'personal',
                    // Set empty arrays for null values
                    assigned_to: task.assigned_to || [],
                };
            });
            
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
            // Map frontend status to backend status
            const status = frontendToBackendStatus[taskData.status || 'pending'] || 'TODO';
            
            // Prepare the payload with only the fields the backend API expects
            const payload: any = {
                title: taskData.title,
                description: taskData.description || '',
                status,
            };
            
            // Only add fields that are explicitly provided and supported by the backend
            // Add assigned_to if it exists
            if (taskData.assigned_to && taskData.assigned_to.length > 0) {
                payload.assigned_to = taskData.assigned_to;
            }
            
            // Only add department if the context is department
            if (taskData.context === 'department' && taskData.department) {
                payload.department = taskData.department;
            }
            
            // Only add due_date if it's provided
            if (taskData.due_date) {
                payload.due_date = taskData.due_date;
            }
            
            console.log('Creating task with payload:', payload);

            const response = await apiClient.post<any>('/api/tasks/', payload);
            console.log('Created task response:', response);
            
            // Map the response to the expected Task format
            const createdTask: Task = {
                id: response.id?.toString() || '',
                title: response.title || '',
                description: response.description || '',
                status: backendToFrontendStatus[response.status as any] || 'pending',
                due_date: response.due_date || '',
                priority: response.priority || 'medium',
                is_private: response.is_private || false,
                department: response.department || null,
                assigned_to: response.assigned_to || [],
                created_by: response.created_by || null,
                created_at: response.created_at || new Date().toISOString(),
                updated_at: response.updated_at || new Date().toISOString(),
                context: response.context || 'personal'
            };

            console.log('Mapped created task:', createdTask);
            return createdTask;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    // Update an existing task
    updateTask: async (taskId: string, taskData: Partial<TaskUpdate>): Promise<Task> => {
        try {
            // Start with a clean payload
            const payload: any = {};
            
            // Only add fields explicitly mentioned in taskData to avoid sending unnecessary fields
            // This is crucial because the backend rejects fields it doesn't expect
            if (taskData.title !== undefined) payload.title = taskData.title;
            if (taskData.description !== undefined) payload.description = taskData.description;
            
            // Convert frontend status to backend status if provided
            if (taskData.status) {
                payload.status = frontendToBackendStatus[taskData.status] || 'TODO';
            }
            
            // Include assigned_to only if it's explicitly provided
            if (taskData.assigned_to !== undefined) {
                payload.assigned_to = taskData.assigned_to;
            }
            
            // Never send these fields unless specifically implementing endpoints that support them
            // Do not include context, due_date, or department in regular updates
            
            console.log('Sending update payload:', payload);

            const response = await apiClient.patch<any>(`/api/tasks/${taskId}/`, payload);
            console.log('Task update response:', response);

            // Map the response to the expected Task format
            const updatedTask: Task = {
                id: response.id?.toString() || '',
                title: response.title || '',
                description: response.description || '',
                status: backendToFrontendStatus[response.status as any] || 'pending',
                due_date: response.due_date || '',
                priority: response.priority || 'medium',
                is_private: response.is_private || false,
                department: response.department || null,
                assigned_to: response.assigned_to || [],
                created_by: response.created_by || null,
                created_at: response.created_at || new Date().toISOString(),
                updated_at: response.updated_at || new Date().toISOString(),
                context: response.context || 'personal'
            };

            return updatedTask;
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
        try {
            const response = await apiClient.post<any>(`/api/tasks/${taskId}/assign/`, {
                user_id: userId
            });
            
            console.log('Task assignment response:', response);
            
            // Map the response to a Task object
            const updatedTask: Task = {
                id: response.id?.toString() || '',
                title: response.title || '',
                description: response.description || '',
                status: backendToFrontendStatus[response.status as any] || 'pending',
                due_date: response.due_date || '',
                priority: response.priority || 'medium',
                is_private: response.is_private || false,
                department: response.department || null,
                assigned_to: response.assigned_to || [],
                created_by: response.created_by || null,
                created_at: response.created_at || new Date().toISOString(),
                updated_at: response.updated_at || new Date().toISOString(),
                context: response.context || 'personal'
            };
            
            return updatedTask;
        } catch (error) {
            console.error('Error assigning task:', error);
            throw error;
        }
    },

    // Change task status
    changeTaskStatus: async (taskId: string, status: TaskStatus) => {
        try {
            console.log(`Changing task ${taskId} status to ${status}`);
            const backendStatus = frontendToBackendStatus[status] || 'TODO';
            
            // Use the updateTask endpoint with only the status field
            const response = await apiClient.patch<any>(`/api/tasks/${taskId}/`, {
                status: backendStatus
            });
            
            console.log('Status change response:', response);
            
            // Map the response to a Task object
            const updatedTask: Task = {
                id: response.id?.toString() || '',
                title: response.title || '',
                description: response.description || '',
                status: backendToFrontendStatus[response.status as any] || 'pending',
                due_date: response.due_date || '',
                priority: response.priority || 'medium',
                is_private: response.is_private || false,
                department: response.department || null,
                assigned_to: response.assigned_to || [],
                created_by: response.created_by || null,
                created_at: response.created_at || new Date().toISOString(),
                updated_at: response.updated_at || new Date().toISOString(),
                context: response.context || 'personal'
            };
            
            return updatedTask;
        } catch (error) {
            console.error('Error changing task status:', error);
            throw error;
        }
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
