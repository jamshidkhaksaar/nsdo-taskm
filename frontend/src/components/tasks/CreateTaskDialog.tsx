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
  MenuItem,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TaskService } from '../../services/task';
import { CreateTask, Task } from '../../types/task';
import { User } from '../../types/user';
import { RootState } from '../../store';
import { Department, DepartmentService } from '../../services/department';
import axios from '../../utils/axios';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  task?: Task;
  dialogType: 'personal' | 'assign'; // 'personal' for My Tasks, 'assign' for Assigned by Me
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onTaskCreated,
  task,
  dialogType
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]); // Used in useEffect for user management
  const [department, setDepartment] = useState<string>('');  // Changed from string | null to string with empty default
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (task) {
        // Edit mode - populate form with task data
        setTitle(task.title);
        setDescription(task.description || '');
        setDueDate(task.due_date ? new Date(task.due_date) : new Date());
        setDateError(null);
        setDepartment(task.department || '');
        
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
        // Create mode - reset form with future date
        setTitle('');
        setDescription('');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // Set to 9 AM tomorrow
        setDueDate(tomorrow);
        setDateError(null);
        setSelectedUsers([]);
        setDepartment('');
        
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
      
      // Fetch departments
      const fetchDepartments = async () => {
        try {
          const response = await DepartmentService.getDepartments();
          setDepartments(response);
        } catch (err) {
          console.error('Error fetching departments:', err);
        }
      };
      fetchDepartments();
    }
  }, [open, task]);

  const validateDueDate = (date: Date | null): boolean => {
    if (!date) {
      setDateError('Due date is required');
      return false;
    }

    const now = new Date();
    if (date <= now) {
      setDateError('Due date must be in the future');
      return false;
    }

    setDateError(null);
    return true;
  };

  const handleDueDateChange = (newValue: Date | null) => {
    setDueDate(newValue);
    if (newValue) {
      validateDueDate(newValue);
    }
  };

  const handleSubmit = async () => {
    if (!title) {
      setError('Please fill in all required fields');
      return;
    }

    if (!dueDate || !validateDueDate(dueDate)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const taskData = {
        title,
        description: description || '',
        due_date: dueDate.toISOString(),
        is_private: isPrivate,
        department: department || '',
        assigned_to: selectedUsers.map(user => user.id.toString()),
        created_by: user?.id?.toString() || '',
      };

      if (task) {
        // Update existing task
        console.log('Updating task with data:', taskData);
        await TaskService.updateTask(task.id, taskData);
      } else {
        // Create new task
        const createTaskData = {
          ...taskData,
          priority: 'medium',
          status: 'pending',
        };
        console.log('Creating task with data:', createTaskData);
        await TaskService.createTask(createTaskData as CreateTask);
      }

      if (onTaskCreated) {
        await onTaskCreated();
      }

      setTitle('');
      setDescription('');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setDueDate(tomorrow);
      setSelectedUsers([]);
      onClose();
    } catch (err: any) {
      console.error('Error creating task:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'Failed to create task. Please try again.';
      setError(errorMessage);
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
      <DialogTitle sx={{ color: '#fff' }}>
        {task ? 'Edit Task' : dialogType === 'personal' ? 'Create Personal Task' : 'Assign New Task'}
      </DialogTitle>
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
              onChange={handleDueDateChange}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: dateError ? 'error.main' : 'rgba(255, 255, 255, 0.23)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: dateError ? 'error.main' : 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />
          </LocalizationProvider>
          {dateError && (
            <FormHelperText error>
              {dateError}
            </FormHelperText>
          )}

          {dialogType === 'personal' ? (
            <Autocomplete
              multiple
              options={users}
              value={selectedUsers}
              onChange={(_: any, newValue: User[]) => setSelectedUsers(newValue)}
              getOptionLabel={(option: User) => `${option.first_name} ${option.last_name}`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Collaborate with (optional)"
                  placeholder="Search users to collaborate with..."
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
          ) : (
            <>
              <Autocomplete
                multiple
                options={users}
                value={selectedUsers}
                onChange={(_: any, newValue: User[]) => setSelectedUsers(newValue)}
                getOptionLabel={(option: User) => `${option.first_name} ${option.last_name} (${option.username})`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign To"
                    placeholder="Select users to assign task..."
                    required
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
              />
              <TextField
                select
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
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
                  '& .MuiSelect-icon': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              >
                <MenuItem value="">No Department</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}

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
          {task ? 'Update Task' : dialogType === 'personal' ? 'Create Task' : 'Assign Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskDialog;
