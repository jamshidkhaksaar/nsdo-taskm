import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority, DepartmentRef } from '../types/task';

// Helper to generate random dates within a range
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Create mock tasks with realistic data
export const mockTasks: Task[] = [
  {
    id: uuidv4(),
    title: "Complete project dashboard",
    description: "Implement all dashboard components and connect to the API",
    status: "in_progress",
    priority: "high",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: "1",
    assigned_to: ["2", "3"],
    is_private: false,
    department: { id: "1", name: "Engineering" }
  },
  {
    id: uuidv4(),
    title: "Create user documentation",
    description: "Write comprehensive user documentation for the new features",
    status: "pending",
    priority: "medium",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: "1",
    assigned_to: ["4"],
    is_private: false,
    department: { id: "2", name: "Documentation" }
  },
  {
    id: uuidv4(),
    title: "Review pull requests",
    description: "Review and approve pending pull requests for the sprint",
    status: "pending",
    priority: "high",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: "1",
    assigned_to: ["2"],
    is_private: true,
    department: null
  },
  {
    id: uuidv4(),
    title: "Fix login authentication bug",
    description: "Address the issue with token refresh and session management",
    status: "completed",
    priority: "high",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: "2",
    assigned_to: ["1"],
    is_private: false,
    department: { id: "1", name: "Engineering" }
  },
  {
    id: uuidv4(),
    title: "Prepare for weekly team meeting",
    description: "Create slides and agenda for the weekly team sync",
    status: "in_progress",
    priority: "medium",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: "3",
    assigned_to: ["3"],
    is_private: false,
    department: { id: "3", name: "Management" }
  }
];

// Mock users
export const mockUsers = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    first_name: "Admin",
    last_name: "User",
    role: "admin",
    status: "active",
    position: "System Administrator",
    last_login: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    department: { id: "1", name: "Engineering" }
  },
  {
    id: "2",
    username: "jsmith",
    email: "john.smith@example.com",
    first_name: "John",
    last_name: "Smith",
    role: "manager",
    status: "active",
    position: "Team Lead",
    last_login: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    department: { id: "1", name: "Engineering" }
  },
  {
    id: "3",
    username: "mdavis",
    email: "mary.davis@example.com",
    first_name: "Mary",
    last_name: "Davis",
    role: "manager",
    status: "active",
    position: "Project Manager",
    last_login: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    department: { id: "3", name: "Management" }
  },
  {
    id: "4",
    username: "alee",
    email: "alex.lee@example.com",
    first_name: "Alex",
    last_name: "Lee",
    role: "user",
    status: "active",
    position: "Technical Writer",
    last_login: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    department: { id: "2", name: "Documentation" }
  }
];

// Mock departments
export const mockDepartments = [
  {
    id: "1",
    name: "Engineering",
    description: "Software development and engineering team",
    head: {
      id: "2",
      username: "jsmith",
      first_name: "John",
      last_name: "Smith"
    },
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    members_count: 2,
    active_projects: 3,
    completion_rate: 75
  },
  {
    id: "2",
    name: "Documentation",
    description: "Technical documentation and user guides",
    head: {
      id: "4",
      username: "alee",
      first_name: "Alex",
      last_name: "Lee"
    },
    created_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    members_count: 1,
    active_projects: 2,
    completion_rate: 80
  },
  {
    id: "3",
    name: "Management",
    description: "Project and team management",
    head: {
      id: "3",
      username: "mdavis",
      first_name: "Mary",
      last_name: "Davis"
    },
    created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    members_count: 1,
    active_projects: 5,
    completion_rate: 65
  }
];

// Mock dashboard data
export const mockDashboardData = {
  stats: {
    users: mockUsers.length,
    departments: mockDepartments.length,
    tasks: mockTasks.length,
    activeUsers: mockUsers.filter(u => u.status === 'active').length,
    inactiveUsers: mockUsers.filter(u => u.status !== 'active').length,
    pendingTasks: mockTasks.filter(t => t.status === 'pending').length,
    inProgressTasks: mockTasks.filter(t => t.status === 'in_progress').length,
    completedTasks: mockTasks.filter(t => t.status === 'completed').length,
    upcomingTasks: mockTasks.filter(t => new Date(t.due_date) > new Date() && new Date(t.due_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length
  },
  department_stats: mockDepartments,
  recent_activities: [
    {
      id: uuidv4(),
      user: "Admin User",
      user_id: "1",
      action: "create",
      target: "task",
      target_id: mockTasks[0].id,
      details: "Created a new task: Complete project dashboard",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      ip_address: "192.168.1.1",
      status: "success"
    },
    {
      id: uuidv4(),
      user: "John Smith",
      user_id: "2",
      action: "update",
      target: "task",
      target_id: mockTasks[3].id,
      details: "Updated task status to Completed",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      ip_address: "192.168.1.2",
      status: "success"
    },
    {
      id: uuidv4(),
      user: "Mary Davis",
      user_id: "3",
      action: "create",
      target: "task",
      target_id: mockTasks[4].id,
      details: "Created a new task: Prepare for weekly team meeting",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      ip_address: "192.168.1.3",
      status: "success"
    },
    {
      id: uuidv4(),
      user: "Admin User",
      user_id: "1",
      action: "login",
      target: "system",
      details: "User logged in",
      timestamp: new Date().toISOString(),
      ip_address: "192.168.1.1",
      status: "success"
    }
  ]
};

// Simulates a delay to make mock data feel more realistic
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms)); 