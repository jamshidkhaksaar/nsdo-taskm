import axios from 'axios';
import { Board, Card, User } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Configure axios with default headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
interface LoginResponse {
  token: string;
  user: User;
}

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post<LoginResponse>(
      'http://localhost:8000/api/auth/login/',
      { username, password }
    );
    
    if (response.data.token) {
      const token = `Bearer ${response.data.token}`;
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['Authorization'] = token;
    }
    
    return response;
  } catch (error) {
    console.error('Login API Error:', error);
    throw error;
  }
};

export const logout = async () => {
  localStorage.removeItem('token');
  api.defaults.headers.common['Authorization'] = '';
  return Promise.resolve(); // Since we're just clearing local storage
};

export const getProfile = () => 
  api.get<User>(`/auth/profile/`);

// Board APIs
export const getBoards = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  return api.get<Board[]>('/boards/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getBoard = (id: number) => 
  api.get<Board>(`/boards/${id}/`);

export const createBoard = (data: Partial<Board>) => 
  api.post<Board>(`/boards/`, data);

export const updateBoard = (id: number, data: Partial<Board>) => 
  api.patch<Board>(`/boards/${id}/`, data);

export const deleteBoard = (id: number) => 
  api.delete(`/boards/${id}/`);

// Task APIs
export const getTasks = (boardId: number) => 
  api.get<Card[]>(`/boards/${boardId}/tasks/`);

export const createTask = (boardId: number, data: Partial<Card>) => 
  api.post<Card>(`/boards/${boardId}/tasks/`, data);

export const updateTask = (taskId: number, data: Partial<Card>) => 
  api.patch<Card>(`/tasks/${taskId}/`, data);

export const deleteTask = (taskId: number) => 
  api.delete(`/tasks/${taskId}/`);

// Card Position Update API
export interface UpdateCardPositionParams {
  cardId: number;
  sourceListId: number;
  destListId: number;
  newIndex: number;
}

export const updateCardPositionAPI = (params: UpdateCardPositionParams) => 
  api.post('/cards/update-position/', params);

// Export the api instance as default
export default api;