import axios from '../utils/axios';
import { Department } from '../types'; // Assuming Department type is in types/index.ts

const API_URL = import.meta.env.VITE_APP_API_URL || 
                 process.env.REACT_APP_API_URL || 
                 (import.meta.env.PROD ? 'https://api.nsdo.org.af/api/v1' : 'http://localhost:3001/api');
const DEPARTMENTS_API_URL = `${API_URL}/departments`;

// Fetches all departments. Optionally filter by provinceId.
export const getDepartments = async (provinceId?: string): Promise<Department[]> => {
  try {
    let url = DEPARTMENTS_API_URL;
    if (provinceId) {
      url += `?provinceId=${provinceId}`;
    }
    console.log(`[Department Service] Fetching departments from API: ${url}`);
    const response = await axios.get<Department[]>(url);
    // Backend returns formatted departments: { id, name, provinceId, province_name, ... }
    // This should be compatible with the frontend Department type.
    return response.data;
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to fetch departments. Please check network or contact support.');
  }
}; 