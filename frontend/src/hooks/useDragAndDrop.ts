import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '../types/task';
import { TaskService } from '../services/task';

export const useTaskStatusManager = (initialTasks: Task[]) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  // Update tasks when initialTasks change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Group tasks by status
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const cancelledTasks = tasks.filter(task => task.status === 'cancelled');

  // Handle task status change
  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    // Find the task that is being updated
    const task = tasks.find(t => String(t.id) === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return false;
    }

    // If status hasn't changed, no need to update
    if (newStatus === task.status) {
      return true;
    }

    // Set loading state for this task
    setIsLoading(prev => ({ ...prev, [taskId]: true }));

    // Update the task locally first for immediate UI feedback
    const updatedTasks = tasks.map(t => 
      String(t.id) === taskId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    try {
      // Update the task on the server
      await TaskService.updateTask(task.id, { status: newStatus });
      return true;
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Revert to original tasks if the update fails
      setTasks(tasks);
      return false;
    } finally {
      // Clear loading state
      setIsLoading(prev => ({ ...prev, [taskId]: false }));
    }
  }, [tasks]);

  return {
    tasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    cancelledTasks,
    handleStatusChange,
    isLoading
  };
}; 