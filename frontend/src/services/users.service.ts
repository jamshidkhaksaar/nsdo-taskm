import axios from '../utils/axios'; // Assuming configured axios instance
import { User } from '../types';
import { Page, PageOptions } from '../types/page'; // Import frontend Page and PageOptions

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
const USERS_API_URL = `${API_URL}/users`;

// This function now handles both fetching all users (with pagination) and searching users.
export const getUsers = async (options?: PageOptions): Promise<Page<User>> => {
  try {
    console.log(`[User Service] Fetching users from API with options: ${JSON.stringify(options)}`);
    
    // Construct query parameters
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.take) params.append('take', options.take.toString());
    if (options?.order) params.append('order', options.order);
    if (options?.q) params.append('q', options.q);

    const fullRequestUrl = `${USERS_API_URL}${params.toString() ? '?' + params.toString() : ''}`;
    console.log(`[User Service] EXACT Request URL: ${fullRequestUrl}`);

    const response = await axios.get<Page<User>>(`${USERS_API_URL}`, { params });
    // Backend should return PageDto<User> which matches Page<User> structure
    return response.data;
  } catch (error: any) {
    console.error('Error fetching users:', error);
    let errorMessage = 'Failed to fetch users. Please check network or contact support.';
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = Array.isArray(error.response.data.message) 
        ? error.response.data.message.join(', ') 
        : error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

// The old getUsers (if named differently) or searchUsers function is no longer needed
// as the new getUsers handles search via the 'q' option.

// Example of how other user-specific service calls might look (for context, not for this change)
/*
export const getUserById = async (id: string): Promise<User> => {
  // ... implementation ...
};

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  // ... implementation ...
};

export const deleteUser = async (id: string): Promise<void> => {
  // ... implementation ...
};
*/ 