import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '../types/task';
import { MockTaskService } from '../services/mockTaskService';

export const useMockTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const refreshTasks = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedTasks = await MockTaskService.getTasks();
        setTasks(fetchedTasks);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to fetch tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [refreshTrigger]);

  const createTask = useCallback(async (taskData: any) => {
    try {
      await MockTaskService.createTask(taskData);
      refreshTasks();
      return true;
    } catch (err) {
      console.error('Error creating task:', err);
      return false;
    }
  }, [refreshTasks]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      await MockTaskService.updateTask(taskId, updates);
      refreshTasks();
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      return false;
    }
  }, [refreshTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await MockTaskService.deleteTask(taskId);
      refreshTasks();
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      return false;
    }
  }, [refreshTasks]);

  const changeTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      await MockTaskService.changeTaskStatus(taskId, status);
      refreshTasks();
      return true;
    } catch (err) {
      console.error('Error changing task status:', err);
      return false;
    }
  }, [refreshTasks]);

  return {
    tasks,
    loading,
    error,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
    changeTaskStatus
  };
}; 