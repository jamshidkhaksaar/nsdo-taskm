import axios from '../utils/axios';
import { Department } from './department';

export class DepartmentService {
  static async getDepartments(): Promise<Department[]> {
    const response = await axios.get('/api/departments/');
    return response.data;
  }

  static async getDepartment(id: string): Promise<Department> {
    const response = await axios.get(`/api/departments/${id}/`);
    return response.data;
  }

  static async createDepartment(department: Partial<Department>): Promise<Department> {
    const response = await axios.post('/api/departments/', department);
    return response.data;
  }

  static async updateDepartment(id: string, department: Partial<Department>): Promise<Department> {
    const response = await axios.put(`/api/departments/${id}/`, department);
    return response.data;
  }

  static async deleteDepartment(id: string): Promise<void> {
    await axios.delete(`/api/departments/${id}/`);
  }
} 