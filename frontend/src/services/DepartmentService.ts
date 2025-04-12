import apiClient from '../utils/axios';
import { Department } from './department';

export class DepartmentService {
  static async getDepartments(): Promise<Department[]> {
    try {
      const response = await apiClient.get<Department[]>('/departments');
      return response.data;
    } catch (error) {
      console.error("Error fetching departments:", error);
      return [];
    }
  }

  static async getDepartment(id: string): Promise<Department | null> {
    try {
        const response = await apiClient.get<Department>(`/departments/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching department ${id}:`, error);
        return null;
    }
  }

  static async createDepartment(department: Partial<Department>): Promise<Department | null> {
    try {
        const response = await apiClient.post<Department>('/departments', department);
        return response.data;
    } catch (error) {
        console.error("Error creating department:", error);
        return null;
    }
  }

  static async updateDepartment(id: string, department: Partial<Department>): Promise<Department | null> {
    try {
        const response = await apiClient.put<Department>(`/departments/${id}`, department);
        return response.data;
    } catch (error) {
        console.error(`Error updating department ${id}:`, error);
        return null;
    }
  }

  static async deleteDepartment(id: string): Promise<boolean> {
    try {
        await apiClient.delete(`/departments/${id}`);
        return true;
    } catch(error) {
        console.error(`Error deleting department ${id}:`, error);
        return false;
    }
  }
}