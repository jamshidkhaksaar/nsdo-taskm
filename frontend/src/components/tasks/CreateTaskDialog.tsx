import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormHelperText,
  Autocomplete,
  Chip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TaskService } from '../../services/task';
import { CreateTask, Task } from '../../types/task';
import { User } from '../../types/user';
import { RootState } from '../../store';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  task?: Task; // Optional task for edit mode
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onTaskCreated,
  task
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Reset form when dialog opens or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        // Edit mode - populate form with task data
        setTitle(task.title);
        setDescription(task.description || '');
        setDueDate(task.due_date ? new Date(task.due_date) : new Date());
        // Fetch and set assigned users
        const fetchAssignedUsers = async () => {
          try {
            const response = await TaskService.getUsers();
            const assignedUsers = response.filter(user => 
              task.assigned_to?.includes(user.id.toString())
            );
            setSelectedUsers(assignedUsers);
            setUsers(response);
          } catch (err) {
            console.error('Error fetching users:', err);
          }
        };
        fetchAssignedUsers();
      } else {
        // Create mode - reset form
        setTitle('');
        setDescription('');
        setDueDate(new Date());
        setSelectedUsers([]);
        // Fetch users for assignment
        const fetchUsers = async () => {
          try {
            const response = await TaskService.getUsers();
            setUsers(response);
          } catch (err) {
            console.error('Error fetching users:', err);
          }
        };
        fetchUsers();
      }
    }
  }, [open, task]);

  const handleSubmit = async () => {
    if (!title || !dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const taskData = {
        title,
        description,
        due_date: dueDate.toISOString(),
        is_private: isPrivate,
        department: null,
        assigned_to: selectedUsers.map(user => user.id.toString()),
        created_by: user?.id?.toString() || null,
        updated_at: new Date().toISOString()
      };

      if (task) {
        // Update existing task - don't include status or priority in update
        console.log('Updating task with data:', taskData);
        await TaskService.updateTask(task.id, taskData);
      } else {
        // Create new task - include default status and priority
        const createTaskData = {
          ...taskData,
          priority: 'medium',
          status: 'todo' as const,
        };
        console.log('Creating task with data:', createTaskData);
        await TaskService.createTask(createTaskData as CreateTask);
      }

      if (onTaskCreated) {
        await onTaskCreated();
      }

      setTitle('');
      setDescription('');
      setDueDate(new Date());
      setSelectedUsers([]);
      onClose();
    } catch (err) {
      console.error(task ? 'Error updating task:' : 'Error creating task:', err);
      setError(task ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          minWidth: '500px',
        },
      }}
    >
      <DialogTitle sx={{ color: '#fff' }}>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#fff',
                },
              },
              '& .MuiInputBase-input': {
                color: '#fff',
              },
            }}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#fff',
                },
              },
              '& .MuiInputBase-input': {
                color: '#fff',
              },
            }}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Due Date"
              value={dueDate}
              onChange={(newValue: Date | null) => setDueDate(newValue)}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />
          </LocalizationProvider>

          <Autocomplete
            multiple
            options={users}
            value={selectedUsers}
            onChange={(_, newValue) => setSelectedUsers(newValue)}
            getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.username})`}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign To"
                placeholder="Search users..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={`${option.first_name} ${option.last_name}`}
                  {...getTagProps({ index })}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        color: '#fff',
                      },
                    },
                  }}
                />
              ))
            }
          />

          {error && (
            <FormHelperText error>
              {error}
            </FormHelperText>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              color: '#fff',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:disabled': {
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.3)',
            }
          }}
        >
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskDialog;
