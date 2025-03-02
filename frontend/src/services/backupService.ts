import axios from '../utils/axios';
import { AxiosError } from 'axios';
import { 
  Backup, 
  BackupOptions, 
  MockBackupService 
} from './mockBackupService';

// Flag to determine if we should use mock data
// In production, this should be false
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

export const BackupService = {
  // Get all backups
  getBackups: async () => {
    try {
      console.log('[BackupService] Fetching backups');
      const response = await axios.get('/api/backups/');
      return response.data;
    } catch (error: unknown) {
      console.error('[BackupService] Error fetching backups:', error);
      
      // Check if the error is a 404
      if (error instanceof AxiosError && error.response && error.response.status === 404) {
        console.error('[BackupService] Backups endpoint not found. This endpoint may not be implemented in the backend.');
        
        // Use mock data in development
        if (USE_MOCK_DATA) {
          console.log('[BackupService] Using mock backups as fallback');
          return MockBackupService.getBackups();
        }
      }
      
      // For other errors, use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[BackupService] Using mock backups as fallback due to error');
        return MockBackupService.getBackups();
      }
      
      throw error;
    }
  },
  
  // Get a specific backup by ID
  getBackup: async (id: string) => {
    try {
      console.log(`[BackupService] Fetching backup with ID: ${id}`);
      const response = await axios.get(`/api/backups/${id}/`);
      return response.data;
    } catch (error: unknown) {
      console.error(`[BackupService] Error fetching backup with ID ${id}:`, error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[BackupService] Using mock backup as fallback');
        return MockBackupService.getBackup(id);
      }
      
      throw error;
    }
  },
  
  // Create a new backup
  createBackup: async (options: BackupOptions) => {
    try {
      console.log('[BackupService] Creating backup with options:', options);
      
      // Create FormData
      const formData = new FormData();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      const response = await axios.post('/api/backups/create_backup/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: unknown) {
      console.error('[BackupService] Error creating backup:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[BackupService] Using mock create backup as fallback');
        return MockBackupService.createBackup(options);
      }
      
      throw error;
    }
  },
  
  // Restore from a backup
  restoreBackup: async (id: string) => {
    try {
      console.log(`[BackupService] Restoring from backup with ID: ${id}`);
      const response = await axios.post(`/api/backups/${id}/restore/`);
      return response.data;
    } catch (error: unknown) {
      console.error(`[BackupService] Error restoring from backup with ID ${id}:`, error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[BackupService] Using mock restore backup as fallback');
        return MockBackupService.restoreBackup(id);
      }
      
      throw error;
    }
  },
  
  // Delete a backup
  deleteBackup: async (id: string) => {
    try {
      console.log(`[BackupService] Deleting backup with ID: ${id}`);
      const response = await axios.delete(`/api/backups/${id}/`);
      return response.data;
    } catch (error: unknown) {
      console.error(`[BackupService] Error deleting backup with ID ${id}:`, error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[BackupService] Using mock delete backup as fallback');
        return MockBackupService.deleteBackup(id);
      }
      
      throw error;
    }
  },
  
  // Download a backup
  downloadBackup: async (id: string) => {
    try {
      console.log(`[BackupService] Downloading backup with ID: ${id}`);
      const response = await axios.get(`/api/backups/${id}/download/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: unknown) {
      console.error(`[BackupService] Error downloading backup with ID ${id}:`, error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[BackupService] Using mock download backup as fallback');
        return MockBackupService.downloadBackup(id);
      }
      
      throw error;
    }
  },
  
  // Check backup status
  checkBackupStatus: async (id: string) => {
    try {
      console.log(`[BackupService] Checking status of backup with ID: ${id}`);
      const response = await axios.get(`/api/backups/${id}/`);
      return response.data;
    } catch (error: unknown) {
      console.error(`[BackupService] Error checking status of backup with ID ${id}:`, error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[BackupService] Using mock backup status as fallback');
        return MockBackupService.getBackup(id);
      }
      
      throw error;
    }
  }
}; 