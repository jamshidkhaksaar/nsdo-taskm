import { User } from './user';

// Mock user data for development and testing
const mockUsers: User[] = [
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

// Mock user service implementation
export const MockUserService = {
  // Get all users
  getUsers: async (): Promise<User[]> => {
    console.log('[MockUserService] Returning mock users data');
    return [...mockUsers];
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    console.log('[MockUserService] Returning mock current user');
    return mockUsers[0]; // Return admin user as current user
  },

  // Get users by department
  getUsersByDepartment: async (departmentId: string): Promise<User[]> => {
    console.log(`[MockUserService] Returning mock users for department ${departmentId}`);
    return mockUsers.filter(user => user.department && user.department.id === departmentId);
  },

  // Create a user (just returns a mock response)
  createUser: async (user: Omit<User, 'id' | 'date_joined' | 'last_login'>): Promise<User> => {
    console.log('[MockUserService] Mock creating user:', user);
    return {
      ...user,
      id: `mock-${Date.now()}`,
      date_joined: new Date().toISOString(),
      last_login: null
    } as User;
  },

  // Update a user (just returns a mock response)
  updateUser: async (id: string, user: Partial<User>): Promise<User> => {
    console.log(`[MockUserService] Mock updating user ${id}:`, user);
    const existingUser = mockUsers.find(u => u.id === id);
    if (!existingUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    return { ...existingUser, ...user };
  },

  // Delete a user (no-op in mock)
  deleteUser: async (id: string): Promise<void> => {
    console.log(`[MockUserService] Mock deleting user ${id}`);
  },

  // Reset user password (no-op in mock)
  resetPassword: async (id: string, password: string): Promise<void> => {
    console.log(`[MockUserService] Mock resetting password for user ${id}`);
  },

  // Toggle user status (just returns a mock response)
  toggleUserStatus: async (id: string): Promise<User> => {
    console.log(`[MockUserService] Mock toggling status for user ${id}`);
    const existingUser = mockUsers.find(u => u.id === id);
    if (!existingUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    return { 
      ...existingUser, 
      status: existingUser.status === 'active' ? 'inactive' : 'active' 
    };
  },

  // Search users
  searchUsers: async (query: string): Promise<User[]> => {
    console.log(`[MockUserService] Mock searching users with query "${query}"`);
    const lowercaseQuery = query.toLowerCase();
    return mockUsers.filter(user => 
      user.username.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.first_name.toLowerCase().includes(lowercaseQuery) ||
      user.last_name.toLowerCase().includes(lowercaseQuery)
    );
  },

  // Get user by ID
  getUserById: async (id: string) => {
    console.log(`[MockUserService] Mock fetching user with ID: ${id}`);
    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return user;
  }
}; 