import axios from '../utils/axios';
import { CONFIG } from '../utils/config';
import { AxiosError } from 'axios';
import { MockAdminService } from './mockAdminService';

// Flag to determine if we should use mock data
// In production, this should be false
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

export const AdminService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      console.log('[AdminService] Fetching dashboard stats');
      const response = await axios.get('/admin/dashboard');
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error fetching dashboard stats:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock dashboard stats as fallback');
        return MockAdminService.getDashboardStats();
      }
      
      throw error;
    }
  },
  
  // Get all users (admin view)
  getUsers: async (search = '') => {
    try {
      console.log('[AdminService] Fetching users with search:', search);
      const response = await axios.get('/admin/users', {
        params: { search }
      });
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error fetching users:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock users as fallback');
        return MockAdminService.getUsers(search);
      }
      
      throw error;
    }
  },
  
  // Get all departments
  getDepartments: async () => {
    try {
      console.log('[AdminService] Fetching departments');
      const response = await axios.get('/admin/departments');
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error fetching departments:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock departments as fallback');
        return MockAdminService.getDepartments();
      }
      
      throw error;
    }
  },
  
  // Get all tasks
  getTasks: async () => {
    try {
      console.log('[AdminService] Fetching tasks');
      const response = await axios.get('/admin/tasks');
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error fetching tasks:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock tasks as fallback');
        return []; // No mock tasks defined yet
      }
      
      throw error;
    }
  },
  
  // Get system logs
  getLogs: async () => {
    try {
      console.log('[AdminService] Fetching logs');
      const response = await axios.get('/admin/logs');
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error fetching logs:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock logs as fallback');
        return MockAdminService.getLogs();
      }
      
      throw error;
    }
  },
  
  // Clear logs
  clearLogs: async () => {
    try {
      console.log('[AdminService] Clearing logs');
      const response = await axios.delete('/admin/logs');
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error clearing logs:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock clear logs as fallback');
        return MockAdminService.clearLogs();
      }
      
      throw error;
    }
  },
  
  // Get system settings
  getSettings: async () => {
    try {
      console.log('[AdminService] Fetching settings');
      const response = await axios.get('/admin/settings');
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error fetching settings:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock settings as fallback');
        return { 
          maintenance_mode: false,
          allow_registration: true,
          default_user_role: 'user',
          session_timeout: 30,
          password_policy: {
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_number: true,
            require_special: true
          }
        };
      }
      
      throw error;
    }
  },
  
  // Update system settings
  updateSettings: async (settings: any) => {
    try {
      console.log('[AdminService] Updating settings');
      const response = await axios.patch('/admin/settings', settings);
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error updating settings:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock update settings as fallback');
        return { 
          ...settings,
          updated_at: new Date().toISOString()
        };
      }
      
      throw error;
    }
  },
  
  // Create backup
  createBackup: async () => {
    try {
      console.log('[AdminService] Creating backup');
      const response = await axios.post('/admin/backup');
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error creating backup:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock create backup as fallback');
        return MockAdminService.createBackup();
      }
      
      throw error;
    }
  },
  
  // Get backups
  getBackups: async () => {
    try {
      console.log('[AdminService] Fetching backups');
      const response = await axios.get('/admin/backups');
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error fetching backups:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock backups as fallback');
        return MockAdminService.getBackups();
      }
      
      throw error;
    }
  },
  
  // Delete backup
  deleteBackup: async (backupId: string) => {
    try {
      console.log(`[AdminService] Deleting backup ${backupId}`);
      const response = await axios.delete(`/admin/backups/${backupId}`);
      return response.data;
    } catch (error: unknown) {
      console.error(`[AdminService] Error deleting backup ${backupId}:`, error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock delete backup as fallback');
        return MockAdminService.deleteBackup(backupId);
      }
      
      throw error;
    }
  },
  
  // Restore backup
  restoreBackup: async (backupId: string) => {
    try {
      console.log(`[AdminService] Restoring backup ${backupId}`);
      const response = await axios.post(`/admin/restore/${backupId}`);
      return response.data;
    } catch (error: unknown) {
      console.error(`[AdminService] Error restoring backup ${backupId}:`, error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock restore backup as fallback');
        return MockAdminService.restoreBackup(backupId);
      }
      
      throw error;
    }
  },
  
  // Get system health
  getHealth: async () => {
    try {
      console.log('[AdminService] Checking system health');
      const response = await axios.get('/admin/health');
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error checking system health:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[AdminService] Using mock health check as fallback');
        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          message: 'API is operational',
          database: {
            connected: true,
            message: 'Database connection successful',
            type: 'mysql',
            name: 'taskm_db'
          },
          environment: {
            nodeEnv: 'development'
          }
        };
      }
      
      throw error;
    }
  }
}; 