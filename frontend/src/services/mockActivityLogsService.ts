// Mock activity logs service to provide fallback data when the API is unavailable

// Define the ActivityLog interface
export interface ActivityLog {
  id: string;
  user: string;
  user_id?: string;
  action: string;
  target: string;
  target_id?: string;
  details: string;
  timestamp: string;
  ip_address: string;
  status: 'success' | 'warning' | 'error';
}

// Generate a random IP address
const generateRandomIP = () => {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

// Generate mock activity logs
const generateMockLogs = (count: number): ActivityLog[] => {
  const users = ['Admin User', 'John Smith', 'Mary Johnson', 'Robert Williams', 'Lisa Brown'];
  const actions = ['login', 'logout', 'create', 'update', 'delete', 'view'];
  const targets = ['user', 'department', 'task', 'system', 'file', 'project'];
  const statuses: ('success' | 'warning' | 'error')[] = ['success', 'warning', 'error'];
  
  return Array.from({ length: count }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const target = targets[Math.floor(Math.random() * targets.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate a timestamp between now and 30 days ago
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString();
    
    return {
      id: `log-${i + 1}`,
      user,
      user_id: `user-${Math.floor(Math.random() * 10) + 1}`,
      action,
      target,
      target_id: `${target}-${Math.floor(Math.random() * 20) + 1}`,
      details: `${user} ${action}d a ${target}`,
      timestamp,
      ip_address: generateRandomIP(),
      status
    };
  });
};

// Create a pool of 100 mock logs
const mockLogsPool = generateMockLogs(100);

export const MockActivityLogsService = {
  // Get activity logs with pagination and filtering
  getLogs: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    action?: string;
    target?: string;
  }) => {
    console.log('[MockActivityLogsService] Getting mock activity logs with params:', params);
    
    const { page = 0, limit = 10, search, status, action, target } = params;
    
    // Apply filters
    let filteredLogs = [...mockLogsPool];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.user.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.target.toLowerCase().includes(searchLower)
      );
    }
    
    if (status && status !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.status === status);
    }
    
    if (action && action !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    
    if (target && target !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.target === target);
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply pagination
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    return {
      logs: paginatedLogs,
      total: filteredLogs.length,
      page,
      limit,
      totalPages: Math.ceil(filteredLogs.length / limit)
    };
  },
  
  // Clear logs (mock implementation)
  clearLogs: async () => {
    console.log('[MockActivityLogsService] Mock clearing logs');
    return { success: true, message: 'Logs cleared successfully' };
  },
  
  // Export logs (mock implementation)
  exportLogs: async (format: 'csv' | 'json') => {
    console.log(`[MockActivityLogsService] Mock exporting logs as ${format}`);
    return { 
      success: true, 
      message: `Logs exported successfully as ${format}`,
      downloadUrl: `#mock-download-${format}`
    };
  }
}; 