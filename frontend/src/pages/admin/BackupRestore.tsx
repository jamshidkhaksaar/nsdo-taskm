import React, { useState } from 'react';
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
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import BackupIcon from '@mui/icons-material/Backup';
import AdminLayout from '../../layouts/AdminLayout';

interface Backup {
  id: string;
  name: string;
  timestamp: string;
  size: string;
  type: 'full' | 'partial';
  status: 'completed' | 'in_progress' | 'failed';
}

const mockBackups: Backup[] = [
  {
    id: '1',
    name: 'Full System Backup',
    timestamp: '2024-03-15 10:30:00',
    size: '2.5 GB',
    type: 'full',
    status: 'completed',
  },
  {
    id: '2',
    name: 'User Data Backup',
    timestamp: '2024-03-14 15:45:00',
    size: '1.2 GB',
    type: 'partial',
    status: 'completed',
  },
  {
    id: '3',
    name: 'Database Backup',
    timestamp: '2024-03-14 08:15:00',
    size: '800 MB',
    type: 'partial',
    status: 'completed',
  },
];

const BackupRestore: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>(mockBackups);
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as const });

  const handleCreateBackup = () => {
    setIsBackupInProgress(true);
    setBackupProgress(0);

    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackupInProgress(false);
          
          // Add new backup to list
          const newBackup: Backup = {
            id: Date.now().toString(),
            name: 'Full System Backup',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            size: '2.8 GB',
            type: 'full',
            status: 'completed',
          };
          setBackups([newBackup, ...backups]);
          
          setSnackbar({
            open: true,
            message: 'Backup completed successfully',
            severity: 'success',
          });
          return 0;
        }
        return prev + 2;
      });
    }, 100);
  };

  const handleRestore = (backup: Backup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const handleConfirmRestore = () => {
    if (selectedBackup) {
      // Implement restore logic here
      setSnackbar({
        open: true,
        message: 'System restored successfully',
        severity: 'success',
      });
    }
    setRestoreDialogOpen(false);
  };

  const handleDelete = (backupId: string) => {
    setBackups(backups.filter(backup => backup.id !== backupId));
    setSnackbar({
      open: true,
      message: 'Backup deleted successfully',
      severity: 'success',
    });
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
          onClick={handleCreateBackup}
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
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleRestore(backup)}
                    sx={{ color: '#fff' }}
                  >
                    <RestoreIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {/* Implement download logic */}}
                    sx={{ color: '#fff' }}
                  >
                    <CloudDownloadIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(backup.id)}
                    sx={{ color: '#fff' }}
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
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Confirm Restore</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#fff' }}>
            Are you sure you want to restore the system to this backup point? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmRestore} color="primary" variant="contained">
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default BackupRestore; 