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
  useTheme,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TaskService } from '../../services/task';
import { CreateTask, Task, TaskStatus } from '../../types/task';
import { User } from '../../types/user';
import { RootState } from '../../store';
import { Department, DepartmentService } from '../../services/department';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  task?: Task;
  dialogType: 'personal' | 'assign'; // 'personal' for My Tasks, 'assign' for Assigned by Me
  initialStatus?: TaskStatus; // Add initialStatus prop
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onTaskCreated,
  task,
  dialogType,
  initialStatus
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const glassStyles = getGlassmorphismStyles(theme);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [isPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [department, setDepartment] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);
  
  // Store the current page context - this will be set based on the dialogType prop
  // or by general manager selection if they have that capability
  const [pageContext, setPageContext] = useState<'dashboard' | 'department' | 'user'>(
    dialogType === 'personal' ? 'dashboard' : 
    dialogType === 'assign' ? 'user' : 'department'
  );

  // Check if user has general manager or admin role
  const isGeneralManagerOrAdmin = user?.role === 'general_manager' || user?.role === 'admin';

  useEffect(() => {
    // Fetch departments for the dropdown
    const fetchDepartments = async () => {
      try {
        const deptResponse = await DepartmentService.getDepartments();
        setDepartments(deptResponse);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    
    // Fetch users for assignments or collaborators
    const fetchUsers = async () => {
      try {
        const response = await TaskService.getUsers();
        setUsers(response);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    
    if (open) {
      fetchDepartments();
      fetchUsers();
      
      if (task) {
        // Edit mode - populate form with task data
        setTitle(task.title);
        setDescription(task.description || '');
        setDueDate(task.due_date ? new Date(task.due_date) : new Date());
        setDateError(null);
        
        // Handle department which can be string, DepartmentRef, or null
        if (task.department) {
          if (typeof task.department === 'string') {
            setDepartment(task.department);
          } else if (typeof task.department === 'object' && 'id' in task.department) {
            setDepartment(task.department.id);
          }
        } else {
          setDepartment('');
        }
        
        // Determine if users are collaborators or assignees based on task context
        if (task && task.context === 'personal') {
          // For personal tasks, we treat assigned_to as collaborators
          const taskCollaborators = users.filter(user => 
            task.assigned_to?.includes(user.id.toString())
          );
          setCollaborators(taskCollaborators);
          setSelectedUsers([]);
        } else if (task) {
          // For department or user tasks, these are assignees
          const assignedUsers = users.filter(user => 
            task.assigned_to?.includes(user.id.toString())
          );
          setSelectedUsers(assignedUsers);
          setCollaborators([]);
        }
      } else {
        // Create mode - reset form
        resetForm();
      }
    }
  }, [open, task, users]);

  // Helper function to reset the form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Set to 9 AM tomorrow
    setDueDate(tomorrow);
    setDateError(null);
    setSelectedUsers([]);
    setCollaborators([]);
    setDepartment('');
  };

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

    // Validate based on context
    if (pageContext === 'department' && !department) {
      setError('Please select a department');
      return;
    }

    if (pageContext === 'user' && selectedUsers.length === 0) {
      setError('Please select at least one user to assign the task to');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Base task data
      const taskData: any = {
        title,
        description: description || '',
        due_date: dueDate.toISOString(),
        is_private: isPrivate,
        created_by: user?.id?.toString() || '',
      };

      // Add context-specific fields
      if (pageContext === 'dashboard') {
        // Personal task with optional collaborators
        taskData.context = 'personal';
        taskData.assigned_to = collaborators.map(user => user.id.toString());
      } else if (pageContext === 'department') {
        // Department task
        taskData.context = 'department';
        taskData.department = department;
      } else if (pageContext === 'user') {
        // User assignment
        taskData.context = 'user';
        taskData.assigned_to = selectedUsers.map(user => user.id.toString());
      }

      if (task) {
        // Update existing task
        console.log('Updating task with data:', taskData);
        await TaskService.updateTask(task.id, taskData);
      } else {
        // Create new task
        const createTaskData = {
          ...taskData,
          priority: 'medium',
          status: initialStatus || 'pending',
        };
        console.log('Creating task with data:', createTaskData);
        await TaskService.createTask(createTaskData as CreateTask, taskData.context);
      }

      if (onTaskCreated) {
        await onTaskCreated();
      }

      resetForm();
      onClose();
    } catch (err) {
      console.error('Error creating task:', err);
      // Safely access potentially undefined properties
      const errorResponse = (err as any)?.response;
      const errorMessage = errorResponse?.data?.error || errorResponse?.data?.detail || 'Failed to create task. Please try again.';
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
          ...glassStyles.form,
          minWidth: '500px',
        },
      }}
    >
      <DialogTitle sx={{ ...glassStyles.text.primary }}>
        {task ? 'Edit Task' : getDialogTitle()}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* Only show context selector for general managers who can create any type of task */}
          {isGeneralManagerOrAdmin && !task && (
            <TextField
              select
              label="Create Task For"
              value={pageContext}
              onChange={(e) => setPageContext(e.target.value as 'dashboard' | 'department' | 'user')}
              fullWidth
              InputLabelProps={{
                style: glassStyles.inputLabel
              }}
              sx={{
                '& .MuiOutlinedInput-root': glassStyles.input,
              }}
            >
              <MenuItem value="dashboard">Personal Task</MenuItem>
              <MenuItem value="department">Department Task</MenuItem>
              <MenuItem value="user">User Assignment</MenuItem>
            </TextField>
          )}
          
          {/* Regular form fields */}
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            InputLabelProps={{
              style: glassStyles.inputLabel
            }}
            sx={{
              '& .MuiOutlinedInput-root': glassStyles.input,
            }}
          />
          
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            fullWidth
            InputLabelProps={{
              style: glassStyles.inputLabel
            }}
            sx={{
              '& .MuiOutlinedInput-root': glassStyles.input,
            }}
          />
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Due Date"
              value={dueDate}
              onChange={handleDueDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  InputLabelProps: {
                    style: glassStyles.inputLabel
                  },
                  sx: {
                    '& .MuiOutlinedInput-root': glassStyles.input,
                  }
                }
              }}
            />
          </LocalizationProvider>
          {dateError && (
            <FormHelperText error>
              {dateError}
            </FormHelperText>
          )}
          
          {/* Show department selector only when in department context */}
          {(pageContext === 'department') && (
            <TextField
              select
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              fullWidth
              InputLabelProps={{
                style: glassStyles.inputLabel
              }}
              sx={{
                '& .MuiOutlinedInput-root': glassStyles.input,
              }}
            >
              <MenuItem value="">Select Department</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          
          {/* Show user assignment only when in user context */}
          {(pageContext === 'user') && (
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
                  InputLabelProps={{
                    style: glassStyles.inputLabel
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': glassStyles.input,
                  }}
                />
              )}
            />
          )}
          
          {/* Show collaborators selector only when in dashboard/personal context */}
          {(pageContext === 'dashboard') && (
            <Autocomplete
              multiple
              options={users}
              value={collaborators}
              onChange={(_: any, newValue: User[]) => setCollaborators(newValue)}
              getOptionLabel={(option: User) => `${option.first_name} ${option.last_name} (${option.username})`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Collaborators"
                  placeholder="Add collaborators (optional)"
                  InputLabelProps={{
                    style: glassStyles.inputLabel
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': glassStyles.input,
                  }}
                />
              )}
            />
          )}
          
          {error && (
            <FormHelperText error sx={{ fontSize: '0.9rem', mt: 1 }}>
              {error}
            </FormHelperText>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          sx={glassStyles.button}
        >
          {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // Helper function to get the dialog title based on context
  function getDialogTitle() {
    if (task) return 'Edit Task';
    
    switch(pageContext) {
      case 'dashboard': return 'Create Personal Task';
      case 'department': return 'Create Department Task';
      case 'user': return 'Assign Task to User';
      default: return 'Create Task';
    }
  }
};

export default CreateTaskDialog;
