import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TaskService } from '../services/task';
import { Task, TaskPriority } from '../types/task';
import { RootState } from '../store';
import axios from '../utils/axios';
import { Department } from '../services/department';

interface UseTasksReturn {
  tasks: Task[];
  assignedToMeTasks: Task[];
  assignedByMeTasks: Task[];
  departments: Department[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignedToMeTasks, setAssignedToMeTasks] = useState<Task[]>([]);
  const [assignedByMeTasks, setAssignedByMeTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useSelector((state: RootState) => state.auth);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch tasks
      const response = await TaskService.getTasks();
      
      // Normalize task data
      const newTasks = response.map(task => ({
        ...task,
        priority: (task.priority?.toLowerCase() as TaskPriority) || 'medium'
      }));
      
      setTasks(newTasks);
      
      // Fetch departments for reference
      try {
        const departmentsResponse = await axios.get('/api/departments/');
        setDepartments(departmentsResponse.data);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
      
      // Filter tasks for assigned to me and assigned by me
      if (user) {
        // Tasks assigned to the current user
        const assignedToMe = newTasks.filter(task => 
          task.assigned_to?.includes(user.id.toString())
        );
        setAssignedToMeTasks(assignedToMe);
        
        // Tasks created by current user and assigned to users or departments
        const createdByUserTasks = newTasks.filter(task => 
          task.created_by === user.id.toString()
        );
        
        // Filter tasks that have assignments (to users or departments)
        const tasksWithAssignments = createdByUserTasks.filter(task => {
          const hasAssignedUsers = Array.isArray(task.assigned_to) && task.assigned_to.length > 0;
          const hasAssignedDepartment = Boolean(task.department);
          return hasAssignedUsers || hasAssignedDepartment;
        });
        
        setAssignedByMeTasks(tasksWithAssignments);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setError(null);
      await TaskService.deleteTask(taskId);
      await fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  }, [fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    assignedToMeTasks,
    assignedByMeTasks,
    departments,
    isLoading,
    error,
    fetchTasks,
    deleteTask
  };
}; 