import axios from '../utils/axios';
import { AxiosError } from 'axios';

// Define types that were previously imported from mockActivityLogsService
export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  target: string;
  targetId: string;
  details: string;
  ip: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
}

export const ActivityLogsService = {
  // Get activity logs with pagination and filtering
  getLogs: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    action?: string;
    target?: string;
  }) => {
    try {
      console.log('[ActivityLogsService] Fetching activity logs with params:', params);
      const response = await axios.get('/activity-logs/', { params });
      return response.data;
    } catch (error: unknown) {
      console.error('[ActivityLogsService] Error fetching activity logs:', error);
      
      // Check if the error is a 404
      if (error instanceof AxiosError && error.response && error.response.status === 404) {
        console.error('[ActivityLogsService] Activity logs endpoint not found. This endpoint may not be implemented in the backend.');
        
        // Return empty logs instead of throwing
        return { logs: [], total: 0, page: params.page || 0, limit: params.limit || 10, totalPages: 0 };
      }
      
      throw error;
    }
  },
  
  // Clear logs
  clearLogs: async () => {
    try {
      console.log('[ActivityLogsService] Clearing activity logs');
      const response = await axios.delete('/activity-logs/');
      return response.data;
    } catch (error: unknown) {
      console.error('[ActivityLogsService] Error clearing activity logs:', error);
      throw error;
    }
  },
  
  // Export logs
  exportLogs: async (format: 'csv' | 'json') => {
    try {
      console.log(`[ActivityLogsService] Exporting activity logs as ${format}`);
      const response = await axios.get(`/activity-logs/export?format=${format}`);
      return response.data;
    } catch (error: unknown) {
      console.error(`[ActivityLogsService] Error exporting activity logs as ${format}:`, error);
      throw error;
    }
  }
}; 