// Mock axios directly instead of importing it
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: {
      headers: { common: {} },
    },
  })),
}));

// Mock the axios utility
jest.mock('../../utils/axios', () => {
  const mockAxios = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: {
      headers: { common: {} },
    },
  };
  return mockAxios;
});

import { TaskService } from '../../services/task';
import { Task, TaskStatus, CreateTask } from '../../types/task';
import axios from '../../utils/axios';

// Get the mocked axios
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TaskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    test('fetches tasks successfully', async () => {
      // Mock response
      const mockTasks = [
        {
          id: '1',
          title: 'Task 1',
          description: 'Description 1',
          status: 'TODO',
          due_date: '2023-12-31',
          created_at: '2023-01-01',
          is_private: true,
          assigned_to: null,
          created_by: 'user1',
          context: 'personal'
        },
        {
          id: '2',
          title: 'Task 2',
          description: 'Description 2',
          status: 'IN_PROGRESS',
          due_date: '2023-12-31',
          created_at: '2023-01-01',
          is_private: false,
          assigned_to: 'user2',
          created_by: 'user1',
          context: 'department'
        }
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockTasks });

      // Call the service
      const result = await TaskService.getTasks();

      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/tasks/', { params: {} });
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending'); // Mapped from 'TODO'
      expect(result[1].status).toBe('in_progress'); // Mapped from 'IN_PROGRESS'
    });

    test('handles error when fetching tasks', async () => {
      // Mock error
      const errorMessage = 'Network Error';
      mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

      // Call the service and expect it to throw
      await expect(TaskService.getTasks()).rejects.toThrow(errorMessage);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/tasks/', { params: {} });
    });

    test('fetches tasks with parameters', async () => {
      // Mock response
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      // Call the service with params
      await TaskService.getTasks({ task_type: 'my_tasks' });

      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/tasks/', { 
        params: { task_type: 'my_tasks' } 
      });
    });
  });

  describe('getTasksByDepartment', () => {
    test('fetches tasks by department successfully', async () => {
      // Mock response
      const mockTasks = [{ id: '1', title: 'Department Task', context: 'department' }];
      mockedAxios.get.mockResolvedValueOnce({ data: mockTasks });

      // Call the service
      const result = await TaskService.getTasksByDepartment('dept1');

      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/tasks/?department=dept1');
      expect(result).toEqual(mockTasks);
    });
  });

  describe('createTask', () => {
    test('creates a task successfully', async () => {
      // Mock task to create with all required properties
      const newTask: CreateTask = {
        title: 'New Task',
        description: 'New Description',
        status: 'pending' as TaskStatus,
        due_date: '2023-12-31',
        is_private: true,
        priority: 'medium',
        created_by: 'user1',
        assigned_to: [],
        department: null,
        context: 'personal'
      };

      // Mock response
      const mockResponse = {
        id: '123',
        ...newTask,
        status: 'TODO', // Backend status
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      // Call the service
      const result = await TaskService.createTask(newTask);

      // Assertions
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/tasks/', expect.objectContaining({
        title: 'New Task',
        status: 'TODO', // Mapped to backend status
      }));
      
      expect(result).toMatchObject({
        id: '123',
        title: 'New Task',
        status: 'pending', // Mapped back to frontend status
      });
    });
  });

  describe('updateTask', () => {
    test('updates a task successfully', async () => {
      // Mock task updates
      const updates = {
        title: 'Updated Title',
        status: 'in_progress' as TaskStatus,
      };

      // Mock response
      const mockResponse = {
        id: '123',
        title: 'Updated Title',
        status: 'IN_PROGRESS', // Backend status
      };

      mockedAxios.patch.mockResolvedValueOnce({ data: mockResponse });

      // Call the service
      const result = await TaskService.updateTask('123', updates);

      // Assertions
      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/tasks/123/', expect.objectContaining({
        title: 'Updated Title',
        status: 'IN_PROGRESS', // Mapped to backend status
      }));
      
      expect(result).toMatchObject({
        id: '123',
        title: 'Updated Title',
        status: 'in_progress', // Mapped back to frontend status
      });
    });
  });

  describe('deleteTask', () => {
    test('deletes a task successfully', async () => {
      mockedAxios.delete.mockResolvedValueOnce({});

      // Call the service
      await TaskService.deleteTask('123');

      // Assertions
      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/tasks/123/');
    });
  });

  describe('changeTaskStatus', () => {
    test('changes task status successfully', async () => {
      // Mock response
      const mockResponse = {
        id: '123',
        status: 'DONE', // Backend status
      };

      mockedAxios.patch.mockResolvedValueOnce({ data: mockResponse });

      // Call the service
      const result = await TaskService.changeTaskStatus('123', 'completed');

      // Assertions
      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/tasks/123/status', {
        status: 'DONE', // Mapped to backend status
      });
      
      expect(result).toMatchObject({
        id: '123',
        status: 'completed', // Mapped back to frontend status
      });
    });
  });

  describe('getTask', () => {
    test('fetches a single task successfully', async () => {
      // Mock response
      const mockTask = {
        id: '123',
        title: 'Single Task',
        status: 'IN_PROGRESS', // Backend status
        context: 'personal'
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockTask });

      // Call the service
      const result = await TaskService.getTask('123');

      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/tasks/123/');
      expect(result).toMatchObject({
        id: '123',
        title: 'Single Task',
        status: 'in_progress', // Mapped to frontend status
      });
    });
  });
}); 