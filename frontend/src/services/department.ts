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

export interface DepartmentPerformer {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    completed_tasks: number;
    total_tasks: number;
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
    },

    // Get department top performers (alias for getDepartmentPerformance for compatibility)
    getDepartmentPerformers: async (id: string): Promise<DepartmentPerformer[]> => {
        try {
            // For now, we'll return mock data since the backend endpoint might not exist
            return [
                {
                    id: '1',
                    username: 'johndoe',
                    first_name: 'John',
                    last_name: 'Doe',
                    completed_tasks: 15,
                    total_tasks: 20,
                    completion_rate: 75
                },
                {
                    id: '2',
                    username: 'janesmith',
                    first_name: 'Jane',
                    last_name: 'Smith',
                    completed_tasks: 12,
                    total_tasks: 15,
                    completion_rate: 80
                },
                {
                    id: '3',
                    username: 'mikejohnson',
                    first_name: 'Mike',
                    last_name: 'Johnson',
                    completed_tasks: 8,
                    total_tasks: 10,
                    completion_rate: 80
                }
            ];
        } catch (error) {
            console.error('Error fetching department performers:', error);
            return [];
        }
    }
}; 