import axios from '../utils/axios';
import { CONFIG } from '../utils/config';
import { AxiosError } from 'axios';
import { ActivityLog, MockActivityLogsService } from './mockActivityLogsService';

// Flag to determine if we should use mock data
// In production, this should be false
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

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
      const response = await axios.get('/api/activity-logs/', { params });
      return response.data;
    } catch (error: unknown) {
      console.error('[ActivityLogsService] Error fetching activity logs:', error);
      
      // Check if the error is a 404
      if (error instanceof AxiosError && error.response && error.response.status === 404) {
        console.error('[ActivityLogsService] Activity logs endpoint not found. This endpoint may not be implemented in the backend.');
        
        // Use mock data in development
        if (USE_MOCK_DATA) {
          console.log('[ActivityLogsService] Using mock activity logs as fallback');
          return MockActivityLogsService.getLogs(params);
        }
        
        // Return empty logs instead of throwing
        return { logs: [], total: 0, page: params.page || 0, limit: params.limit || 10, totalPages: 0 };
      }
      
      // For other errors, use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[ActivityLogsService] Using mock activity logs as fallback due to error');
        return MockActivityLogsService.getLogs(params);
      }
      
      throw error;
    }
  },
  
  // Clear logs
  clearLogs: async () => {
    try {
      console.log('[ActivityLogsService] Clearing activity logs');
      const response = await axios.delete('/api/activity-logs/');
      return response.data;
    } catch (error: unknown) {
      console.error('[ActivityLogsService] Error clearing activity logs:', error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[ActivityLogsService] Using mock clear logs as fallback');
        return MockActivityLogsService.clearLogs();
      }
      
      throw error;
    }
  },
  
  // Export logs
  exportLogs: async (format: 'csv' | 'json') => {
    try {
      console.log(`[ActivityLogsService] Exporting activity logs as ${format}`);
      const response = await axios.get(`/api/activity-logs/export?format=${format}`);
      return response.data;
    } catch (error: unknown) {
      console.error(`[ActivityLogsService] Error exporting activity logs as ${format}:`, error);
      
      // Use mock data in development
      if (USE_MOCK_DATA) {
        console.log('[ActivityLogsService] Using mock export logs as fallback');
        return MockActivityLogsService.exportLogs(format);
      }
      
      throw error;
    }
  }
}; 