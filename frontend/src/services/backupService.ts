import axios from '../utils/axios';


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
        const response = await axios.get(`backups/${id}/status`);
        return response.data;
      } catch (statusError: unknown) {
        console.warn(`[BackupService] Status endpoint failed, falling back to main endpoint: ${statusError}`);
        
        // If status endpoint fails, try the main backup endpoint
        const response = await axios.get(`backups/${id}`);
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
      const response = await axios.get('backups');
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
      const response = await axios.get(`backups/${id}`);
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
      const response = await axios.post('backups/create_backup', {
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
      const response = await axios.post(`backups/${id}/restore`);
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
      const response = await axios.delete(`backups/${id}`);
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
      const response = await axios.get(`backups/${id}/download`, {
        responseType: 'blob'
      });
      
      // Create a download link for the file
      const blob = new Blob([response.data], { type: 'application/sql' }); // Assuming SQL, adjust if other types are possible
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Try to get filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `backup_${id}.sql`; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+[^\"])"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up object URL
      
      return { success: true, message: 'Backup downloaded successfully' };
    } catch (error: unknown) {
      console.error(`[BackupService] Error downloading backup with ID ${id}:`, error);
      // Removed fallback download logic, just rethrow the error
      throw error;
    }
  },

  // NEW: Restore a backup from an uploaded file
  restoreBackupFromFile: async (file: File) => {
    try {
      console.log(`[BackupService] Restoring backup from file: ${file.name}`);
      const formData = new FormData();
      formData.append('file', file); // 'file' should match the field name expected by the backend

      // Make sure the endpoint matches what will be defined in the backend controller
      const response = await axios.post('backups/restore-from-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Optional: Add progress tracking if needed for large uploads
        // onUploadProgress: (progressEvent) => {
        //   const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        //   console.log(`Upload progress: ${percentCompleted}%`);
        // },
      });

      return response.data;
    } catch (error: unknown) {
      console.error(`[BackupService] Error restoring backup from file ${file.name}:`, error);
      throw error;
    }
  }
}; 