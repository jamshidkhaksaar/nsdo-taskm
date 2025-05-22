import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TaskService } from '../../services/task';
import { CreateTask, TaskPriority, TaskStatus, TaskType } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  assignedUserIds: string[];
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ open, onClose, assignedUserIds }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createTaskMutation = useMutation({
    mutationFn: (newTask: CreateTask) => TaskService.createTask(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to create task. Please try again.');
    },
  });

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setPriority(TaskPriority.MEDIUM);
      setDueDate(null);
      setError(null);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (assignedUserIds.length === 0) {
      setError('At least one user must be selected to assign the task.');
      return;
    }
    setError(null);

    const taskData: CreateTask = {
      title,
      description,
      priority,
      status: TaskStatus.PENDING,
      type: TaskType.USER,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      assignedToUserIds: assignedUserIds,
    };
    createTaskMutation.mutate(taskData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create and Assign New Task</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="title"
            label="Task Title"
            type="text"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            id="description"
            label="Task Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }} variant="outlined">
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select
              labelId="priority-label"
              id="priority"
              value={priority}
              label="Priority"
              onChange={(e: SelectChangeEvent<TaskPriority>) => setPriority(e.target.value as TaskPriority)}
            >
              <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
              <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
              <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
            </Select>
          </FormControl>
          <DatePicker
            label="Due Date"
            value={dueDate}
            onChange={(newValue) => setDueDate(newValue)}
            slotProps={{ textField: { fullWidth: true, variant: 'outlined', sx:{ mb: 2 } } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            disabled={createTaskMutation.isPending || assignedUserIds.length === 0}
          >
            {createTaskMutation.isPending ? <CircularProgress size={24} /> : `Create & Assign (${assignedUserIds.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateTaskDialog; 