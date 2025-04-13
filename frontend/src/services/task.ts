import apiClient from '../utils/axios';
import { AxiosResponse } from 'axios';
import { Task, CreateTask, TaskStatus, TaskUpdate, DepartmentRef, TaskPriority, DashboardTasksResponse, DelegateTaskData } from '../types/task';
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

// Standardize task data received from API
const standardizeTask = (data: any): Task => {
    if (!data) {
        console.error("standardizeTask received null or undefined data");
        return {
            id: 'invalid-' + Date.now(),
            title: 'Invalid Task Data',
            description: '',
            status: TaskStatus.PENDING,
            priority: TaskPriority.MEDIUM,
            dueDate: null,
            departmentId: null
         } as Task;
    }

    // Robustly map all possible field names for dashboard columns
    const createdById = data.createdById || data.created_by || data.created_by_id || null;
    // Prefer department object if available, fallback to string or null
    const department =
        data.department && typeof data.department === 'object'
            ? data.department
            : data.department_obj && typeof data.department_obj === 'object'
                ? data.department_obj
                : data.department_name
                    ? { id: data.departmentId || data.department_id || null, name: data.department_name }
                    : null;
    const assignedToDepartmentIds = data.assignedToDepartmentIds || data.assigned_to_departments || null;
    const assignedToProvinceId = data.assignedToProvinceId || data.assigned_to_province_id || null;
    const assignedToUsers = data.assignedToUsers || data.assigned_to_users || [];
    // Accept both array of user objects or array of user IDs
    const assignedToUsersNormalized = Array.isArray(assignedToUsers)
        ? assignedToUsers.map(u => typeof u === 'object' ? u : { id: u })
        : [];

    const task: Task = {
        id: ensureStringId(data.id),
        title: data.title || 'Untitled Task',
        description: data.description || '',
        status: data.status || TaskStatus.PENDING,
        priority: data.priority || TaskPriority.MEDIUM,
        dueDate: data.dueDate || data.due_date || null,
        departmentId: data.departmentId || data.department_id || null,
        // department property is set below with robust mapping
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at,
        createdById: createdById ? ensureStringId(createdById) : null,
        assigned_to: Array.isArray(data.assigned_to)
                        ? data.assigned_to.map(ensureStringId)
                        : (data.assigned_to ? [ensureStringId(data.assigned_to)] : []),
        type: data.type,
        is_private: data.is_private,
        department, // Add department object if available
        delegatedByUserId: data.delegatedByUserId ? ensureStringId(data.delegatedByUserId) : null,
        assignedToDepartmentIds: assignedToDepartmentIds || [],
        assignedToProvinceId: assignedToProvinceId || null,
        assignedToUsers: assignedToUsersNormalized,
        context: data.context,
        created_by: data.created_by ? ensureStringId(data.created_by) : undefined,
    };

    if (task.assigned_to === undefined) task.assigned_to = [];

    return task;
};

export const TaskService = {
    // Add helper functions to the TaskService object for compatibility
    standardizeTask,
    ensureStringId,

    // Get all tasks with enhanced filtering for different user roles
    getTasks: async (params: GetTasksParams = {}): Promise<Task[]> => {
        try {
            // Add support for role-based filtering
            const response = await apiClient.get<any[]>('/tasks/', { params });
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
            const response = await apiClient.get<Task[]>(`/tasks/?department=${stringDepartmentId}`);
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
        const response = await apiClient.get<Task[]>(`/tasks/?assigned_to=${stringUserId}`);
        return response.data.map(standardizeTask);
    },

    // Get tasks created by user
    getCreatedTasks: async (userId: string) => {
        const stringUserId = ensureStringId(userId);
        const response = await apiClient.get<Task[]>(`/tasks/?created_by=${stringUserId}`);
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
                assignedToUserIds: taskData.assignedToUserIds,
                priority: taskData.priority,
                assignedToDepartmentIds: taskData.assignedToDepartmentIds,
                assignedToProvinceId: taskData.assignedToProvinceId,
                type: taskData.type,
                isDelegated: taskData.isDelegated,
                delegatedByUserId: taskData.delegatedByUserId,
                delegatedFromTaskId: taskData.delegatedFromTaskId
            };

            if (taskData.dueDate) {
                payload.dueDate = toISOString(taskData.dueDate);
            } else {
                delete payload.dueDate;
            }

            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

            console.log('Sending payload to API:', payload);

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

            const response = await apiClient.patch(`/tasks/${taskId}/`, apiUpdates);
            return standardizeTask(response.data);
        } catch (error) {
            console.error('Error in updateTask:', error);
            throw error;
        }
    },

    // Delete a task
    deleteTask: async (taskId: string): Promise<void> => {
        const stringTaskId = ensureStringId(taskId);
        try {
            await apiClient.delete(`/api/tasks/${stringTaskId}`);
        } catch (error) {
            console.error(`Error deleting task ${stringTaskId}:`, error);
            throw error;
        }
    },

    // Assign a task to a user
    assignTask: async (taskId: string, userId: string) => {
        try {
            const stringTaskId = ensureStringId(taskId);
            const stringUserId = ensureStringId(userId);

            const response = await apiClient.post<any>(`/tasks/${stringTaskId}/assign/`, {
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
    changeTaskStatus: async (taskId: string, status: TaskStatus): Promise<Task> => {
        const stringTaskId = ensureStringId(taskId);
        try {
            console.log(`Changing task ${stringTaskId} status to ${status}`);
            const response = await apiClient.patch<Task>(`/api/tasks/${stringTaskId}/status`, { status });
            return standardizeTask(response.data);
        } catch (error) {
            console.error(`Error changing status for task ${stringTaskId}:`, error);
            throw error;
        }
    },

    // Change task priority
    changeTaskPriority: async (taskId: string, priority: TaskPriority): Promise<Task> => {
        const stringTaskId = ensureStringId(taskId);
        try {
            console.log(`Changing task ${stringTaskId} priority to ${priority}`);
            const response = await apiClient.patch<Task>(`/api/tasks/${stringTaskId}/priority`, { priority }); // Use plan endpoint
            return standardizeTask(response.data);
        } catch (error) {
            console.error(`Error changing priority for task ${stringTaskId}:`, error);
            throw error;
        }
    },

    // Get users for task assignment
    getUsers: async (): Promise<User[]> => {
        try {
            const response = await apiClient.get<User[]>('/users/');
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Get a single task
    getTask: async (taskId: string): Promise<Task> => {
        try {
            const response = await apiClient.get<Task>(`/tasks/${taskId}/`);

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

            const response = await apiClient.get<any[]>('/tasks/', { params }); // Expect any[] from API

            // Map using standardizeTask
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

    // Example: Ensure fetchTasks uses it
    async fetchTasks(): Promise<Task[]> {
        try {
            console.log('Fetching tasks from API...');
            const response: AxiosResponse<any[]> = await apiClient.get('/tasks');
            console.log('API response for tasks:', response.data);
            console.log('Response status:', response.status);

            if (response.status === 200) {
                const tasks = response.data;
                console.log(`Received ${tasks.length} tasks from API`);
                const mappedTasks = tasks.map(standardizeTask);
                console.log('Mapped tasks:', mappedTasks);
                return mappedTasks;
            }
            return [];
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
    },

    // Delegate a task to another user
    delegateTask: async (originalTaskId: string, delegationData: DelegateTaskData): Promise<Task> => {
        const stringTaskId = ensureStringId(originalTaskId);
        try {
            console.log(`Delegating task ${stringTaskId} with data:`, delegationData);
            const response = await apiClient.post<Task>(`/api/tasks/${stringTaskId}/delegate`, delegationData);
            return standardizeTask(response.data);
        } catch (error) {
            console.error(`Error delegating task ${stringTaskId}:`, error);
            throw error;
        }
    },

    // Get all tasks relevant for the user's dashboard view
    getDashboardTasks: async (): Promise<DashboardTasksResponse> => {
        try {
            console.log('[TaskService] Fetching tasks for dashboard...');
            const response = await apiClient.get<DashboardTasksResponse>('/api/tasks/dashboard');
            console.log('[TaskService] Dashboard tasks received:', response.data);

            // Assuming the backend response directly matches DashboardTasksResponse structure
            // which might contain categorized task lists (e.g., myTasks, assignedToMe, etc.)
            // We might need standardization within the response lists if backend doesn't do it.
            // For now, returning the raw structure.
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard tasks:', error);
            throw error;
        }
    },

    // Get details for a single task
    getTaskDetails: async (taskId: string): Promise<Task> => {
        const stringTaskId = ensureStringId(taskId);
        try {
            const response = await apiClient.get<Task>(`/api/tasks/${stringTaskId}`);
            return standardizeTask(response.data);
        } catch (error) {
            console.error(`Error fetching details for task ${stringTaskId}:`, error);
            throw error;
        }
    },

    // Fetch tasks delegated BY the current user
    getDelegatedByMeTasks: async (): Promise<Task[]> => {
        try {
            const response = await apiClient.get<Task[]>('/api/tasks/delegated-by-me');
            return response.data.map(standardizeTask);
        } catch (error) {
            console.error('Error fetching tasks delegated by me:', error);
            throw error;
        }
    },

    // Fetch tasks delegated TO the current user
    getDelegatedToMeTasks: async (): Promise<Task[]> => {
        try {
            const response = await apiClient.get<Task[]>('/api/tasks/delegated-to-me');
            return response.data.map(standardizeTask);
        } catch (error) {
            console.error('Error fetching tasks delegated to me:', error);
            throw error;
        }
    },

    // Update partial task details (e.g., status, priority from assignees)
    updateTaskPartial: async (taskId: string, updates: TaskUpdate): Promise<Task> => {
        const stringTaskId = ensureStringId(taskId);
        try {
            console.log(`Partially updating task ${stringTaskId} with:`, updates);
            const response = await apiClient.patch(`/tasks/${stringTaskId}/`, updates);
            return standardizeTask(response.data);
        } catch (error) {
            console.error(`Error partially updating task ${stringTaskId}:`, error);
            throw error;
        }
    },

    // Update full task details (Creator only)
    updateTaskDetails: async (taskId: string, taskData: Partial<Task>): Promise<Task> => {
        const stringTaskId = ensureStringId(taskId);
        try {
            console.log(`Updating full details for task ${stringTaskId} with:`, taskData);
            const response = await apiClient.put<Task>(`/api/tasks/${stringTaskId}`, taskData);
            return standardizeTask(response.data);
        } catch (error) {
            console.error(`Error updating details for task ${stringTaskId}:`, error);
            throw error;
        }
    },

    // Cancel a task
    cancelTask: async (taskId: string): Promise<Task> => {
        const stringTaskId = ensureStringId(taskId);
        try {
            console.log(`Cancelling task ${stringTaskId}`);
            const response = await apiClient.post<Task>(`/api/tasks/${stringTaskId}/cancel`);
            return standardizeTask(response.data);
        } catch (error) {
            console.error(`Error cancelling task ${stringTaskId}:`, error);
            throw error;
        }
    },
};
