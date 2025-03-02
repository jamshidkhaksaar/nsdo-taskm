import { User } from './user';

// Mock admin users data
const mockAdminUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    department: {
      id: '1',
      name: 'Management'
    },
    position: 'System Administrator',
    status: 'active',
    date_joined: '2023-01-01T00:00:00Z',
    last_login: '2023-06-15T10:30:00Z'
  },
  {
    id: '2',
    username: 'jsmith',
    email: 'john.smith@example.com',
    first_name: 'John',
    last_name: 'Smith',
    role: 'user',
    department: {
      id: '2',
      name: 'Development'
    },
    position: 'Senior Developer',
    status: 'active',
    date_joined: '2023-02-15T00:00:00Z',
    last_login: '2023-06-14T16:45:00Z'
  },
  {
    id: '3',
    username: 'mjohnson',
    email: 'mary.johnson@example.com',
    first_name: 'Mary',
    last_name: 'Johnson',
    role: 'user',
    department: {
      id: '3',
      name: 'Marketing'
    },
    position: 'Marketing Specialist',
    status: 'active',
    date_joined: '2023-03-10T00:00:00Z',
    last_login: '2023-06-15T09:15:00Z'
  },
  {
    id: '4',
    username: 'rwilliams',
    email: 'robert.williams@example.com',
    first_name: 'Robert',
    last_name: 'Williams',
    role: 'user',
    department: {
      id: '2',
      name: 'Development'
    },
    position: 'Junior Developer',
    status: 'active',
    date_joined: '2023-04-05T00:00:00Z',
    last_login: '2023-06-14T14:20:00Z'
  },
  {
    id: '5',
    username: 'lbrown',
    email: 'lisa.brown@example.com',
    first_name: 'Lisa',
    last_name: 'Brown',
    role: 'user',
    department: {
      id: '4',
      name: 'HR'
    },
    position: 'HR Manager',
    status: 'inactive',
    date_joined: '2023-01-20T00:00:00Z',
    last_login: '2023-05-30T11:10:00Z'
  }
];

// Mock departments data
const mockDepartments = [
  { id: '1', name: 'Management' },
  { id: '2', name: 'Development' },
  { id: '3', name: 'Marketing' },
  { id: '4', name: 'HR' },
  { id: '5', name: 'Finance' }
];

// Mock dashboard stats
const mockDashboardStats = {
  stats: {
    users: 5,
    departments: 5,
    tasks: 15,
    activeUsers: 4,
    inactiveUsers: 1,
    pendingTasks: 5,
    inProgressTasks: 7,
    completedTasks: 3,
    upcomingTasks: 2
  },
  department_stats: [
    { id: '1', name: 'Management', tasks: 3, members: 1, completion_rate: 67 },
    { id: '2', name: 'Development', tasks: 5, members: 2, completion_rate: 40 },
    { id: '3', name: 'Marketing', tasks: 4, members: 1, completion_rate: 25 },
    { id: '4', name: 'HR', tasks: 2, members: 1, completion_rate: 50 },
    { id: '5', name: 'Finance', tasks: 1, members: 0, completion_rate: 0 }
  ],
  recent_activities: [
    {
      id: 'activity-1',
      user: 'Admin User',
      action: 'created',
      target: 'user',
      details: 'Admin User created a new user',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      status: 'success'
    },
    {
      id: 'activity-2',
      user: 'John Smith',
      action: 'updated',
      target: 'task',
      details: 'John Smith updated a task',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      status: 'warning'
    },
    {
      id: 'activity-3',
      user: 'Mary Johnson',
      action: 'completed',
      target: 'task',
      details: 'Mary Johnson completed a task',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
      status: 'success'
    },
    {
      id: 'activity-4',
      user: 'Admin User',
      action: 'deleted',
      target: 'department',
      details: 'Admin User deleted a department',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      status: 'error'
    },
    {
      id: 'activity-5',
      user: 'Robert Williams',
      action: 'created',
      target: 'task',
      details: 'Robert Williams created a new task',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      status: 'success'
    }
  ]
};

// Mock logs data
const mockLogs = Array.from({ length: 20 }, (_, i) => ({
  id: `log-${i + 1}`,
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * i).toISOString(),
  level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
  message: `This is a sample log message ${i + 1}`,
  source: ['system', 'user', 'api'][Math.floor(Math.random() * 3)],
  details: `Additional details for log ${i + 1}`
}));

// Mock admin service
export const MockAdminService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    console.log('[MockAdminService] Returning mock dashboard stats');
    return mockDashboardStats;
  },
  
  // Get all users (admin view)
  getUsers: async (search = '') => {
    console.log('[MockAdminService] Returning mock admin users');
    if (search) {
      const lowercaseSearch = search.toLowerCase();
      return mockAdminUsers.filter(user => 
        user.username.toLowerCase().includes(lowercaseSearch) ||
        user.email.toLowerCase().includes(lowercaseSearch) ||
        user.first_name.toLowerCase().includes(lowercaseSearch) ||
        user.last_name.toLowerCase().includes(lowercaseSearch)
      );
    }
    return [...mockAdminUsers];
  },
  
  // Get all departments
  getDepartments: async () => {
    console.log('[MockAdminService] Returning mock departments');
    return [...mockDepartments];
  },
  
  // Get system logs
  getLogs: async () => {
    console.log('[MockAdminService] Returning mock logs');
    return [...mockLogs];
  },
  
  // Clear logs
  clearLogs: async () => {
    console.log('[MockAdminService] Mock clearing logs');
    return { success: true, message: 'Logs cleared successfully' };
  },
  
  // Create backup
  createBackup: async () => {
    console.log('[MockAdminService] Mock creating backup');
    return { 
      id: `backup-${Date.now()}`,
      timestamp: new Date().toISOString(),
      size: '2.4 MB',
      status: 'completed'
    };
  },
  
  // Get backups
  getBackups: async () => {
    console.log('[MockAdminService] Returning mock backups');
    return Array.from({ length: 5 }, (_, i) => ({
      id: `backup-${i + 1}`,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * i).toISOString(),
      size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
      status: 'completed'
    }));
  },
  
  // Delete backup
  deleteBackup: async (backupId: string) => {
    console.log(`[MockAdminService] Mock deleting backup ${backupId}`);
    return { success: true, message: 'Backup deleted successfully' };
  },
  
  // Restore backup
  restoreBackup: async (backupId: string) => {
    console.log(`[MockAdminService] Mock restoring backup ${backupId}`);
    return { success: true, message: 'Backup restored successfully' };
  }
}; 