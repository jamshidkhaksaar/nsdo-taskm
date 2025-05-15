import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Container,
  Grid,
  CircularProgress,
  Tooltip,
  Paper,
  Link as MuiLink,
} from '@mui/material';
import {
  CloudDownload as CloudDownloadIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  ErrorOutline as ErrorOutlineIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  HourglassEmpty as HourglassEmptyIcon,
  SettingsBackupRestore as SettingsBackupRestoreIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import { BackupService } from '../../services/backupService';
import { format } from 'date-fns';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';

const DRAWER_WIDTH = 240;

interface Backup {
  id: string;
  name: string;
  timestamp: string;
  size: string;
  type: 'full' | 'partial';
  status: 'completed' | 'in_progress' | 'failed' | 'pending';
  created_by?: string;
  notes?: string;
  error_message?: string;
  file_path?: string;
  progress?: number;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface BackupOptions {
  type: 'full' | 'partial';
  includeDatabases?: boolean;
  customPath?: string;
}

const glassmorphismStyle = {
  backdropFilter: 'blur(10px)',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '16px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
};

const BackupRestore: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupOptions, setBackupOptions] = useState<BackupOptions>({
    type: 'full',
    includeDatabases: true,
    customPath: '',
  });
  const pollingIntervals = useMemo(() => new Map<string, NodeJS.Timeout>(), []);

  const [selectedFileForRestore, setSelectedFileForRestore] = useState<File | null>(null);
  const [restoreFromFileDialogOpen, setRestoreFromFileDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const backupData = (await BackupService.getBackups()) as Backup[];
      setBackups(
        backupData.map((b) => ({
          ...b,
          timestamp: b.timestamp ? format(new Date(b.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
          status: b.status || 'pending',
        }))
      );
    } catch (error: any) {
      console.error('Error fetching backups:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch backups',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
    return () => {
      pollingIntervals.forEach(interval => clearInterval(interval));
      pollingIntervals.clear();
    };
  }, [fetchBackups, pollingIntervals]);

  const startPollingStatus = useCallback((backupId: string) => {
    if (pollingIntervals.has(backupId)) {
      clearInterval(pollingIntervals.get(backupId)!);
    }
    const intervalId = setInterval(async () => {
      try {
        const currentBackupStatus = (await BackupService.checkBackupStatus(backupId)) as Partial<Backup>;
        setBackups((prevBackups) =>
          prevBackups.map((b) =>
            b.id === backupId ? { ...b, status: currentBackupStatus.status || b.status, error_message: currentBackupStatus.error_message, progress: undefined } : b
          )
        );
        if (currentBackupStatus.status === 'completed' || currentBackupStatus.status === 'failed') {
          const existingInterval = pollingIntervals.get(backupId);
          if (existingInterval) clearInterval(existingInterval);
          pollingIntervals.delete(backupId);
          setIsProcessing(false);
          setActiveOperation(null);
          fetchBackups();
          setSnackbar({
            open: true,
            message: currentBackupStatus.status === 'completed' ? `Backup ${backupId} completed.` : `Backup ${backupId} failed: ${currentBackupStatus.error_message || 'Unknown error'}`,
            severity: currentBackupStatus.status === 'completed' ? 'success' : 'error',
          });
        }
      } catch (pollingError: any) {
        console.error(`[Polling] Error polling backup ${backupId} status:`, pollingError);
        let attemptFailed = false;
        setBackups((prevBackups) =>
          prevBackups.map((b) => {
            if (b.id === backupId) {
                const newProgress = Math.min((b.progress || 0) + 20, 100);
                if (newProgress >= 100) attemptFailed = true;
                return { ...b, progress: newProgress }; 
            }
            return b;
          })
        );
        if (attemptFailed) {
            const existingInterval = pollingIntervals.get(backupId);
            if (existingInterval) clearInterval(existingInterval);
            pollingIntervals.delete(backupId);
            setIsProcessing(false);
            setActiveOperation(null);
            fetchBackups();
            setSnackbar({
                open: true,
                message: `Failed to get status for backup ${backupId} after multiple attempts. Please check the list.`,
                severity: 'warning'
            });
        }
      }
    }, 5000);
    pollingIntervals.set(backupId, intervalId);
  }, [pollingIntervals, fetchBackups]);

  const handleCreateBackup = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setBackupDialogOpen(false);
    let tempBackupId = `temp-backup-${Date.now()}`;
    const tempBackup: Backup = {
        id: tempBackupId,
        name: `New ${backupOptions.type} Backup (Initiating...)`,
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        size: 'Calculating...',
        type: backupOptions.type,
        status: 'pending',
        progress: 0,
    };
    setBackups(prev => [tempBackup, ...prev]);
    setActiveOperation(tempBackupId);
    try {
      const createdBackup = (await BackupService.createBackup(backupOptions)) as Backup;
      setBackups(prev => prev.map(b => b.id === tempBackupId ? { ...createdBackup, timestamp: format(new Date(createdBackup.timestamp), 'yyyy-MM-dd HH:mm:ss'), progress: 10, status: 'in_progress' } : b));
      setActiveOperation(createdBackup.id);
      startPollingStatus(createdBackup.id);
      setSnackbar({
        open: true,
        message: `Backup ${createdBackup.name || createdBackup.id} started successfully.`,
        severity: 'info'
      });
    } catch (error: any) {
      console.error('Error creating backup:', error);
      setBackups(prev => prev.filter(b => b.id !== tempBackupId));
      setIsProcessing(false);
      setActiveOperation(null);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create backup',
        severity: 'error'
      });
    }
  };

  const handleRestore = (backup: Backup) => {
    if (isProcessing) return;
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackup || isProcessing) return;
    setIsProcessing(true);
    setActiveOperation(selectedBackup.id);
    setRestoreDialogOpen(false);
    setBackups(prev => prev.map(b => b.id === selectedBackup.id ? {...b, status: 'in_progress', progress: 0} : b));
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
        currentProgress += 10;
        setBackups(prev => prev.map(b => {
            if (b.id === selectedBackup.id) {
                return {...b, progress: Math.min(currentProgress, 90)};
            }
            return b;
        }));
        if (currentProgress >= 90) clearInterval(progressInterval);
    }, 500);
    try {
      await BackupService.restoreBackup(selectedBackup.id);
      clearInterval(progressInterval);
      setBackups(prev => prev.map(b => b.id === selectedBackup.id ? {...b, status: 'completed', progress: 100} : b));
      setSnackbar({
        open: true,
        message: `System restore from backup '${selectedBackup.name}' initiated. It may take a few moments. The system might restart. `,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      clearInterval(progressInterval);
      setBackups(prev => prev.map(b => b.id === selectedBackup.id ? {...b, status: 'failed', error_message: error.response?.data?.message || 'Restore failed', progress: undefined} : b));
      setSnackbar({
        open: true,
        message: error.response?.data?.message || `Failed to restore backup '${selectedBackup.name}'`,
        severity: 'error'
      });
    } finally {
        setTimeout(() => {
            setIsProcessing(false);
            setActiveOperation(null);
            fetchBackups(); 
        }, 3000);
    }
  };

  const handleDelete = (backup: Backup) => {
    if (isProcessing) return;
    setSelectedBackup(backup);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBackup || isProcessing) return;
    setIsProcessing(true);
    setActiveOperation(selectedBackup.id);
    setDeleteDialogOpen(false);
    try {
      await BackupService.deleteBackup(selectedBackup.id);
      setBackups((prevBackups) => prevBackups.filter((b) => b.id !== selectedBackup.id));
      setSnackbar({
        open: true,
        message: `Backup '${selectedBackup.name}' deleted successfully`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error deleting backup:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || `Failed to delete backup '${selectedBackup.name}'`,
        severity: 'error'
      });
    } finally {
      setIsProcessing(false);
      setActiveOperation(null);
    }
  };

  const handleDownload = async (backup: Backup) => {
    if (isProcessing && activeOperation === backup.id) return;
    setIsProcessing(true);
    setActiveOperation(backup.id);
    setSnackbar({ open: true, message: `Preparing download for '${backup.name}'...`, severity: 'info' });
    try {
      await BackupService.downloadBackup(backup.id);
    } catch (error: any) {
      console.error('Error downloading backup:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || `Failed to download backup '${backup.name}'`,
        severity: 'error'
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setActiveOperation(null);
      }, 1000);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.sql') || file.name.endsWith('.gz') || file.name.endsWith('.zip')) {
        setSelectedFileForRestore(file);
        setRestoreFromFileDialogOpen(true);
      } else {
        setSnackbar({
          open: true,
          message: 'Invalid file type. Please select a .sql, .gz, or .zip file.',
          severity: 'error',
        });
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRestoreFromStorageClick = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  const handleConfirmRestoreFromFile = async () => {
    if (!selectedFileForRestore || isProcessing) return;
    setIsProcessing(true);
    setRestoreFromFileDialogOpen(false);
    setActiveOperation(`restore-local-${selectedFileForRestore.name}`);

    setSnackbar({
        open: true,
        message: `Restoring from file '${selectedFileForRestore.name}'... This may take a while.`,
        severity: 'info'
    });

    try {
      await BackupService.restoreBackupFromFile(selectedFileForRestore);
      setSnackbar({
        open: true,
        message: `System restore from file '${selectedFileForRestore.name}' initiated successfully. The system might restart.`,
        severity: 'success'
      });
      fetchBackups();
    } catch (error: any) {
      console.error('Error restoring backup from file:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || `Failed to restore from file '${selectedFileForRestore.name}'`,
        severity: 'error'
      });
    } finally {
      setIsProcessing(false);
      setActiveOperation(null);
      setSelectedFileForRestore(null);
    }
  };

  const getStatusChip = (status: Backup['status'], errorMessage?: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    let icon = <HourglassEmptyIcon />;
    switch (status) {
      case 'completed': color = 'success'; icon = <CheckCircleOutlineIcon />; break;
      case 'in_progress': 
      case 'pending': 
        color = 'info'; 
        icon = <HourglassEmptyIcon />;
        break;
      case 'failed': color = 'error'; icon = <ErrorOutlineIcon />; break;
    }
    const chipLabel = status.replace('_', ' ').toUpperCase();
    return (<Chip icon={icon} label={chipLabel} color={color} size="small" title={status === 'failed' && errorMessage ? `Error: ${errorMessage}` : undefined} />);
  };

  const handleToggleTopWidgets = () => setTopWidgetsVisible(prev => !prev);

  const mainPageContent = (
    <React.Fragment>
      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, ...glassmorphismStyle }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography component="h1" variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
            System Backup & Restore
          </Typography>
          <Box sx={{ display: 'flex', gap: 1}}>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setBackupDialogOpen(true)}
              disabled={isProcessing}
              color="primary"
            >
              Create New Backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={handleRestoreFromStorageClick}
              disabled={isProcessing}
              color="secondary"
            >
              Restore from Storage
            </Button>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".sql,.gz,.zip"
            />
          </Box>
        </Box>

        {isLoading && <LinearProgress sx={{ width: '100%', mb: 2 }} />}

        {!isLoading && backups.length === 0 && (
          <Alert severity="info">No backups found. Create a new backup to get started.</Alert>
        )}

        {!isLoading && backups.length > 0 && (
          <TableContainer component={Paper} elevation={2}>
            <Table sx={{ minWidth: 650 }} aria-label="backups table">
              <TableHead sx={{ backgroundColor: 'grey.200'}}>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">
                      <Typography variant="subtitle2">{backup.name}</Typography>
                      <Typography variant="caption" color="textSecondary">ID: {backup.id}</Typography>
                    </TableCell>
                    <TableCell>{backup.timestamp}</TableCell>
                    <TableCell>
                      {(backup.status === 'in_progress' || backup.status === 'pending') ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} value={activeOperation === backup.id ? backup.progress : undefined} variant={activeOperation === backup.id && backup.progress !== undefined ? "determinate" : "indeterminate"} />
                          <Typography variant="caption">
                              {activeOperation === backup.id && backup.progress !== undefined ? `${backup.progress}%` : (backup.status === 'pending' ? 'Initiating...' : 'Processing...')}
                          </Typography>
                        </Box>
                      ) : ( getStatusChip(backup.status, backup.error_message) )}
                    </TableCell>
                    <TableCell>{backup.type.toUpperCase()}</TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Download Backup">
                        <span>
                          <IconButton
                            onClick={() => handleDownload(backup)}
                            disabled={isProcessing || backup.status !== 'completed'}
                            color="primary"
                          >
                            <CloudDownloadIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Restore from this Backup">
                        <span>
                          <IconButton
                            onClick={() => handleRestore(backup)}
                            disabled={isProcessing || backup.status !== 'completed'}
                            color="secondary"
                          >
                            <SettingsBackupRestoreIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete Backup">
                        <span>
                          <IconButton
                            onClick={() => handleDelete(backup)}
                            disabled={isProcessing && activeOperation === backup.id && backup.status !== 'completed' && backup.status !== 'failed'}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={backupDialogOpen} onClose={() => { if (!isProcessing) setBackupDialogOpen(false); }} maxWidth="sm" fullWidth PaperProps={{ sx: glassmorphismStyle }}>
        <DialogTitle sx={{color: 'text.primary'}}>Create New Backup</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom sx={{color: 'text.secondary'}}>
            Select the type of backup you want to perform and any specific options.
          </Typography>
          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch checked={backupOptions.type === 'full'} onChange={(e) => setBackupOptions({...backupOptions, type: e.target.checked ? 'full' : 'partial'})} />}
              label={backupOptions.type === 'full' ? "Full Backup (Schema & Data)" : "Partial Backup (Schema Only)"}
            />
            <Typography variant="caption" color="textSecondary" sx={{mb:1}}>
                {backupOptions.type === 'full' ? 'A full backup includes all database structures and their data.' : 'A partial backup includes only the database structures (schema) without data.'} 
            </Typography>
            <TextField
              margin="dense"
              label="Custom Server Path (Optional)"
              type="text"
              fullWidth
              variant="outlined"
              value={backupOptions.customPath}
              onChange={(e) => setBackupOptions({...backupOptions, customPath: e.target.value})}
              helperText="Specify an absolute path on the server where the backup file should be stored. If left empty, a default path will be used."
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)} disabled={isProcessing} color="inherit">Cancel</Button>
          <Button onClick={handleCreateBackup} disabled={isProcessing} variant="contained">
            {isProcessing && activeOperation && backups.find(b => b.id === activeOperation)?.status === 'pending' ? <CircularProgress size={24} sx={{mr:1}} /> : null}
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={restoreDialogOpen} onClose={() => {if (!isProcessing) setRestoreDialogOpen(false);}} maxWidth="xs" PaperProps={{ sx: glassmorphismStyle }}>
        <DialogTitle sx={{display: 'flex', alignItems: 'center', color: 'text.primary'}}><RestoreIcon sx={{mr:1}}/>Confirm Restore</DialogTitle>
        <DialogContent>
          <Typography sx={{color: 'text.secondary'}}>
            Are you sure you want to restore the system from backup 
            <Typography component="span" fontWeight="bold" sx={{color: 'text.primary'}}>{selectedBackup?.name}</Typography> (taken on {selectedBackup?.timestamp})?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action is irreversible and will overwrite current system data. It is highly recommended to take a fresh backup before proceeding.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)} disabled={isProcessing} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmRestore} disabled={isProcessing} color="warning" variant="contained">
            {isProcessing && activeOperation === selectedBackup?.id ? <CircularProgress size={24} sx={{mr:1}}/> : null}
            Restore Now
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => {if(!isProcessing) setDeleteDialogOpen(false);}} maxWidth="xs" PaperProps={{ sx: glassmorphismStyle }}>
        <DialogTitle sx={{display: 'flex', alignItems: 'center', color: 'text.primary'}}><DeleteIcon sx={{mr:1}}/>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{color: 'text.secondary'}}>
            Are you sure you want to permanently delete the backup 
            <Typography component="span" fontWeight="bold" sx={{color: 'text.primary'}}>{selectedBackup?.name}</Typography> (taken on {selectedBackup?.timestamp})?
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isProcessing} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmDelete} disabled={isProcessing} color="error" variant="contained">
             {isProcessing && activeOperation === selectedBackup?.id ? <CircularProgress size={24} sx={{mr:1}}/> : null}
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={restoreFromFileDialogOpen} onClose={() => {if (!isProcessing) setRestoreFromFileDialogOpen(false);}} maxWidth="sm" fullWidth PaperProps={{ sx: glassmorphismStyle }}>
        <DialogTitle sx={{display: 'flex', alignItems: 'center', color: 'text.primary'}}>
          <CloudUploadIcon sx={{mr:1}}/>Confirm Restore from File
        </DialogTitle>
        <DialogContent>
          <Typography sx={{color: 'text.secondary'}}>
            Are you sure you want to restore the system from the file: 
            <Typography component="span" fontWeight="bold" sx={{color: 'text.primary'}}> {selectedFileForRestore?.name}</Typography>?
          </Typography>
          {selectedFileForRestore && (
            <Typography variant="body2" sx={{mt:1, color: 'text.secondary'}}>
              Size: {Math.round(selectedFileForRestore.size / 1024)} KB
            </Typography>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action is irreversible and will overwrite current system data. 
            Ensure this is the correct backup file. It is highly recommended to take a fresh backup of the current system before proceeding if possible.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {setRestoreFromFileDialogOpen(false); setSelectedFileForRestore(null);}} disabled={isProcessing} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmRestoreFromFile} disabled={isProcessing || !selectedFileForRestore} color="warning" variant="contained">
            {isProcessing && activeOperation === `restore-local-${selectedFileForRestore?.name}` ? <CircularProgress size={24} sx={{mr:1}}/> : null}
            Restore from this File
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </React.Fragment>
  );

  const mainContentElementForLayout = (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {mainPageContent} 
    </Container>
  );

  const sidebarElement = (
    <Sidebar 
        open={sidebarOpen} 
        onToggleDrawer={() => setSidebarOpen(!sidebarOpen)} 
        onLogout={() => navigate('/login')}
        drawerWidth={DRAWER_WIDTH} 
    />
  );
  const topBarElement = (
    <DashboardTopBar 
        username={user?.username || 'Admin'} 
        notificationCount={0}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        onNotificationClick={() => {}} 
        onLogout={() => navigate('/login')}
        onProfileClick={() => navigate('/profile')} 
        onSettingsClick={() => navigate('/admin/settings')}
        onHelpClick={() => {}}
        onToggleTopWidgets={handleToggleTopWidgets}
        topWidgetsVisible={topWidgetsVisible}
    />
  );

  return (
    <ModernDashboardLayout
      sidebar={sidebarElement}
      topBar={topBarElement}
      mainContent={mainContentElementForLayout}
      sidebarOpen={sidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default BackupRestore;