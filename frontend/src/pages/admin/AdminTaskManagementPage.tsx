import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { TaskService } from '../../services/task';
import { Task, TaskStatus } from '../../types';

const DRAWER_WIDTH = 240;

interface SnackbarMessage {
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
}

const AdminTaskManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [confirmDialogContent, setConfirmDialogContent] = useState({ title: '', description: '' });
    const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);

    const fetchAllTasks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const tasks = await TaskService.getTasks({ include_all: true, task_type: 'all' });
            setAllTasks(tasks);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch tasks.');
            console.error("Error fetching tasks:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllTasks();
    }, []);

    const completedTasks = allTasks.filter(task => task.status === TaskStatus.COMPLETED);

    const handleToggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleOpenConfirmDialog = (title: string, description: string, action: () => Promise<void>) => {
        setConfirmDialogContent({ title, description });
        setConfirmAction(() => action);
        setOpenConfirmDialog(true);
    };

    const handleCloseConfirmDialog = () => {
        setOpenConfirmDialog(false);
        setConfirmAction(null);
    };

    const handleExecuteConfirmAction = async () => {
        if (confirmAction) {
            setIsSubmitting(true);
            await confirmAction();
            setIsSubmitting(false);
        }
        handleCloseConfirmDialog();
    };

    const handleMoveCompletedToRecycleBin = async () => {
        handleOpenConfirmDialog(
            'Confirm Archive',
            `Are you sure you want to move all ${completedTasks.length} completed tasks to the Recycle Bin?`,
            async () => {
                try {
                    const result = await TaskService.archiveCompletedTasks();
                    setSnackbar({ message: `${result.count} completed tasks moved to Recycle Bin.`, severity: 'success' });
                    fetchAllTasks();
                } catch (err: any) {
                    const errMsg = err.response?.data?.message || err.message || 'Failed to move tasks.';
                    setSnackbar({ message: errMsg, severity: 'error' });
                    console.error("Error moving completed tasks:", err);
                }
            }
        );
    };

    const handlePermanentlyDeleteAllTasks = async () => {
        handleOpenConfirmDialog(
            'Confirm PERMANENT Deletion',
            'ARE YOU ABSOLUTELY SURE? This will permanently delete ALL tasks from the system and CANNOT BE UNDONE.',
            async () => {
                const verySure = window.prompt('This is IRREVERSIBLE. To confirm, type DELETE ALL TASKS below:');
                if (verySure === "DELETE ALL TASKS") {
                    try {
                        const result = await TaskService.wipeAllTasks();
                        setSnackbar({ message: `Successfully deleted ${result.count} tasks from the system.`, severity: 'success' });
                        setAllTasks([]);
                    } catch (err: any) {
                        const errMsg = err.response?.data?.message || err.message || 'Failed to delete all tasks.';
                        setSnackbar({ message: errMsg, severity: 'error' });
                        console.error("Error wiping all tasks:", err);
                    }
                } else {
                    setSnackbar({ message: 'Permanent deletion cancelled.', severity: 'info' });
                }
            }
        );
    };

    const handleCloseSnackbar = () => {
        setSnackbar(null);
    };

    const mainContent = (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#fff' }}>
                Task Management
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
                Manage system tasks, including completed tasks and cleanup operations.
            </Typography>

            <Paper sx={{ p: 2, mb: 3, background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Completed Tasks ({completedTasks.length})</Typography>
                {isLoading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {!isLoading && !error && (
                    completedTasks.length > 0 ? (
                        <List dense sx={{ maxHeight: '300px', overflow: 'auto' }}>
                            {completedTasks.map(task => (
                                <ListItem key={task.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <ListItemText 
                                        primary={<Typography variant="body2" sx={{ color: '#eee' }}>{task.title}</Typography>}
                                        secondary={<Typography variant="caption" sx={{ color: '#bbb' }}>ID: {task.id} - Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</Typography>}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic', mt: 1 }}>
                            No completed tasks found.
                        </Typography>
                    )
                )}
                <Button 
                    variant="contained" 
                    color="warning" 
                    sx={{ mt: 2 }} 
                    onClick={handleMoveCompletedToRecycleBin}
                    disabled={isLoading || isSubmitting || completedTasks.length === 0}
                >
                    {isSubmitting && isLoading === false ? <CircularProgress size={24} color="inherit" sx={{mr: 1}} /> : null}
                    Move All Completed to Recycle Bin
                </Button>
            </Paper>

            <Paper sx={{ p: 2, background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Global Task Operations</Typography>
                <Button 
                    variant="contained" 
                    color="error" 
                    onClick={handlePermanentlyDeleteAllTasks}
                    disabled={isLoading || isSubmitting}
                >
                    {isSubmitting && isLoading === false ? <CircularProgress size={24} color="inherit" sx={{mr: 1}} /> : null}
                    Permanently Delete ALL Tasks
                </Button>
                <Typography variant="caption" display="block" sx={{ color: 'rgba(255, 100, 100, 0.8)', mt: 1 }}>
                    Warning: This action is irreversible and will delete all tasks from the system.
                </Typography>
            </Paper>

            {snackbar && (
                <Snackbar open autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            )}

            <Dialog
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{confirmDialogContent.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {confirmDialogContent.description}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleExecuteConfirmAction} color={confirmDialogContent.title.toLowerCase().includes("delete") ? "error" : "primary"} autoFocus disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );

    return (
        <ModernDashboardLayout
            sidebar={<Sidebar open={sidebarOpen} onToggleDrawer={handleToggleSidebar} onLogout={handleLogout} drawerWidth={DRAWER_WIDTH} />}
            topBar={<DashboardTopBar 
                        username={user?.username || 'Admin'} 
                        notificationCount={0}
                        onToggleSidebar={handleToggleSidebar} 
                        onNotificationClick={() => {}} 
                        onLogout={handleLogout}
                        onProfileClick={() => navigate('/profile')}
                        onSettingsClick={() => navigate('/admin/settings')}
                        onHelpClick={() => {}} 
                        onToggleTopWidgets={() => {}} 
                        topWidgetsVisible={false} 
                    />}
            mainContent={mainContent}
            sidebarOpen={sidebarOpen}
            drawerWidth={DRAWER_WIDTH}
        />
    );
};

export default AdminTaskManagementPage; 