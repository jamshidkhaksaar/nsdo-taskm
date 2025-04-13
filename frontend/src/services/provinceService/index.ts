import { apiClient } from '../api';
import { Province, Department, CreateProvinceDto, UpdateProvinceDto, AssignDepartmentsDto } from '../../types';

// --- Admin Province Endpoints --- 

const ADMIN_BASE_URL = '/admin/provinces';

/**
 * Fetches all provinces (Admin context).
 */
export const getAdminProvinces = async (): Promise<Province[]> => {
  return apiClient.get<Province[]>(ADMIN_BASE_URL);
};

/**
 * Fetches a single province by ID (Admin context).
 */
export const getAdminProvinceById = async (id: string): Promise<Province> => {
  return apiClient.get<Province>(`${ADMIN_BASE_URL}/${id}`);
};

/**
 * Creates a new province (Admin context).
 */
export const createAdminProvince = async (data: CreateProvinceDto): Promise<Province> => {
  return apiClient.post<Province>(ADMIN_BASE_URL, data);
};

/**
 * Updates an existing province (Admin context).
 */
export const updateAdminProvince = async (id: string, data: UpdateProvinceDto): Promise<Province> => {
  return apiClient.put<Province>(`${ADMIN_BASE_URL}/${id}`, data);
};

/**
 * Deletes a province (Admin context).
 */
export const deleteAdminProvince = async (id: string): Promise<{ success: boolean; message: string }> => {
  // Assuming backend returns { success: true, message: '...' }
  return apiClient.delete<{ success: boolean; message: string }>(`${ADMIN_BASE_URL}/${id}`);
};

// --- Admin Province Department Management --- 

/**
 * Fetches departments associated with a specific province (Admin context).
 */
export const getAdminDepartmentsForProvince = async (provinceId: string): Promise<Department[]> => {
  return apiClient.get<Department[]>(`${ADMIN_BASE_URL}/${provinceId}/departments`);
};

/**
 * Assigns existing departments to a province (Admin context).
 */
export const assignDepartmentsToProvince = async (provinceId: string, data: AssignDepartmentsDto): Promise<Province> => {
  // Backend expects { departmentIds: ['id1', 'id2'] }
  return apiClient.post<Province>(`${ADMIN_BASE_URL}/${provinceId}/departments`, data);
};

/**
 * Removes a department from a province (Admin context).
 */
export const removeDepartmentFromProvince = async (provinceId: string, departmentId: string): Promise<void> => {
  await apiClient.delete<void>(`${ADMIN_BASE_URL}/${provinceId}/departments/${departmentId}`);
};

// --- Potential Public Endpoints (if needed separate from admin) ---
// export const getPublicProvinces = async (): Promise<Province[]> => {
//   return apiClient.get<Province[]>('/provinces');
// };