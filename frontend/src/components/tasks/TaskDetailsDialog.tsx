import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress,
    Box,
    Grid,
    Chip,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
} from '@mui/material';
import { Task, TaskPriority, TaskStatus, DelegateTaskData } from '@/types';
import { User as ServiceUser } from '@/types/user';
import { Role } from '@/pages/admin/rbac/types';
import { TaskService } from '@/services/task';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import dayjs from 'dayjs';

interface TaskDetailsDialogProps {
    taskId: string | null;
    open: boolean;
    onClose: () => void;
    onTaskUpdate: (updatedTask: Task) => void;
}

// Example leadership roles - this should ideally come from a config or constants file
const LEADERSHIP_ROLES = ['Super Admin', 'Manager', 'Team Lead', 'Leadership']; // Add all relevant roles

const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
    taskId,
    open,
    onClose,
    onTaskUpdate,
}) => {
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useSelector((state: RootState) => state.auth);

    const [selectedPriority, setSelectedPriority] = useState<TaskPriority | ''>('');
    const [usersForDelegation, setUsersForDelegation] = useState<ServiceUser[]>([]);
    const [delegateToUserId, setDelegateToUserId] = useState<string | ''>('');
    const [delegationNotes, setDelegationNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentUserRole = (user?.role && typeof user.role === 'object') ? (user.role as Role).name : undefined;
    const canManageTasks = useMemo(() => {
        return currentUserRole && LEADERSHIP_ROLES.includes(currentUserRole);
    }, [currentUserRole]);

    useEffect(() => {
        const fetchTaskDetails = async () => {
            if (taskId) {
                setLoading(true);
                setError(null);
                try {
                    const taskData = await TaskService.getTask(taskId);
                    setTask(taskData);
                    setSelectedPriority(taskData.priority || '');
                } catch (err) {
                    console.error('Failed to fetch task details:', err);
                    setError('Failed to load task details.');
                }
                setLoading(false);
            }
        };

        const fetchUsers = async () => {
            if (canManageTasks) {
                try {
                    const usersData = await TaskService.getUsers();
                    setUsersForDelegation(usersData.filter(u => u.id !== user?.id));
                } catch (err) {
                    console.error('Failed to fetch users for delegation:', err);
                }
            }
        };

        if (open) {
            fetchTaskDetails();
            fetchUsers();
        } else {
            // Reset state when dialog closes
            setTask(null);
            setSelectedPriority('');
            setDelegateToUserId('');
            setDelegationNotes('');
            setError(null);
        }
    }, [taskId, open, canManageTasks, user?.id]);

    const handlePriorityChange = async () => {
        if (!task || !selectedPriority || selectedPriority === task.priority) return;
        setIsSubmitting(true);
        try {
            const updatedTask = await TaskService.changeTaskPriority(task.id, selectedPriority);
            setTask(updatedTask);
            onTaskUpdate(updatedTask);
            alert('Priority updated successfully!');
        } catch (err) {
            console.error('Failed to update priority:', err);
            setError('Failed to update priority.');
        }
        setIsSubmitting(false);
    };

    const handleDelegateTask = async () => {
        if (!task || !delegateToUserId) return;
        setIsSubmitting(true);
        try {
            const delegationPayload: DelegateTaskData = {
                newAssigneeUserIds: [delegateToUserId],
                delegationReason: delegationNotes,
            };
            const delegatedTask = await TaskService.delegateTask(task.id, delegationPayload);
            setTask(delegatedTask);
            onTaskUpdate(delegatedTask);
            alert('Task delegated successfully!');
            onClose();
        } catch (err) {
            console.error('Failed to delegate task:', err);
            setError('Failed to delegate task.');
        }
        setIsSubmitting(false);
    };

    const glassmorphismPaperStyle = {
        background: 'rgba(40, 50, 70, 0.75)', // Darker glass for better contrast with white text
        backdropFilter: 'blur(12px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.125)',
        borderRadius: '16px',
        color: '#fafafa',
    };

    const glassmorphismContentStyle = {
        color: '#e0e0e0',
        '& .MuiTypography-root': {
            color: '#f5f5f5',
        },
        '& .MuiInputLabel-root': {
            color: '#b0bec5', // Lighter gray for labels
            '&.Mui-focused': {
                color: '#90caf9', // Light blue when focused
            }
        },
        '& .MuiInputBase-input': {
            color: '#eceff1', // Off-white for input text
        },
        '& .MuiOutlinedInput-root': {
            '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
            },
            '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#90caf9', // Light blue border when focused
            },
        },
        '& .MuiSelect-icon': {
            color: '#b0bec5',
        },
        '& .MuiChip-root': {
             backgroundColor: 'rgba(255, 255, 255, 0.15)',
             color: '#e0e0e0',
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            fullWidth 
            maxWidth="md"
            PaperProps={{
                sx: glassmorphismPaperStyle
            }}
        >
            <DialogTitle sx={{ color: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.125)' }}>
                {loading ? 'Loading Task...' : task?.title || 'Task Details'}
            </DialogTitle>
            <DialogContent sx={glassmorphismContentStyle}>
                {loading && <Box display="flex" justifyContent="center" my={3}><CircularProgress sx={{ color: '#fafafa'}} /></Box>}
                {error && <Alert severity="error" sx={{ my: 2, background: 'rgba(255,0,0,0.1)', color: 'white' }}>{error}</Alert>}
                {!loading && !error && task && (
                    <Grid container spacing={2} mt={1}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Description</Typography>
                            <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>{task.description || 'No description.'}</Typography>
                           
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>Status</Typography>
                            <Chip label={task.status} size="small" 
                                color={
                                    task.status === TaskStatus.COMPLETED ? 'success' :
                                    task.status === TaskStatus.PENDING ? 'warning' :
                                    task.status === TaskStatus.IN_PROGRESS ? 'info' :
                                    task.status === TaskStatus.DELEGATED ? 'secondary' :
                                    task.status === TaskStatus.CANCELLED ? 'error' : 'default'
                                }
                                sx={{ 
                                    color: task.status === TaskStatus.PENDING || task.status === TaskStatus.CANCELLED || task.status === TaskStatus.IN_PROGRESS ? 'black' : 'white', // Ensure contrast for warning/error/info
                                }}
                            />

                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>Due Date</Typography>
                            <Typography variant="body2">{task.dueDate ? dayjs(task.dueDate).format('MMMM D, YYYY h:mm A') : 'Not set'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Priority</Typography>
                            {canManageTasks ? (
                                <FormControl fullWidth margin="normal" size="small">
                                    <InputLabel id="priority-select-label">Priority</InputLabel>
                                    <Select
                                        labelId="priority-select-label"
                                        value={selectedPriority}
                                        label="Priority"
                                        onChange={(e) => setSelectedPriority(e.target.value as TaskPriority)}
                                        disabled={isSubmitting}
                                    >
                                        {Object.values(TaskPriority).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                    </Select>
                                    <Button onClick={handlePriorityChange} disabled={isSubmitting || !selectedPriority || selectedPriority === task.priority} sx={{ mt: 1, color: 'inherit', borderColor: 'rgba(255,255,255,0.5)' }} variant="outlined">
                                        {isSubmitting ? <CircularProgress size={20} sx={{color: 'inherit'}}/> : 'Update Priority'}
                                    </Button>
                                </FormControl>
                            ) : (
                                <Typography variant="body2">{task.priority}</Typography>
                            )}

                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>Assigned To</Typography>
                            {task.assignedToUsers && task.assignedToUsers.length > 0 
                                ? task.assignedToUsers.map(u => <Chip key={u.id} label={u.username} size="small" sx={{ mr: 0.5 }}/>)
                                : <Typography variant="body2">Not assigned to specific users.</Typography>}
                            
                            {task.assignedToDepartments && task.assignedToDepartments.length > 0 && (
                                <Box mt={1}>
                                     {task.assignedToDepartments.map(d => <Chip key={d.id} label={d.name} size="small" sx={{ mr: 0.5 }}/>)}
                                </Box>
                            )}

                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>Created By</Typography>
                            <Typography variant="body2">{(task.createdBy as ServiceUser)?.username || 'Unknown'} on {dayjs(task.createdAt).format('MMMM D, YYYY')}</Typography>
                        </Grid>

                        {canManageTasks && (
                            <Grid item xs={12} sx={{ borderTop: '1px solid rgba(255,255,255,0.125)', mt: 2, pt:2 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Delegate Task</Typography>
                                <FormControl fullWidth margin="normal" size="small">
                                    <InputLabel id="delegate-user-select-label">Delegate to User</InputLabel>
                                    <Select
                                        labelId="delegate-user-select-label"
                                        value={delegateToUserId}
                                        label="Delegate to User"
                                        onChange={(e) => setDelegateToUserId(e.target.value as string)}
                                        disabled={isSubmitting || usersForDelegation.length === 0}
                                    >
                                        {usersForDelegation.length === 0 && <MenuItem value="" disabled>No users available for delegation</MenuItem>}
                                        {usersForDelegation.map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <TextField 
                                    label="Delegation Notes (Optional)"
                                    multiline 
                                    rows={2} 
                                    fullWidth 
                                    margin="normal"
                                    value={delegationNotes}
                                    onChange={(e) => setDelegationNotes(e.target.value)}
                                    disabled={isSubmitting}
                                />
                                <Button onClick={handleDelegateTask} disabled={isSubmitting || !delegateToUserId} sx={{ mt: 1, color: 'inherit', borderColor: 'rgba(255,255,255,0.5)' }} variant="outlined">
                                    {isSubmitting ? <CircularProgress size={20} sx={{color: 'inherit'}} /> : 'Delegate Task'}
                                </Button>
                            </Grid>
                        )}
                    </Grid>
                )}
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.125)', p: '16px 24px' }}>
                <Button onClick={onClose} sx={{ color: 'inherit', borderColor: 'rgba(255,255,255,0.5)' }} variant="outlined">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaskDetailsDialog; 