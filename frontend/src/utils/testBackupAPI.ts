import axios from 'axios';

// This is a utility function for directly testing API endpoints without going through the regular service
export const testBackupApi = async () => {
  try {
    console.log('Testing backup API endpoints directly');
    
    // Try to get all backups
    try {
      const getAll = await axios.get('http://localhost:3001/api/backups');
      console.log('Get all backups:', getAll.data);
    } catch (error) {
      console.error('Error getting all backups:', error);
    }
    
    // Try to get a backup by ID
    try {
      const backupId = 'backup-001';
      const getOne = await axios.get(`http://localhost:3001/api/backups/${backupId}`);
      console.log(`Get backup ${backupId}:`, getOne.data);
    } catch (error) {
      console.error('Error getting one backup:', error);
    }
    
    // Try to get backup status
    try {
      const backupId = 'backup-001';
      const getStatus = await axios.get(`http://localhost:3001/api/backups/${backupId}/status`);
      console.log(`Get backup status ${backupId}:`, getStatus.data);
    } catch (error) {
      console.error('Error getting backup status:', error);
    }
    
    // Try to create a new backup
    try {
      const createResponse = await axios.post('http://localhost:3001/api/backups/create_backup', {
        type: 'full',
        includeDatabases: true,
        includeMedia: false,
        includeSettings: false
      });
      console.log('Create backup result:', createResponse.data);
      
      if (createResponse.data && createResponse.data.id) {
        // Check the status of the new backup
        const newBackupId = createResponse.data.id;
        setTimeout(async () => {
          try {
            const newStatus = await axios.get(`http://localhost:3001/api/backups/${newBackupId}/status`);
            console.log(`New backup ${newBackupId} status:`, newStatus.data);
          } catch (e) {
            console.error(`Error checking new backup ${newBackupId} status:`, e);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
    }
    
    return 'API tests completed - check console for results';
  } catch (error) {
    console.error('Error testing backup API:', error);
    return 'API tests failed - check console for errors';
  }
};

// Export a function to test just a single endpoint
export const testBackupStatusEndpoint = async (backupId: string) => {
  try {
    console.log(`Testing backup status for ${backupId}`);
    
    // Try direct access to status endpoint
    try {
      const statusResponse = await axios.get(`http://localhost:3001/api/backups/${backupId}/status`);
      console.log(`Status endpoint for ${backupId}:`, statusResponse.data);
      return statusResponse.data;
    } catch (statusError) {
      console.error('Status endpoint error:', statusError);
      
      // Try to get the backup itself as fallback
      try {
        const backupResponse = await axios.get(`http://localhost:3001/api/backups/${backupId}`);
        console.log(`Backup endpoint for ${backupId}:`, backupResponse.data);
        return backupResponse.data;
      } catch (backupError) {
        console.error('Backup endpoint error:', backupError);
        throw backupError;
      }
    }
  } catch (error) {
    console.error('Error testing backup status:', error);
    throw error;
  }
}; 