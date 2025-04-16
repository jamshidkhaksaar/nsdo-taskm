import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { login as loginService, logout as logoutService } from '../../services/auth';
import { ensureAuthToken } from '../../utils/axios';
import axiosInstance from '../../utils/axios';
import { AuthUser, AuthState } from '../../types/auth';

// Initialize state from localStorage
const token = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');
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
  refreshToken,
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
      
      // Store user data in localStorage for persistence
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
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
      await logoutService();
      return null;
    } catch (error) {
      return rejectWithValue('Logout failed. Please try again.');
    }
  }
);

// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: AuthUser; token: string; refreshToken?: string }>) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || state.refreshToken;
      state.isAuthenticated = true;
      
      // Update localStorage
      localStorage.setItem('access_token', token);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (axiosInstance && axiosInstance.defaults) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    },
    updateToken: (state, action: PayloadAction<{ token: string; refreshToken?: string }>) => {
      const { token, refreshToken } = action.payload;
      state.token = token;
      if (refreshToken) {
        state.refreshToken = refreshToken;
        localStorage.setItem('refresh_token', refreshToken);
      }
      
      // Update localStorage
      localStorage.setItem('access_token', token);
      
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
      state.refreshToken = null;
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
        
        // Convert user data to AuthUser type
        const userData = action.payload.user || null;
        let authUser: AuthUser | null = null;
        
        if (userData) {
          authUser = {
            ...userData,
            role: userData.role || 'user'
          } as AuthUser;
        }
        
        state.user = authUser;
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

export const { setCredentials, updateToken, logout, clearError } = authSlice.actions;

// Selector to get the current user
export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;

export default authSlice.reducer; 