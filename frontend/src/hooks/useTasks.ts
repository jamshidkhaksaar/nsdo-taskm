import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TaskService } from '../services/task';
import { Task, TaskPriority, TaskStatus } from '../types/task';
import { RootState } from '../store';
import axios from '../utils/axios';
import { Department } from '../services/department';

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => void;
  fetchTasks: () => Promise<void>;
  deleteTask: (taskId: string) => Promise<boolean>;
  createTask: (taskData: any) => Promise<boolean>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  changeTaskStatus: (taskId: string, status: TaskStatus) => Promise<boolean>;
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  const { user } = useSelector((state: RootState) => state.auth);

  const refreshTasks = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user) {
        setTasks([]);
        return;
      }
      
      const response = await TaskService.getTasks();
      setTasks(response);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshTrigger]);

  const createTask = useCallback(async (taskData: any) => {
    try {
      await TaskService.createTask(taskData);
      refreshTasks();
      return true;
    } catch (err) {
      console.error('Error creating task:', err);
      return false;
    }
  }, [refreshTasks]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      await TaskService.updateTask(taskId, updates);
      refreshTasks();
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      return false;
    }
  }, [refreshTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await TaskService.deleteTask(taskId);
      refreshTasks();
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      return false;
    }
  }, [refreshTasks]);

  const changeTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      await TaskService.changeTaskStatus(taskId, status);
      refreshTasks();
      return true;
    } catch (err) {
      console.error('Error changing task status:', err);
      return false;
    }
  }, [refreshTasks]);

  return {
    tasks,
    loading: isLoading,
    error,
    refreshTasks,
    fetchTasks,
    deleteTask,
    createTask,
    updateTask,
    changeTaskStatus
  };
}; 