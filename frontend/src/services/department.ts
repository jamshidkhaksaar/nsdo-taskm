import axios from '../utils/axios';

export interface Department {
    id: string;
    name: string;
    description: string;
    head: {
        id: string;
        username: string;
        first_name: string;
        last_name: string;
    } | null;
    created_at: string;
    updated_at: string;
    members_count: number;
    active_projects: number;
    completion_rate: number;
}

export const DepartmentService = {
    // Get all departments
    getDepartments: async () => {
        const response = await axios.get('/api/departments/');
        return response.data;
    },

    // Get a single department
    getDepartment: async (id: string) => {
        const response = await axios.get(`/api/departments/${id}/`);
        return response.data;
    },

    // Get department members
    getDepartmentMembers: async (id: string) => {
        const response = await axios.get(`/api/departments/${id}/members/`);
        return response.data;
    },

    // Create a department
    createDepartment: async (department: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
        const response = await axios.post('/api/departments/', department);
        return response.data;
    },

    // Update a department
    updateDepartment: async (id: string, department: Partial<Department>) => {
        const response = await axios.patch(`/api/departments/${id}/`, department);
        return response.data;
    },

    // Delete a department
    deleteDepartment: async (id: string) => {
        await axios.delete(`/api/departments/${id}/`);
    },

    // Update department head
    updateDepartmentHead: async (id: string, headId: string) => {
        const response = await axios.post(`/api/departments/${id}/update_head/`, {
            head_id: headId
        });
        return response.data;
    },

    // Get department performance metrics
    getDepartmentPerformance: async (id: string) => {
        const response = await axios.get(`/api/departments/${id}/performance/`);
        return response.data;
    }
}; 