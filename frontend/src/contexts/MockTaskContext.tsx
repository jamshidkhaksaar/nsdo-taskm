import React, { createContext, useContext, ReactNode } from 'react';
import { useMockTasks } from '../hooks/useMockTasks';
import { Task, TaskStatus } from '../types/task';

// Define the context type
interface MockTaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => void;
  createTask: (taskData: any) => Promise<boolean>;
  updateTask: (taskId: string, taskData: Partial<Task>) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  changeTaskStatus: (taskId: string, status: TaskStatus) => Promise<boolean>;
}

// Create the context with a default value
const MockTaskContext = createContext<MockTaskContextType | undefined>(undefined);

// Create a provider component
export const MockTaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mockTasksHook = useMockTasks();
  
  return (
    <MockTaskContext.Provider value={mockTasksHook}>
      {children}
    </MockTaskContext.Provider>
  );
};

// Create a custom hook to use the context
export const useMockTaskContext = () => {
  const context = useContext(MockTaskContext);
  if (context === undefined) {
    throw new Error('useMockTaskContext must be used within a MockTaskProvider');
  }
  return context;
}; 