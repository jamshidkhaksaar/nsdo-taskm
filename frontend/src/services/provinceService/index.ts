import apiClient from '../../utils/axios';

export async function getProvinces() {
  const res = await apiClient.get('/provinces');
  return res.data;
}

export async function getDepartmentsByProvince(provinceId: string) {
  const res = await apiClient.get(`/provinces/${provinceId}/departments`);
  return res.data;
}

export async function createProvince(data: { name: string; description?: string }) {
  const res = await apiClient.post('/provinces', data);
  return res.data;
}

export async function updateProvince(id: string, data: { name: string; description?: string }) {
  const res = await apiClient.put(`/provinces/${id}`, data);
  return res.data;
}

export async function deleteProvince(id: string) {
  const res = await apiClient.delete(`/provinces/${id}`);
  return res.data;
}

export async function assignDepartmentToProvince(provinceId: string, departmentId: string) {
  const res = await apiClient.post(`/provinces/${provinceId}/assign-department`, { departmentId });
  return res.data;
}