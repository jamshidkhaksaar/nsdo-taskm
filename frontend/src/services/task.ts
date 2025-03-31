import apiClient from '../utils/axios';
import { AxiosResponse } from 'axios';
import { Task, CreateTask, TaskStatus, TaskUpdate, DepartmentRef, TaskPriority } from '../types/task';
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
            const status = frontendToBackendStatus[taskData.status || TaskStatus.PENDING] || 'pending';
            
            console.log('Creating task with data:', taskData);
            
            const taskPriorities = JSON.parse(localStorage.getItem('taskPriorities') || '{}');
            
            const payload: any = {
                title: taskData.title,
                description: taskData.description || '',
                status,
                context: taskData.context,
            };

            if (taskData.due_date) {
                payload.dueDate = toISOString(taskData.due_date);
            }

            const response = await apiClient.post('/api/tasks/', payload);
            const createdTask = response.data;

            // Store the priority if provided
            const taskPriority = taskData.priority || 'medium';
            taskPriorities[createdTask.id] = taskPriority;
            localStorage.setItem('taskPriorities', JSON.stringify(taskPriorities));

            return {
                ...standardizeTask(createdTask),
                priority: taskPriority as TaskPriority
            };
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    // Update an existing task
    updateTask: async (taskId: string, updates: TaskUpdate): Promise<Task> => {
        try {
            const apiUpdates = {
                ...updates,
                ...(updates.priority && {
                    priority: updates.priority
                })
            };

            const response = await apiClient.patch(`/api/tasks/${taskId}/`, apiUpdates);
            return standardizeTask(response.data);
        } catch (error) {
            console.error('Error in updateTask:', error);
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
