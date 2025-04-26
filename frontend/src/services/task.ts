import apiClient from '../utils/axios';
import { AxiosResponse } from 'axios';
import { Task, CreateTask, TaskStatus, TaskUpdate, Department, TaskPriority, DashboardTasksResponse, DelegateTaskData, TaskType } from '@/types/index';
import { User } from '@/types/user';
import { parseDate, toISOString } from '../utils/dateUtils';
import dayjs from 'dayjs';

// Enhanced interface to support role-based task creation
interface GetTasksParams {
    task_type?: 'my_tasks' | 'assigned' | 'created' | 'all';
    department_id?: string;
    user_id?: string;
    include_all?: boolean; // For leadership and admins to see all tasks
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
    if (!data || !data.id) { // Also check for id to ensure it's somewhat valid data
        console.error("standardizeTask received invalid data (null, undefined, or missing id):", data);
        // Return a valid Task object with default/placeholder values
        return {
            id: 'invalid-' + Date.now(),
            title: 'Invalid Task Data',
            description: '',
            status: TaskStatus.PENDING,
            priority: TaskPriority.MEDIUM,
            type: TaskType.PERSONAL,
            dueDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: 'unknown_user',
            isDelegated: false,
            assignedToUserIds: [],
            assignedToUsers: [],
            assignedToDepartmentIds: [],
            assignedToDepartments: [],
            assignedToProvinceId: null,
            assignedToProvince: null,
            delegatedFromTaskId: null,
            delegatedFromTask: null,
            delegatedByUserId: null,
            delegatedBy: null,
         };
    }

    const taskIdForLog = data.id || 'unknown';
    console.log(`[standardizeTask ${taskIdForLog}] Raw data:`, data); // Log raw input

    // Robustly map all possible field names for dashboard columns
    const rawCreatedById = data.createdById || data.created_by || data.created_by_id || null;
    const createdById = rawCreatedById ? ensureStringId(rawCreatedById) : 'unknown_user'; // Ensure string, default if null

    const assignedToProvinceId = data.assignedToProvinceId || data.assigned_to_province_id || null;
    const assignedToUsersData = data.assignedToUsers || data.assigned_to_users || [];
    // Accept both array of user objects or array of user IDs for assignedToUsers
    const assignedToUsersNormalized = Array.isArray(assignedToUsersData)
        ? assignedToUsersData.map(u => typeof u === 'object' && u !== null && u.id ? { ...u, id: ensureStringId(u.id) } : { id: ensureStringId(u) }) // Ensure user object structure with string ID
        : [];
    const assignedToUserIds = assignedToUsersNormalized.map(u => u.id);


    // --- Improved Department ID Handling ---
    let finalAssignedToDepartmentIds: string[] = [];
    let finalAssignedToDepartments: Department[] = []; // Store department objects if available

    const rawDeptIds = data.assignedToDepartmentIds;
    const rawDeptObjs = data.assignedToDepartments || data.assigned_to_departments;

    console.log(`[standardizeTask ${taskIdForLog}] Raw Dept IDs:`, rawDeptIds);
    console.log(`[standardizeTask ${taskIdForLog}] Raw Dept Objs:`, rawDeptObjs);

    if (Array.isArray(rawDeptIds) && rawDeptIds.length > 0 && rawDeptIds.every(id => typeof id === 'string' || typeof id === 'number')) {
        // Priority 1: Use assignedToDepartmentIds if it's a valid array of IDs
        finalAssignedToDepartmentIds = rawDeptIds.map(ensureStringId);
        console.log(`[standardizeTask ${taskIdForLog}] Using assignedToDepartmentIds directly.`);
        // Attempt to populate finalAssignedToDepartments if rawDeptObjs exists and matches IDs
        if (Array.isArray(rawDeptObjs)) {
             finalAssignedToDepartments = rawDeptObjs
                .filter(d => typeof d === 'object' && d !== null && d.id && finalAssignedToDepartmentIds.includes(ensureStringId(d.id)))
                .map(d => ({ ...d, id: ensureStringId(d.id) })); // Ensure IDs are strings
        }

    } else if (Array.isArray(rawDeptObjs) && rawDeptObjs.length > 0) {
        // Priority 2: Use assignedToDepartments (array of objects or IDs)
        console.log(`[standardizeTask ${taskIdForLog}] Using assignedToDepartments/assigned_to_departments.`);
         finalAssignedToDepartments = rawDeptObjs
            .map(d => {
                if (typeof d === 'object' && d !== null && d.id) {
                    return { ...d, id: ensureStringId(d.id) }; // It's an object with an ID
                } else if (typeof d === 'string' || typeof d === 'number') {
                    return { id: ensureStringId(d) }; // It's just an ID, create a basic object
                }
                return null; // Invalid department data
            })
            .filter((d): d is Department => d !== null); // Filter out nulls and assert type

        finalAssignedToDepartmentIds = finalAssignedToDepartments.map(d => d.id);

    } else {
        // Fallback: No valid department assignments found
        console.warn(`[standardizeTask ${taskIdForLog}] No valid department assignments found in assignedToDepartmentIds or assignedToDepartments.`);
        finalAssignedToDepartmentIds = [];
        finalAssignedToDepartments = [];
    }
     console.log(`[standardizeTask ${taskIdForLog}] Final Dept IDs:`, finalAssignedToDepartmentIds);
     console.log(`[standardizeTask ${taskIdForLog}] Final Dept Objs:`, finalAssignedToDepartments);
    // --- End Improved Department ID Handling ---


    const task: Task = {
        id: ensureStringId(data.id),
        title: data.title || 'Untitled Task',
        description: data.description || '',
        status: data.status || TaskStatus.PENDING,
        priority: data.priority || TaskPriority.MEDIUM,
        type: data.type || TaskType.USER, // Default if missing
        dueDate: data.dueDate || data.due_date || null,
        createdAt: data.createdAt || data.created_at || new Date().toISOString(), // Default if missing
        updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(), // Default if missing
        createdById: createdById,
        isDelegated: data.isDelegated !== undefined ? data.isDelegated : false, // Default if missing

        // Assign final derived arrays/IDs
        assignedToUserIds: assignedToUserIds,
        assignedToUsers: assignedToUsersNormalized,
        assignedToDepartmentIds: finalAssignedToDepartmentIds, // Use the robustly derived IDs
        assignedToDepartments: finalAssignedToDepartments,     // Use the derived objects
        assignedToProvinceId: assignedToProvinceId,
        assignedToProvince: data.assignedToProvince || null,
        delegatedFromTaskId: data.delegatedFromTaskId || null,
        delegatedFromTask: data.delegatedFromTask || null,
        delegatedByUserId: data.delegatedByUserId ? ensureStringId(data.delegatedByUserId) : null,
        delegatedBy: data.delegatedBy || null,
    };

    return task;
};

// Explicitly define the structure for counts response
export interface TaskStatusCountsResponse {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  // We use string keys here because TaskStatus enum values aren't literal types for indexing
  // The backend should return keys matching these strings (or TaskStatus enum values)
}

export const TaskService = {
    // Add helper functions to the TaskService object for compatibility
    standardizeTask,
    ensureStringId,

    // Get all tasks with enhanced filtering for different user roles
    getTasks: async (params: GetTasksParams = {}): Promise<Task[]> => {
        try {
            const response = await apiClient.get<any>('/tasks/', { params }); // Expect 'any' initially
            console.log('[TaskService.getTasks] API Response:', response);

            // --- Check if response.data is an array ---
            let tasksData: any[] = [];
            if (Array.isArray(response.data)) {
                tasksData = response.data;
            } else if (response.data && typeof response.data === 'object') {
                 // Attempt to find tasks if response is an object (e.g., { tasks: [...] } or paginated)
                 if (Array.isArray(response.data.tasks)) {
                     tasksData = response.data.tasks;
                 } else if (Array.isArray(response.data.results)) { // Common pagination pattern
                     tasksData = response.data.results;
                 } else {
                     console.warn('[TaskService.getTasks] API response data is an object but does not contain a known tasks array (e.g., .tasks, .results). Treating as empty.');
                 }
            } else {
                 console.warn('[TaskService.getTasks] API response data is not an array or a recognized object structure. Treating as empty.');
            }
             console.log('[TaskService.getTasks] Extracted tasks data for mapping:', tasksData);

            // Map backend data to standardized frontend Task objects
            const mappedTasks = tasksData.map(standardizeTask);

            console.log('[TaskService.getTasks] Mapped tasks:', mappedTasks);
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
            const response = await apiClient.get<any[]>(`/tasks/`, { params: { department_id: stringDepartmentId } });
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
    // Reverted signature: Accept optional createdById based on CreateTask type
    // Payload construction will handle conditional inclusion
    createTask: async (taskData: Omit<CreateTask, 'status' | 'type'>): Promise<Task> => {
        try {
            console.log('Creating task with data:', taskData);

            // Base payload without conditional fields
            const payload: any = {
                title: taskData.title,
                description: taskData.description || '',
                priority: taskData.priority,
                assignedToUserIds: taskData.assignedToUserIds,
                assignedToDepartmentIds: taskData.assignedToDepartmentIds,
                assignedToProvinceId: taskData.assignedToProvinceId,
                isDelegated: taskData.isDelegated,
                dueDate: taskData.dueDate ? (dayjs.isDayjs(taskData.dueDate) ? taskData.dueDate.toISOString() : toISOString(taskData.dueDate)) : null,
            };

            // Conditionally add createdById if it exists in taskData
            // This allows the dialog to control sending it based on task type
            if (taskData.createdById) {
                payload.createdById = taskData.createdById;
            }

            // Filter out undefined/null values from payload before sending
            Object.keys(payload).forEach(key => (payload[key] === undefined || payload[key] === null) && delete payload[key]);

            console.log('Submitting payload to API:', payload);

            const response = await apiClient.post<Task>('/tasks/', payload);
            const createdTask = response.data;

            return {
                ...standardizeTask(createdTask),
                priority: taskData.priority as TaskPriority
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
            console.error(`Error updating task ${taskId}:`, error);
            throw error;
        }
    },

    // Delete a task
    deleteTask: async (taskId: string, deletionReason: string): Promise<void> => {
        const stringTaskId = ensureStringId(taskId);
        try {
            // Use POST endpoint with deletion reason
            await apiClient.post(`/tasks/${stringTaskId}/delete`, { deletionReason });
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

            // Standardize the task object
            return standardizeTask(response);
        } catch (error) {
            // Retain essential error logging
            console.error(`Error assigning task ${taskId} to user ${userId}:`, error);
            throw error;
        }
    },

    // Change task status
    changeTaskStatus: async (taskId: string, status: TaskStatus): Promise<Task> => {
        const stringTaskId = ensureStringId(taskId);
        try {
            console.log(`Changing task ${stringTaskId} status to ${status}`);
            const response = await apiClient.patch<Task>(`/tasks/${stringTaskId}/status`, { status });
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
            const response = await apiClient.patch<Task>(`/tasks/${stringTaskId}/priority`, { priority });
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
            const response: AxiosResponse<any[]> = await apiClient.get('/tasks');

            if (response.status === 200) {
                const tasks = response.data;
                const mappedTasks = tasks.map(standardizeTask);
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
            const response = await apiClient.post<Task>(`/tasks/${stringTaskId}/delegate`, delegationData);
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
            const response = await apiClient.get<DashboardTasksResponse>('/tasks/dashboard');
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
            const response = await apiClient.get<Task>(`/tasks/${stringTaskId}`);
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
            const response = await apiClient.post<Task>(`/tasks/${stringTaskId}/cancel`);
            return standardizeTask(response.data);
        } catch (error) {
            console.error(`Error cancelling task ${stringTaskId}:`, error);
            throw error;
        }
    },

    // NEW method to fetch task counts by status for a department
    getTaskCountsByStatusForDepartment: async (departmentId: string): Promise<{ [key in TaskStatus]?: number }> => {
        if (!departmentId) {
            console.warn('[TaskService] getTaskCountsByStatusForDepartment called without departmentId');
            // Return default counts with string keys
            return {
                pending: 0,
                in_progress: 0,
                completed: 0,
                cancelled: 0,
            };
        }
        try {
            const response = await apiClient.get<{ [key in TaskStatus]?: number }>(`/tasks/counts/by-status/department/${departmentId}`);
            console.log(`[TaskService] Received task counts for department ${departmentId}:`, response.data);
            // Ensure the response matches the expected structure
            return response.data;
        } catch (error: any) {
            console.error(`[TaskService] Error fetching task counts for department ${departmentId}:`, error);
            throw new Error(`Failed to fetch task counts: ${error.response?.data?.message || error.message}`);
        }
    },

    // NEW method to fetch task counts by status for a user
    getTaskCountsByStatusForUser: async (userId: string): Promise<TaskStatusCountsResponse> => {
        if (!userId) {
            console.warn('[TaskService] getTaskCountsByStatusForUser called without userId');
            // Return default counts with string keys
            return {
                pending: 0,
                in_progress: 0,
                completed: 0,
                cancelled: 0,
            };
        }
        try {
            console.log(`[TaskService] Fetching task counts for user ID: ${userId}`);
            const response = await apiClient.get<TaskStatusCountsResponse>(`/tasks/counts/by-status/user/${userId}`);
            console.log(`[TaskService] Received task counts for user ${userId}:`, response.data);
            // Ensure the response matches the expected structure
            return response.data;
        } catch (error: any) {
            console.error(`[TaskService] Error fetching task counts for user ${userId}:`, error);
            throw new Error(`Failed to fetch user task counts: ${error.response?.data?.message || error.message}`);
        }
    },
};
