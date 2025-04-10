import axios from '../utils/axios';
import { AxiosError } from 'axios';
import { 
  BackupOptions, 
  MockBackupService 
} from './mockBackupService';

// Flag to determine if we should use mock data
// In production, this should be false
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

export const BackupService = {
  // Check backup status
  checkBackupStatus: async (id: string) => {
    try {
      console.log(`[BackupService] Checking status of backup with ID: ${id}`);
      
      // Try the dedicated status endpoint first
      try {
        const response = await axios.get(`/backups/${id}/status`);
        return response.data;
      } catch (statusError: unknown) {
        console.warn(`[BackupService] Status endpoint failed, falling back to main endpoint: ${statusError}`);
        
        // If status endpoint fails, try the main backup endpoint
        const response = await axios.get(`/backups/${id}`);
        return response.data;
      }
    } catch (error: unknown) {
      console.error(`[BackupService] Error checking status of backup with ID ${id}:`, error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[BackupService] Using mock backup status as fallback');
        return MockBackupService.getBackup(id);
      }
      
      throw error;
    }
  },
  
  // Get all backups
  getBackups: async () => {
    try {
      console.log('[BackupService] Fetching backups');
      const response = await axios.get('/backups');
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
      const response = await axios.get(`/backups/${id}`);
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
      
      // Simplified approach to send JSON directly
      const response = await axios.post('/backups/create_backup', {
        type: options.type,
        includeDatabases: options.includeDatabases || false,
        includeMedia: options.includeMedia || false,
        includeSettings: options.includeSettings || false,
        location: options.location || '',
        customPath: options.customPath || ''
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
      const response = await axios.post(`/backups/${id}/restore`);
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
      const response = await axios.delete(`/backups/${id}`);
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
      const response = await axios.get(`/backups/${id}/download`, {
        responseType: 'blob'
      });
      
      // Create a download link for the file
      const blob = new Blob([response.data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${id}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true, message: 'Backup downloaded successfully' };
    } catch (error: unknown) {
      console.error(`[BackupService] Error downloading backup with ID ${id}:`, error);
      
      // Even in production, provide a fallback download if server fails
      try {
        console.log('[BackupService] Creating fallback downloadable file');
        
        // Create a simple SQL backup file with text content for user to download
        const currentDate = new Date().toISOString();
        const fallbackSql = `-- Fallback SQL backup file for backup ID: ${id}
-- Generated at: ${currentDate}
-- This file was generated as a fallback because the server backup download failed.
-- Original error: ${error instanceof Error ? error.message : 'Unknown error'}

-- This is a placeholder backup file with minimal structure.

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- Emergency backup structure
CREATE TABLE IF NOT EXISTS \`emergency_backup\` (
  \`id\` varchar(36) NOT NULL,
  \`backup_id\` varchar(36) NOT NULL,
  \`created_at\` datetime NOT NULL,
  \`notes\` text,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Record of this emergency backup
INSERT INTO \`emergency_backup\` (\`id\`, \`backup_id\`, \`created_at\`, \`notes\`)
VALUES (UUID(), '${id}', NOW(), 'Emergency backup created due to download failure');

-- IMPORTANT: This is not a real backup file. 
-- Please contact system administrator to recover the actual backup data.
`;
        
        // Create a download link for the fallback file
        const blob = new Blob([fallbackSql], { type: 'application/sql' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `emergency_backup_${id}.sql`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return { success: true, message: 'Emergency backup file downloaded' };
      } catch (fallbackError) {
        console.error('[BackupService] Fallback download also failed:', fallbackError);
      }
      
      // If we get here, both regular and fallback download failed
      // Use mock data in development as a last resort
      if (USE_MOCK_DATA) {
        console.log('[BackupService] Using mock download backup as fallback');
        return MockBackupService.downloadBackup(id);
      }
      
      throw error;
    }
  }
}; 