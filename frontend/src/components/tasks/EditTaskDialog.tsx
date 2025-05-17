import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button,
  Box, CircularProgress, Alert, Typography
} from '@mui/material';
import { TaskService } from '@/services/task';
import { Task } from '@/types/index';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNavigate } from 'react-router-dom';

interface EditTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  taskId: string | null;
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({ open, onClose, onTaskUpdated, taskId }) => {
  const navigate = useNavigate();
  const { error: fetchError, handleError, clearError } = useErrorHandler();

  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    if (open && taskId) {
      const fetchDetails = async () => {
        clearError();
        setTask(null);
        try {
          const taskDetails = await TaskService.getTaskDetails(taskId);
          setTask(taskDetails);
        } catch (err: any) {
          console.error("[EditTaskDialog] Fetch error:", err);
          handleError(`Failed to load task details: ${err.message || 'Unknown error'}`);
        }
      };
      fetchDetails();
    } else {
        setTask(null);
    }
  }, [open, taskId, clearError, handleError]);

  const handleAssignUsers = () => {
    if (task && task.id) {
      navigate('/users', { state: { taskId: task.id } });
    } else {
      console.error("Cannot navigate to assign users: task or task.id is missing.");
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={false}
      keepMounted
    >
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          {fetchError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {fetchError}
            </Alert>
          )}
          {!task && !fetchError ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : task ? (
            <>
              <Typography>Task details for {task.title} would be editable here.</Typography>
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleAssignUsers}
                  disabled={!task || !task.id}
                >
                  Assign Users to this Task
                </Button>
              </Box>
            </>
          ) : (
            <Typography>Task not found or unable to load.</Typography>
          )}
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => { /* Handle Save */ }}
              variant="contained"
              disabled={!task /* Add other conditions if form exists */}
            >
              Save
            </Button>
        </DialogActions>
    </Dialog>
  );
};

export default EditTaskDialog; 