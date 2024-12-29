import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  FormGroup,
  FormControlLabel,
  Switch,
  TextField,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import BackupIcon from '@mui/icons-material/Backup';
import AdminLayout from '../../layouts/AdminLayout';
import axios from '../../utils/axios';

interface Backup {
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

// Add interface for snackbar state
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// Add new interfaces
interface BackupOptions {
  type: 'full' | 'partial';
  location?: string;
  includeDatabases?: boolean;
  includeMedia?: boolean;
  includeSettings?: boolean;
  customPath?: string;
}

async function showDirectoryPicker(): Promise<string | null> {
  try {
    // Create the backup directory path
    const backupDirName = 'TaskManager_Backups';
    
    // Check if we're on Windows
    if (navigator.platform.toLowerCase().includes('win')) {
      // Use Public Documents folder for Windows
      return `C:\\Users\\Public\\Documents\\${backupDirName}`;
    } else {
      // Use home directory for Unix/Linux
      return `/home/${process.env.USER || 'user'}/${backupDirName}`;
    }
  } catch (error) {
    console.error('Error in directory picker:', error);
    return null;
  }
}

const BackupRestore: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  // Update snackbar state type
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  // Add backup type selection state
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  // Add states for backup options
  const [backupOptions, setBackupOptions] = useState<BackupOptions>({
    type: 'full',
    includeDatabases: true,
    includeMedia: true,
    includeSettings: true,
    customPath: ''
  });
  // Add OS detection
  const [os, setOs] = useState<'windows' | 'unix'>('windows');

  useEffect(() => {
    fetchBackups();
  }, []);

  useEffect(() => {
    // Detect OS
    const isWindows = navigator.platform.toLowerCase().includes('win');
    setOs(isWindows ? 'windows' : 'unix');
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await axios.get('/api/backups/');
      setBackups(response.data);
    } catch (error) {
      console.error('Error fetching backups:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch backups',
        severity: 'error'
      });
    }
  };

  const handleCreateBackup = async (options: BackupOptions) => {
    try {
      setIsBackupInProgress(true);
      setBackupProgress(0);
      setBackupDialogOpen(false);

      console.log('Sending backup request with options:', options);

      // Create FormData
      const formData = new FormData();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      const response = await axios.post('/api/backups/create_backup/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Backup creation response:', response.data);

      // Start polling for backup progress
      const pollInterval = setInterval(async () => {
        try {
          const pollResponse = await axios.get(`/api/backups/${response.data.backup.id}/`);
          const backup = pollResponse.data;

          if (backup.status === 'completed') {
            clearInterval(pollInterval);
            setIsBackupInProgress(false);
            await fetchBackups();
            setSnackbar({
              open: true,
              message: 'Backup completed successfully',
              severity: 'success'
            });
          } else if (backup.status === 'failed') {
            clearInterval(pollInterval);
            setIsBackupInProgress(false);
            setSnackbar({
              open: true,
              message: `Backup failed: ${backup.error_message}`,
              severity: 'error'
            });
          } else {
            // Update progress
            setBackupProgress((prev) => Math.min(prev + 10, 90));
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsBackupInProgress(false);
          console.error('Error polling backup status:', error);
          setSnackbar({
            open: true,
            message: 'Failed to check backup status',
            severity: 'error'
          });
        }
      }, 1000);

    } catch (error: any) {
      console.error('Error creating backup:', error);
      setIsBackupInProgress(false);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to create backup',
        severity: 'error'
      });
    }
  };

  const handleRestore = async (backup: Backup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (selectedBackup) {
      try {
        await axios.post(`/api/backups/${selectedBackup.id}/restore/`);
        setSnackbar({
          open: true,
          message: 'System restored successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error restoring backup:', error);
        setSnackbar({
          open: true,
          message: 'Failed to restore system',
          severity: 'error'
        });
      }
    }
    setRestoreDialogOpen(false);
  };

  const handleDelete = async (backupId: string) => {
    try {
      await axios.delete(`/api/backups/${backupId}/`);
      await fetchBackups();
      setSnackbar({
        open: true,
        message: 'Backup deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting backup:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete backup',
        severity: 'error'
      });
    }
  };

  const handleDownload = async (backup: Backup) => {
    try {
      const response = await axios.get(`/api/backups/${backup.id}/download/`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${backup.name}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download backup',
        severity: 'error'
      });
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#fff' }}>
          Backup & Restore
        </Typography>
        <Button
          variant="contained"
          startIcon={<BackupIcon />}
          onClick={() => setBackupDialogOpen(true)}
          disabled={isBackupInProgress}
          sx={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          Create New Backup
        </Button>
      </Box>

      {isBackupInProgress && (
        <Card sx={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          mb: 3,
        }}>
          <CardContent>
            <Typography sx={{ color: '#fff', mb: 1 }}>
              Backup in progress... {backupProgress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={backupProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4CAF50',
                },
              }}
            />
          </CardContent>
        </Card>
      )}

      <TableContainer component={Card} sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#fff' }}>Backup Name</TableCell>
              <TableCell sx={{ color: '#fff' }}>Date & Time</TableCell>
              <TableCell sx={{ color: '#fff' }}>Size</TableCell>
              <TableCell sx={{ color: '#fff' }}>Type</TableCell>
              <TableCell sx={{ color: '#fff' }}>Status</TableCell>
              <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {backups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell sx={{ color: '#fff' }}>{backup.name}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{backup.timestamp}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{backup.size}</TableCell>
                <TableCell>
                  <Chip
                    label={backup.type}
                    size="small"
                    color={backup.type === 'full' ? 'primary' : 'secondary'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={backup.status}
                    size="small"
                    color={
                      backup.status === 'completed' ? 'success' :
                      backup.status === 'in_progress' ? 'warning' : 'error'
                    }
                    title={backup.status === 'failed' ? backup.error_message : undefined}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleRestore(backup)}
                    sx={{ color: '#fff' }}
                    title="Restore from this backup"
                  >
                    <RestoreIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDownload(backup)}
                    sx={{ color: '#fff' }}
                    title="Download backup"
                    disabled={backup.status !== 'completed'}
                  >
                    <CloudDownloadIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(backup.id)}
                    sx={{ color: '#fff' }}
                    title="Delete backup"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            minWidth: '400px',
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Confirm Restore</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#fff' }}>
            Are you sure you want to restore the system to this backup point? This action cannot be undone.
            {selectedBackup && (
              <Box sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                <Typography variant="body2">
                  Backup: {selectedBackup.name}
                </Typography>
                <Typography variant="body2">
                  Created: {selectedBackup.timestamp}
                </Typography>
                <Typography variant="body2">
                  Type: {selectedBackup.type}
                </Typography>
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRestoreDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmRestore} 
            variant="contained" 
            color="primary"
            sx={{
              background: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={backupDialogOpen}
        onClose={() => setBackupDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            minWidth: '500px',
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Create New Backup</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ color: '#fff', mb: 2 }}>Backup Type:</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={backupOptions.type === 'full' ? 'contained' : 'outlined'}
                onClick={() => setBackupOptions({ ...backupOptions, type: 'full' })}
                sx={{ flex: 1 }}
              >
                Full Backup
              </Button>
              <Button
                variant={backupOptions.type === 'partial' ? 'contained' : 'outlined'}
                onClick={() => setBackupOptions({ ...backupOptions, type: 'partial' })}
                sx={{ flex: 1 }}
              >
                Partial Backup
              </Button>
            </Box>
          </Box>

          {backupOptions.type === 'partial' && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ color: '#fff', mb: 2 }}>Select Components:</Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={backupOptions.includeDatabases}
                      onChange={(e) => setBackupOptions({
                        ...backupOptions,
                        includeDatabases: e.target.checked
                      })}
                    />
                  }
                  label="Database"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={backupOptions.includeMedia}
                      onChange={(e) => setBackupOptions({
                        ...backupOptions,
                        includeMedia: e.target.checked
                      })}
                    />
                  }
                  label="Media Files"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={backupOptions.includeSettings}
                      onChange={(e) => setBackupOptions({
                        ...backupOptions,
                        includeSettings: e.target.checked
                      })}
                    />
                  }
                  label="System Settings"
                />
              </FormGroup>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ color: '#fff', mb: 1 }}>Backup Location:</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                value={backupOptions.customPath}
                onChange={(e) => setBackupOptions({
                  ...backupOptions,
                  customPath: e.target.value
                })}
                placeholder="Enter backup location"
                helperText="Default location will be used if left empty"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                  },
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              />
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    const path = await showDirectoryPicker();
                    if (path) {
                      setBackupOptions({
                        ...backupOptions,
                        customPath: path
                      });
                      setSnackbar({
                        open: true,
                        message: 'Using default backup location',
                        severity: 'info'
                      });
                    }
                  } catch (error) {
                    console.error('Error setting backup location:', error);
                    setSnackbar({
                      open: true,
                      message: 'Failed to set backup location',
                      severity: 'error'
                    });
                  }
                }}
                sx={{
                  minWidth: '120px',
                  color: '#fff',
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                Set Default Location
              </Button>
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                display: 'block', 
                mt: 1 
              }}
            >
              {os === 'windows' ? 
                'Default: C:\\Users\\Public\\Documents\\TaskManager_Backups' :
                'Default: /home/username/TaskManager_Backups'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setBackupDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleCreateBackup(backupOptions)}
            disabled={
              backupOptions.type === 'partial' && 
              !backupOptions.includeDatabases && 
              !backupOptions.includeMedia && 
              !backupOptions.includeSettings
            }
          >
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          mb: 4,
          mr: 4,
        }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
          sx={{
            minWidth: '300px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': {
              fontSize: '24px'
            },
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: 500,
            },
            '& .MuiAlert-action': {
              padding: '0 8px',
            },
            backgroundColor: 
              snackbar.severity === 'success' ? '#2e7d32' :
              snackbar.severity === 'error' ? '#d32f2f' :
              snackbar.severity === 'warning' ? '#ed6c02' : '#0288d1',
            color: '#fff'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default BackupRestore; 