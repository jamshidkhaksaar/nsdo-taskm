import axios from 'axios';

export async function getProvinces() {
  const res = await axios.get('/api/v1/provinces');
  return res.data;
}

export async function getDepartmentsByProvince(provinceId: string) {
  const res = await axios.get(`/api/v1/provinces/${provinceId}/departments`);
  return res.data;
}