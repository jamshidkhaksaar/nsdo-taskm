// Mock backup service to provide fallback data when the API is unavailable

// Backup interface
export interface Backup {
  id: string;
  name: string;
  timestamp: string;
  size: string;
  type: 'full' | 'partial';
  status: 'completed' | 'in_progress' | 'failed';
  created_by: string;
  notes: string;
  error_message: string;
}

// Backup options interface
export interface BackupOptions {
  type: 'full' | 'partial';
  location?: string;
  includeDatabases?: boolean;
  includeMedia?: boolean;
  includeSettings?: boolean;
  customPath?: string;
}

// Generate mock backups
const generateMockBackups = (): Backup[] => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  return [
    {
      id: 'backup-001',
      name: 'Daily Backup',
      timestamp: now.toISOString(),
      size: '42.5 MB',
      type: 'full',
      status: 'completed',
      created_by: 'admin',
      notes: 'Automated daily backup',
      error_message: ''
    },
    {
      id: 'backup-002',
      name: 'Pre-Update Backup',
      timestamp: yesterday.toISOString(),
      size: '41.2 MB',
      type: 'full',
      status: 'completed',
      created_by: 'admin',
      notes: 'Manual backup before system update',
      error_message: ''
    },
    {
      id: 'backup-003',
      name: 'Weekly Backup',
      timestamp: lastWeek.toISOString(),
      size: '40.8 MB',
      type: 'full',
      status: 'completed',
      created_by: 'system',
      notes: 'Automated weekly backup',
      error_message: ''
    },
    {
      id: 'backup-004',
      name: 'Database Only',
      timestamp: twoWeeksAgo.toISOString(),
      size: '12.3 MB',
      type: 'partial',
      status: 'completed',
      created_by: 'admin',
      notes: 'Database only backup',
      error_message: ''
    },
    {
      id: 'backup-005',
      name: 'Failed Backup',
      timestamp: twoWeeksAgo.toISOString(),
      size: '0 KB',
      type: 'full',
      status: 'failed',
      created_by: 'system',
      notes: 'Automated backup',
      error_message: 'Insufficient disk space'
    }
  ];
};

// Mock backups array
let mockBackups = generateMockBackups();

export const MockBackupService = {
  // Get all backups
  getBackups: async () => {
    console.log('[MockBackupService] Returning mock backups');
    return [...mockBackups];
  },
  
  // Get a specific backup by ID
  getBackup: async (id: string) => {
    console.log(`[MockBackupService] Getting mock backup with ID: ${id}`);
    const backup = mockBackups.find(b => b.id === id);
    if (!backup) {
      throw new Error('Backup not found');
    }
    return { ...backup };
  },
  
  // Create a new backup
  createBackup: async (options: BackupOptions) => {
    console.log('[MockBackupService] Creating mock backup with options:', options);
    
    const newBackup: Backup = {
      id: `backup-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      name: options.type === 'full' ? 'Full Backup' : 'Partial Backup',
      timestamp: new Date().toISOString(),
      size: `${Math.floor(Math.random() * 50) + 10}.${Math.floor(Math.random() * 10)} MB`,
      type: options.type,
      status: 'completed',
      created_by: 'admin',
      notes: `Manual ${options.type} backup`,
      error_message: ''
    };
    
    mockBackups.unshift(newBackup);
    return { ...newBackup };
  },
  
  // Restore from a backup
  restoreBackup: async (id: string) => {
    console.log(`[MockBackupService] Restoring from mock backup with ID: ${id}`);
    const backup = mockBackups.find(b => b.id === id);
    if (!backup) {
      throw new Error('Backup not found');
    }
    return { success: true, message: 'System restored successfully' };
  },
  
  // Delete a backup
  deleteBackup: async (id: string) => {
    console.log(`[MockBackupService] Deleting mock backup with ID: ${id}`);
    const index = mockBackups.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error('Backup not found');
    }
    mockBackups.splice(index, 1);
    return { success: true, message: 'Backup deleted successfully' };
  },
  
  // Download a backup
  downloadBackup: async (id: string) => {
    console.log(`[MockBackupService] Downloading mock backup with ID: ${id}`);
    const backup = mockBackups.find(b => b.id === id);
    if (!backup) {
      throw new Error('Backup not found');
    }
    
    // Create a mock blob that would represent a zip file
    const mockData = new Blob(['Mock backup data'], { type: 'application/zip' });
    return mockData;
  }
}; 