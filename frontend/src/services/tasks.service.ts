// frontend/src/services/tasks.service.ts
import axios from '../utils/axios'; // Use the configured axios instance
import { Task } from '../types/task'; // Correct path based on Dashboard.tsx

const API_URL = '/tasks'; // Assuming '/api' prefix is handled by axios

export const getTasks = async (): Promise<Task[]> => {
  const response = await axios.get<Task[]>(API_URL);
  return response.data;
};

export const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    const response = await axios.post<Task>(API_URL, taskData);
    return response.data;
};

export const updateTask = async (id: number, taskData: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Task> => {
    const response = await axios.put<Task>(`${API_URL}/${id}`, taskData);
    return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
}; 