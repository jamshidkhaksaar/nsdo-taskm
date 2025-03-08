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
    
    // Create a mock blob that represents the correct file type
    const isDatabase = backup.name.toLowerCase().includes('mysql') || 
                       backup.notes.toLowerCase().includes('database');
    
    let mockContent = '';
    
    if (isDatabase) {
      // Create a mock SQL dump
      mockContent = `-- Mock MySQL database dump
-- Host: localhost    Database: taskmanager
-- ------------------------------------------------------
-- Server version   5.7.38

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table \`users\`
--

DROP TABLE IF EXISTS \`users\`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE \`users\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`username\` varchar(255) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`password\` varchar(255) NOT NULL,
  \`role\` enum('ADMIN','USER','MANAGER') NOT NULL DEFAULT 'USER',
  \`isActive\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` datetime NOT NULL,
  \`updatedAt\` datetime NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`username\` (\`username\`),
  UNIQUE KEY \`email\` (\`email\`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Dump completed
`;
      return new Blob([mockContent], { type: 'application/sql' });
    } else {
      // Create a mock zip file
      return new Blob(['Mock backup data'], { type: 'application/zip' });
    }
  }
}; 