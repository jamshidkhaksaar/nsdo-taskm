import axios from 'axios';

export async function getProvinces() {
  const res = await axios.get('/api/provinces');
  return res.data;
}

export async function getDepartmentsByProvince(provinceId: string) {
  const res = await axios.get(`/api/provinces/${provinceId}/departments`);
  return res.data;
}

export async function createProvince(data: { name: string; description?: string }) {
  const res = await axios.post('/api/provinces', data);
  return res.data;
}

export async function updateProvince(id: string, data: { name: string; description?: string }) {
  const res = await axios.put(`/api/provinces/${id}`, data);
  return res.data;
}

export async function deleteProvince(id: string) {
  const res = await axios.delete(`/api/provinces/${id}`);
  return res.data;
}

export async function assignDepartmentToProvince(provinceId: string, departmentId: string) {
  const res = await axios.post(`/api/provinces/${provinceId}/assign-department`, { departmentId });
  return res.data;
}