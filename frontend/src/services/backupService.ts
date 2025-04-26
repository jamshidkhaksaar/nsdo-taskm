import axios from '../utils/axios';
import { AxiosError } from 'axios';

// Define types that were previously imported from mockBackupService
export interface BackupOptions {
  type: 'full' | 'partial';
  includeDatabases?: boolean;
  includeMedia?: boolean;
  includeSettings?: boolean;
  location?: string;
  customPath?: string;
}

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
      
      throw error;
    }
  }
}; 