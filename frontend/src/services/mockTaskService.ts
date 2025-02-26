import { Task, CreateTask, TaskPriority, TaskStatus } from '../types/task';
import { v4 as uuidv4 } from 'uuid';

// Mock data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the project',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    priority: 'high',
    status: 'pending',
    created_by: '1',
    assigned_to: ['1'],
    department: '1',
    updated_at: new Date().toISOString(),
    is_private: false,
  },
  {
    id: '2',
    title: 'Review pull requests',
    description: 'Review and merge pending pull requests',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    priority: 'medium',
    status: 'in_progress',
    created_by: '1',
    assigned_to: ['1', '2'],
    department: '1',
    updated_at: new Date().toISOString(),
    is_private: false,
  },
  {
    id: '3',
    title: 'Fix navigation bug',
    description: 'Fix the navigation bug in the mobile view',
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    priority: 'high',
    status: 'in_progress',
    created_by: '2',
    assigned_to: ['1'],
    department: '2',
    updated_at: new Date().toISOString(),
    is_private: false,
  },
  {
    id: '4',
    title: 'Update dependencies',
    description: 'Update all project dependencies to the latest versions',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    priority: 'low',
    status: 'pending',
    created_by: '1',
    assigned_to: ['2'],
    department: '1',
    updated_at: new Date().toISOString(),
    is_private: false,
  },
  {
    id: '5',
    title: 'Deploy to production',
    description: 'Deploy the latest changes to production',
    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (past due)
    priority: 'high',
    status: 'completed',
    created_by: '1',
    assigned_to: ['1', '2'],
    department: '1',
    updated_at: new Date().toISOString(),
    is_private: false,
  },
  {
    id: '6',
    title: 'Create user onboarding flow',
    description: 'Design and implement user onboarding flow',
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    priority: 'medium',
    status: 'pending',
    created_by: '2',
    assigned_to: ['1'],
    department: '3',
    updated_at: new Date().toISOString(),
    is_private: false,
  }
];

// Mock departments
const mockDepartments = [
  { id: '1', name: 'Engineering' },
  { id: '2', name: 'Design' },
  { id: '3', name: 'Marketing' }
];

// In-memory storage
let tasks = [...mockTasks];
const departments = [...mockDepartments];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MockTaskService = {
  // Get all tasks
  getTasks: async (): Promise<Task[]> => {
    await delay(300); // Simulate network delay
    return [...tasks];
  },

  // Get tasks by department
  getTasksByDepartment: async (departmentId: string | number): Promise<Task[]> => {
    await delay(300);
    return tasks.filter(task => task.department === departmentId);
  },

  // Get tasks assigned to user
  getAssignedTasks: async (userId: string): Promise<Task[]> => {
    await delay(300);
    return tasks.filter(task => task.assigned_to?.includes(userId));
  },

  // Get tasks created by user
  getCreatedTasks: async (userId: string): Promise<Task[]> => {
    await delay(300);
    return tasks.filter(task => task.created_by === userId);
  },

  // Create a new task
  createTask: async (task: CreateTask): Promise<Task> => {
    await delay(300);
    const newTask: Task = {
      id: uuidv4(),
      title: task.title,
      description: task.description || '',
      due_date: task.due_date,
      priority: (task.priority?.toLowerCase() as TaskPriority) || 'medium',
      status: (task.status as TaskStatus) || 'pending',
      created_by: task.created_by || '1',
      assigned_to: task.assigned_to || [],
      department: task.department,
      updated_at: new Date().toISOString(),
      is_private: task.is_private || false,
    };
    
    tasks.push(newTask);
    return newTask;
  },

  // Update a task
  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    await delay(300);
    
    const taskIndex = tasks.findIndex(t => String(t.id) === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    tasks[taskIndex] = updatedTask;
    return updatedTask;
  },

  // Delete a task
  deleteTask: async (taskId: string): Promise<void> => {
    await delay(300);
    tasks = tasks.filter(t => String(t.id) !== taskId);
  },

  // Assign a task to a user
  assignTask: async (taskId: string, userId: string): Promise<Task> => {
    await delay(300);
    
    const taskIndex = tasks.findIndex(t => String(t.id) === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    const task = tasks[taskIndex];
    const assignedTo = [...(task.assigned_to || [])];
    
    if (!assignedTo.includes(userId)) {
      assignedTo.push(userId);
    }
    
    const updatedTask = {
      ...task,
      assigned_to: assignedTo,
      updated_at: new Date().toISOString()
    };
    
    tasks[taskIndex] = updatedTask;
    return updatedTask;
  },

  // Change task status
  changeTaskStatus: async (taskId: string, status: TaskStatus): Promise<Task> => {
    await delay(300);
    
    const taskIndex = tasks.findIndex(t => String(t.id) === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    const updatedTask = {
      ...tasks[taskIndex],
      status,
      updated_at: new Date().toISOString()
    };
    
    tasks[taskIndex] = updatedTask;
    return updatedTask;
  },

  // Get all departments
  getDepartments: async () => {
    await delay(300);
    return [...departments];
  },

  // Get a single task by ID
  getTask: async (taskId: string): Promise<Task> => {
    await delay(300);
    
    const task = tasks.find(t => String(t.id) === taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    return { ...task };
  }
}; 