// frontend/src/services/tasks.service.ts
import axios from '../utils/axios'; // Use the configured axios instance
import { Task, UpdateTaskAssignmentsDto, CreatorDelegateTaskDto, TaskStatus, TaskPriority, TaskType, DelegationRequestStatus } from '../types'; // Corrected import paths for types

// Use import.meta.env for Vite environment variables
const API_BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3001/api'; 
const TASKS_API_URL = `${API_BASE_URL}/tasks`;

export const getTasks = async (): Promise<Task[]> => {
  const response = await axios.get<Task[]>(TASKS_API_URL);
  return response.data;
};

export const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdById'>): Promise<Task> => {
    const response = await axios.post<Task>(TASKS_API_URL, taskData);
    return response.data;
};

export const updateTask = async (id: string, taskData: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Task> => {
    const response = await axios.put<Task>(`${TASKS_API_URL}/${id}`, taskData);
    return response.data;
};

export const deleteTask = async (id: string, deletionReason: string): Promise<void> => {
    await axios.post(`${TASKS_API_URL}/${id}/delete`, { deletionReason });
};

export const updateTaskAssignments = async (taskId: string, data: UpdateTaskAssignmentsDto): Promise<Task> => {
  try {
    const response = await axios.patch(`${TASKS_API_URL}/${taskId}/assignments`, data);
    return response.data; // Assuming backend returns the updated Task object

    // Placeholder was here, now using actual API call structure
    // console.log(`[Task Service] Updating assignments for task ${taskId}:`, data);
    // await new Promise(resolve => setTimeout(resolve, 500)); 
    // const mockUpdatedTask: Task = { ... }; 
    // return mockUpdatedTask;

  } catch (error: any) { // Typed error for better handling
    console.error('Error updating task assignments:', error);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Network error or failed to update task assignments');
    }
  }
}; 

// Frontend DTO for requesting delegation - matches backend DelegateTaskDto
interface DelegateTaskDtoFrontend {
  delegatedToUserId: string;
  reason: string;
}

// Frontend DTO for updating delegation status - matches backend UpdateDelegationStatusDto
// This is the single, exported definition.
export interface UpdateDelegationStatusDtoFrontend {
  status: DelegationRequestStatus.APPROVED | DelegationRequestStatus.REJECTED; // From your backend enum
  rejectionReason?: string;
}

export const requestTaskDelegation = async (taskId: string, dto: DelegateTaskDtoFrontend): Promise<Task> => {
  try {
    const response = await axios.post<Task>(`${TASKS_API_URL}/${taskId}/request-delegation`, dto);
    return response.data;
  } catch (error: any) {
    console.error('Error requesting task delegation:', error);
    const message = error.response?.data?.message || error.message || 'Failed to request task delegation.';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
};

export const approveOrRejectDelegation = async (taskId: string, dto: UpdateDelegationStatusDtoFrontend): Promise<Task> => {
  try {
    const response = await axios.patch<Task>(`${TASKS_API_URL}/${taskId}/delegation-review`, dto);
    return response.data;
  } catch (error: any) {
    console.error('Error approving/rejecting task delegation:', error);
    const message = error.response?.data?.message || error.message || 'Failed to process delegation review.';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
};

export const delegateTaskAssignmentsByCreator = async (taskId: string, data: CreatorDelegateTaskDto): Promise<Task> => {
  try {
    const response = await axios.patch<Task>(`${TASKS_API_URL}/${taskId}/delegate-assignments-by-creator`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error delegating task assignments by creator:', error);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Network error or failed to delegate task assignments by creator');
    }
  }
}; 