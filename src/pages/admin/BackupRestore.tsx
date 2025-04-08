import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    useMediaQuery,
    useTheme,
    Paper,
    Button,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert
} from '@mui/material';
import { AppDispatch, RootState } from '../../../frontend/src/store';
import { logout } from '../../../frontend/src/store/slices/authSlice';
import axios from '../../../frontend/src/utils/axios';

interface BackupInfo {
    id: string;
    timestamp: string;
    size: string; // e.g., "15.2 MB"
    status: 'Completed' | 'Failed' | 'In Progress';
}

const BackupRestore: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [loadingBackups, setLoadingBackups] = useState(false);
    const [backupStatus, setBackupStatus] = useState<'idle' | 'in_progress' | 'completed' | 'failed'>('idle');
    const [restoreStatus, setRestoreStatus] = useState<'idle' | 'in_progress' | 'completed' | 'failed'>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBackups = async () => {
            setLoadingBackups(true);
            setError(null);
            try {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate fetch
                setBackups([
                    { id: 'backup-001', timestamp: new Date(Date.now() - 86400000).toISOString(), size: '14.8 MB', status: 'Completed' },
                    { id: 'backup-002', timestamp: new Date().toISOString(), size: '15.2 MB', status: 'Completed' },
                ]);
            } catch (err) {
                console.error('Error fetching backups:', err);
                setError('Failed to load backup list.');
            } finally {
                setLoadingBackups(false);
            }
        };
        fetchBackups();
    }, []);

    const handleCreateBackup = async () => {
        setBackupStatus('in_progress');
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate backup
            setBackupStatus('completed');
        } catch (err) {
            console.error('Backup failed:', err);
            setError('Failed to create backup.');
            setBackupStatus('failed');
        }
    };

    const handleRestoreBackup = async (backupId: string) => {
        if (!window.confirm(`Are you sure you want to restore from backup ${backupId}? This cannot be undone.`)) {
            return;
        }
        setRestoreStatus('in_progress');
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate restore
            setRestoreStatus('completed');
            alert('Restore completed successfully! The application might restart.');
        } catch (err) {
            console.error('Restore failed:', err);
            setError(`Failed to restore from backup ${backupId}.`);
            setRestoreStatus('failed');
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>Backup & Restore</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ p: 2, mb: 3, background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
                <Typography variant="h6" gutterBottom>Create Backup</Typography>
                <Button
                    variant="contained"
                    onClick={handleCreateBackup}
                    disabled={backupStatus === 'in_progress'}
                >
                    {backupStatus === 'in_progress' ? <CircularProgress size={24} /> : 'Create New Backup'}
                </Button>
                {backupStatus === 'completed' && <Alert severity="success" sx={{ mt: 2 }}>Backup created successfully.</Alert>}
                {backupStatus === 'failed' && <Alert severity="error" sx={{ mt: 2 }}>Backup failed.</Alert>}
            </Paper>

            <Paper sx={{ p: 2, background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
                <Typography variant="h6" gutterBottom>Available Backups</Typography>
                {loadingBackups ? (
                    <CircularProgress />
                ) : (
                    <List dense>
                        {backups.map((backup) => (
                            <ListItem key={backup.id} divider>
                                <ListItemText
                                    primary={`ID: ${backup.id} - Status: ${backup.status}`}
                                    secondary={`Created: ${new Date(backup.timestamp).toLocaleString()} - Size: ${backup.size}`}
                                    primaryTypographyProps={{ color: 'white' }}
                                    secondaryTypographyProps={{ color: '#ccc' }}
                                />
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleRestoreBackup(backup.id)}
                                    disabled={restoreStatus === 'in_progress' || backup.status !== 'Completed'}
                                    sx={{ ml: 2 }}
                                >
                                    Restore
                                </Button>
                            </ListItem>
                        ))}
                        {backups.length === 0 && !loadingBackups && (
                            <ListItem>
                                <ListItemText primary="No backups found." sx={{ color: '#ccc' }} />
                            </ListItem>
                        )}
                    </List>
                )}
                {restoreStatus === 'in_progress' && <CircularProgress size={24} sx={{ mt: 2 }} />}
                {restoreStatus === 'completed' && <Alert severity="success" sx={{ mt: 2 }}>Restore initiated successfully.</Alert>}
                {restoreStatus === 'failed' && <Alert severity="error" sx={{ mt: 2 }}>Restore failed.</Alert>}
            </Paper>
        </Box>
    );
};

export default BackupRestore;
 