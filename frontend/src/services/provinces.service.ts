import axios from '../utils/axios';
import { Province } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const PROVINCES_API_URL = `${API_URL}/provinces`;

export const getProvinces = async (): Promise<Province[]> => {
  try {
    console.log('[Province Service] Fetching provinces from API...');
    const response = await axios.get<Province[]>(PROVINCES_API_URL);
    // Backend returns Province[]: { id, name, description, departments (optional) ...}
    // This should be compatible with frontend Province type for dropdowns.
    return response.data;
  } catch (error: any) {
    console.error('Error fetching provinces:', error);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to fetch provinces. Please check network or contact support.');
  }
}; 