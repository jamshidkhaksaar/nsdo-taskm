import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { SelectChangeEvent } from '@mui/material/Select';
import { TaskPriority } from '../types/task';
import { Task } from '../types/task';
import { TaskService } from '../services/task';
import { UserService } from '../services/user';
import type { User } from '../types/user';
import { RootState } from '../store';
import { Autocomplete } from '@mui/material';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ open, onClose, setTasks }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [is_private, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newTask = {
        title,
        description,
        due_date: dueDate.toISOString(),
        priority,
        status: 'todo' as const,
        is_private,
        department: selectedUser?.department?.id || null,
        assigned_to: selectedUser?.id?.toString() || null,
        created_by: currentUser?.id || 0,
      };

      await TaskService.createTask(newTask);
      onClose();
      // Refresh tasks after creation
      const updatedTasks = await TaskService.getTasks();
      setTasks(updatedTasks);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Task</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            error={!!error}
            helperText={error}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Due Date"
              value={dueDate}
              onChange={(newValue: Date | null) => setDueDate(newValue || new Date())}
              sx={{ mb: 2, width: '100%' }}
            />
          </LocalizationProvider>
          <Autocomplete
            options={users}
            getOptionLabel={(user) => `${user.first_name} ${user.last_name}`}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            onInputChange={(_, newInputValue) => {
              setUserSearch(newInputValue);
              if (newInputValue.length > 2) {
                UserService.searchUsers(newInputValue).then(setUsers);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign to user"
                placeholder="Search users..."
              />
            )}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              onChange={(e: SelectChangeEvent) => setPriority(e.target.value as TaskPriority)}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};
