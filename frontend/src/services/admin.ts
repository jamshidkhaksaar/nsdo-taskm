import axios from '../utils/axios';

export const AdminService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      console.log('[AdminService] Fetching dashboard stats');
      const response = await axios.get('/admin/dashboard');
      return response.data;
    } catch (error: unknown) {
      console.error('[AdminService] Error fetching dashboard stats:', error);
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
      throw error;
    }
  },
  
  // Download backup
  downloadBackup: async (backupId: string) => {
    try {
      console.log(`[AdminService] Downloading backup ${backupId}`);
      const response = await axios.get(`/admin/backups/${backupId}/download`, {
        responseType: 'blob'
      });
      
      // Create file download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backupId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      return { success: true };
    } catch (error: unknown) {
      console.error(`[AdminService] Error downloading backup ${backupId}:`, error);
      throw error;
    }
  },
  
  // Get metrics
  getMetrics: async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    try {
      console.log(`[AdminService] Fetching metrics for period: ${period}`);
      const response = await axios.get(`/admin/metrics?period=${period}`);
      return response.data;
    } catch (error: unknown) {
      console.error(`[AdminService] Error fetching metrics for period ${period}:`, error);
      throw error;
    }
  },
  
  // Ban a user
  banUser: async (userId: string, reason: string) => {
    try {
      console.log(`[AdminService] Banning user ${userId} for reason: ${reason}`);
      const response = await axios.post(`/admin/users/${userId}/ban`, { reason });
      return response.data;
    } catch (error: unknown) {
      console.error(`[AdminService] Error banning user ${userId}:`, error);
      throw error;
    }
  },
  
  // Unban a user
  unbanUser: async (userId: string) => {
    try {
      console.log(`[AdminService] Unbanning user ${userId}`);
      const response = await axios.post(`/admin/users/${userId}/unban`);
      return response.data;
    } catch (error: unknown) {
      console.error(`[AdminService] Error unbanning user ${userId}:`, error);
      throw error;
    }
  },
  
  // Change user role
  changeUserRole: async (userId: string, role: string) => {
    try {
      console.log(`[AdminService] Changing role for user ${userId} to ${role}`);
      const response = await axios.patch(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error: unknown) {
      console.error(`[AdminService] Error changing role for user ${userId}:`, error);
      throw error;
    }
  }
}; 