import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { login as loginService, logout as logoutService } from '../../services/auth';
import { ensureAuthToken } from '../../utils/axios';
import axiosInstance from '../../utils/axios';

// Define types
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Initialize state from localStorage
const token = localStorage.getItem('access_token');
const userStr = localStorage.getItem('user');
let user = null;

try {
  if (userStr) {
    user = JSON.parse(userStr);
  }
} catch (error) {
  console.error('Error parsing user from localStorage:', error);
  localStorage.removeItem('user');
}

// Set token in axios headers
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  if (axiosInstance && axiosInstance.defaults) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

const initialState: AuthState = {
  isAuthenticated: !!token,
  user,
  token,
  loading: false,
  error: null,
};

// Async thunks
export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await loginService(username, password);
      
      if (!response.success) {
        return rejectWithValue(response.message || 'Login failed');
      }
      
      // Ensure token is set in axios
      ensureAuthToken();
      
      return {
        user: response.user,
        token: response.accessToken,
      };
    } catch (error) {
      return rejectWithValue('Login failed. Please check your credentials and try again.');
    }
  }
);

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await logoutService();
      
      if (!response.success) {
        return rejectWithValue(response.message || 'Logout failed');
      }
      
      return null;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      
      // Update localStorage
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (axiosInstance && axiosInstance.defaults) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    },
    logout: (state) => {
      // Clear state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Clear axios headers
      delete axios.defaults.headers.common['Authorization'];
      if (axiosInstance && axiosInstance.defaults) {
        delete axiosInstance.defaults.headers.common['Authorization'];
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || null;
        state.token = action.payload.token || null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Login failed';
      })
      // Logout cases
      .addCase(logoutAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Logout failed';
      });
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;

export default authSlice.reducer; 