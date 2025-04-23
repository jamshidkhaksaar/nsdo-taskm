import { apiClient } from '../api';
import { Province, Department, CreateProvinceDto, UpdateProvinceDto, AssignDepartmentsDto } from '../../types';

// --- Admin Province Endpoints --- 

// Base URL for non-GET admin operations might still be useful if structured differently
const ADMIN_BASE_URL = '/admin/provinces'; // Keep for POST/PUT/DELETE if they use this structure, BUT GET is different now

/**
 * Fetches all provinces (Admin context).
 */
export const getAdminProvinces = async (): Promise<Province[]> => {
  // Correct endpoint based on backend controller refactoring
  return apiClient.get<Province[]>('/provinces/admin'); 
};

/**
 * Fetches a single province by ID (Admin context).
 */
export const getAdminProvinceById = async (id: string): Promise<Province> => {
  // Correct endpoint based on backend controller refactoring
  return apiClient.get<Province>(`/provinces/admin/${id}`);
};

/**
 * Creates a new province (Admin context).
 */
export const createAdminProvince = async (data: CreateProvinceDto): Promise<Province> => {
  // Correct endpoint based on backend controller refactoring
  return apiClient.post<Province>('/provinces/admin', data);
};

/**
 * Updates an existing province (Admin context).
 */
export const updateAdminProvince = async (id: string, data: UpdateProvinceDto): Promise<Province> => {
  // Correct endpoint based on backend controller refactoring
  return apiClient.put<Province>(`/provinces/admin/${id}`, data);
};

/**
 * Deletes a province (Admin context).
 */
export const deleteAdminProvince = async (id: string): Promise<{ success: boolean; message: string }> => {
  // Correct endpoint based on backend controller refactoring
  return apiClient.delete<{ success: boolean; message: string }>(`/provinces/admin/${id}`);
};

// --- Admin Province Department Management --- 

/**
 * Fetches departments associated with a specific province (Admin context).
 */
export const getAdminDepartmentsForProvince = async (provinceId: string): Promise<Department[]> => {
  // Correct endpoint based on backend controller refactoring
  return apiClient.get<Department[]>(`/provinces/admin/${provinceId}/departments`);
};

/**
 * Assigns existing departments to a province (Admin context).
 */
export const assignDepartmentsToProvince = async (provinceId: string, data: AssignDepartmentsDto): Promise<Province> => {
  // Correct endpoint based on backend controller refactoring
  return apiClient.post<Province>(`/provinces/admin/${provinceId}/departments`, data);
};

/**
 * Removes a department from a province (Admin context).
 */
export const removeDepartmentFromProvince = async (provinceId: string, departmentId: string): Promise<void> => {
  // Correct endpoint based on backend controller refactoring
  await apiClient.delete<void>(`/provinces/admin/${provinceId}/departments/${departmentId}`);
};

// --- Public Province Endpoints ---

/**
 * Fetches provinces accessible to the current user (non-admin context).
 */
export const getPublicProvinces = async (): Promise<Province[]> => {
  return apiClient.get<Province[]>('/provinces'); // Assuming /provinces is the public endpoint
};

/**
 * Gets performance statistics for a province
 */
export const getProvincePerformance = async (provinceId: string): Promise<any> => {
  try {
    return apiClient.get(`/provinces/${provinceId}/performance`);
  } catch (error) {
    console.error('Error fetching province performance:', error);
    throw error;
  }
};

/**
 * Gets performance statistics for multiple provinces
 */
export const getMultiProvincePerformance = async (provinceIds: string[]): Promise<any> => {
  try {
    const idsParam = provinceIds.join(',');
    return apiClient.get(`/provinces/performance?ids=${idsParam}`);
  } catch (error) {
    console.error('Error fetching multi-province performance:', error);
    throw error;
  }
};