import apiClient from '../../utils/axios';
import { Province, Department, CreateProvinceDto, UpdateProvinceDto, AssignDepartmentsDto } from '../../types';

// --- Admin Province Endpoints --- 

/**
 * Fetches all provinces (Admin context).
 */
export const getAdminProvinces = async (): Promise<Province[]> => {
  // Correct endpoint based on backend controller refactoring
  const response = await apiClient.get<Province[]>('/provinces/admin');
  return response.data; // Return data property
};

/**
 * Fetches a single province by ID (Admin context).
 */
export const getAdminProvinceById = async (id: string): Promise<Province> => {
  // Correct endpoint based on backend controller refactoring
  const response = await apiClient.get<Province>(`/provinces/admin/${id}`);
  return response.data; // Return data property
};

/**
 * Creates a new province (Admin context).
 */
export const createAdminProvince = async (data: CreateProvinceDto): Promise<Province> => {
  // Correct endpoint based on backend controller refactoring
  const response = await apiClient.post<Province>('/provinces/admin', data);
  return response.data; // Return data property
};

/**
 * Updates an existing province (Admin context).
 */
export const updateAdminProvince = async (id: string, data: UpdateProvinceDto): Promise<Province> => {
  // Correct endpoint based on backend controller refactoring
  const response = await apiClient.put<Province>(`/provinces/admin/${id}`, data);
  return response.data; // Return data property
};

/**
 * Deletes a province (Admin context).
 */
export const deleteAdminProvince = async (id: string): Promise<{ success: boolean; message: string }> => {
  // Correct endpoint based on backend controller refactoring
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/provinces/admin/${id}`);
  return response.data; // Return data property
};

// --- Admin Province Department Management --- 

/**
 * Fetches departments associated with a specific province (Admin context).
 */
export const getAdminDepartmentsForProvince = async (provinceId: string): Promise<Department[]> => {
  // Correct endpoint based on backend controller refactoring
  const response = await apiClient.get<Department[]>(`/provinces/admin/${provinceId}/departments`);
  return response.data; // Return data property
};

/**
 * Assigns existing departments to a province (Admin context).
 */
export const assignDepartmentsToProvince = async (provinceId: string, data: AssignDepartmentsDto): Promise<Province> => {
  // Correct endpoint based on backend controller refactoring
  const response = await apiClient.post<Province>(`/provinces/admin/${provinceId}/departments`, data);
  return response.data; // Return data property
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
  const response = await apiClient.get<Province[]>('/provinces'); // Assuming /provinces is the public endpoint
  return response.data; // Return data property
};

/**
 * Gets performance statistics for a province
 */
export const getProvincePerformance = async (provinceId: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/provinces/${provinceId}/performance`);
    return response.data; // Return data property
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
    const response = await apiClient.get(`/provinces/performance?ids=${idsParam}`);
    return response.data; // Return data property
  } catch (error) {
    console.error('Error fetching multi-province performance:', error);
    throw error;
  }
};