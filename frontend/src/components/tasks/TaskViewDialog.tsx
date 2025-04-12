import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  Chip,
  Grid,
  TextField,
  Autocomplete,
  Alert
} from '@mui/material';
import { Task, TaskStatus } from '../../types/task';
import { TaskService } from '../../services/task';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Theme } from '@mui/material/styles';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';

interface TaskViewDialogProps {
  open: boolean;
  onClose: () => void;
  task: Task;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const TaskViewDialog: React.FC<TaskViewDialogProps> = ({ open, onClose, task, onEdit, onDelete }) => {
  const theme = useTheme();
  const glassStyles = getGlassmorphismStyles(theme);
  const [delegateDialogOpen, setDelegateDialogOpen] = useState(false);
  const { users } = useSelector((state: RootState) => state.users);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [delegationError, setDelegationError] = useState<string | null>(null);
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [delegateUserId, setDelegateUserId] = useState('');

  if (!task) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Task Not Found</DialogTitle>
        <DialogContent>
          <Typography>The requested task could not be loaded.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const handleDelegate = async () => {
    if (!selectedUser) {
      setDelegationError('Please select a user to delegate to.');
      return;
    }
    setDelegationLoading(true);
    setDelegationError(null);
    try {
      // Assuming TaskService.delegateTask exists and takes taskId and userId
      await TaskService.delegateTask(task.id.toString(), selectedUser);
      setDelegateDialogOpen(false);
      onClose(); // Close main dialog after delegation
    } catch (error) { 
      console.error('Delegation failed:', error);
      setDelegationError('Failed to delegate task. Please try again.');
    } finally {
      setDelegationLoading(false);
    }
  };

  // Safely format dates
  const formatDate = (dateString: string | null | undefined) => {
    return dateString && !isNaN(Date.parse(dateString)) ? new Date(dateString).toLocaleString() : 'Not set';
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>{task.title}</Typography>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              Status: {task.status}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Description:</strong>
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {task.description || 'No description provided'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Typography variant="body2" color="textSecondary">
                <strong>Created:</strong> {formatDate(task.createdAt || task.created_at)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Due:</strong> {formatDate(task.dueDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                <strong>Priority:</strong> {task.priority}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Department:</strong> {task.departmentId || '-'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
           {/* Add Edit/Delete buttons if handlers are provided */}
          {onEdit && (
            <Button onClick={() => onEdit(task.id.toString())} color="primary">Edit</Button>
          )}
          {onDelete && (
            <Button onClick={() => onDelete(task.id.toString())} color="error">Delete</Button>
          )}
          
          {/* Delegate Task Button */}
          <Button
            color="secondary"
            variant="outlined"
            onClick={() => setDelegateDialogOpen(true)}
          >
            Delegate Task
          </Button>
           <Button onClick={onClose} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delegate Dialog */}
      <Dialog open={delegateDialogOpen} onClose={() => setDelegateDialogOpen(false)}>
        <DialogTitle>Delegate Task</DialogTitle>
        <DialogContent>
          <Typography>Enter user ID to delegate to:</Typography>
          <input
            type="text"
            value={delegateUserId}
            onChange={e => setDelegateUserId(e.target.value)}
            placeholder="User ID"
            style={{ width: '100%', marginTop: 8, marginBottom: 8 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelegateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (task && delegateUserId) {
                try {
                   await TaskService.delegateTask(task.id.toString(), delegateUserId); 
                   setDelegateDialogOpen(false);
                   onClose();
                } catch (error) {
                   console.error("Delegation failed:", error);
                }
              }
            }}
            variant="contained"
            color="primary"
            disabled={!delegateUserId}
          >
            Delegate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Helper function for status color (assuming similar logic needed)
const getStatusColor = (status: TaskStatus, theme: Theme): string => {
    switch (status) {
      case TaskStatus.PENDING: return theme.palette.warning.main;
      case TaskStatus.IN_PROGRESS: return theme.palette.info.main;
      case TaskStatus.COMPLETED: return theme.palette.success.main;
      case TaskStatus.CANCELLED: return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
};

export default TaskViewDialog;