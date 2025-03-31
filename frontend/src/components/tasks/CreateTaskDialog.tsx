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
  MenuItem,
  useTheme,
  Select,
  IconButton,
  Alert,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TaskService } from '../../services/task';
import { CreateTask, Task, TaskStatus, TaskPriority, TaskUpdate } from '../../types/task';
import { User } from '../../types/user';
import { RootState } from '../../store';
import { Department, DepartmentService } from '../../services/department';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';
import { isValidDueDate } from '../../utils/dateUtils';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  onTaskUpdated?: (task: Task) => void;
  task?: Task;
  dialogType: 'personal' | 'assign'; // 'personal' for My Tasks, 'assign' for Assigned by Me
  initialStatus?: TaskStatus; // Add initialStatus prop
  dialogMode?: 'dashboard' | 'department' | 'user'; // Control which fields are shown
  preSelectedDepartment?: string; // For pre-selecting a department
  preSelectedUsers?: User[]; // For pre-selecting users
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onTaskCreated,
  onTaskUpdated,
  task,
  dialogType,
  initialStatus,
  dialogMode,
  preSelectedDepartment,
  preSelectedUsers
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
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [department, setDepartment] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Store the current page context - this will be set based on props
  const [pageContext, setPageContext] = useState<'dashboard' | 'department' | 'user'>(
    dialogMode || (dialogType === 'personal' ? 'dashboard' : 
    dialogType === 'assign' ? 'user' : 'department')
  );

  // Check if user has general manager or admin role
  const isGeneralManagerOrAdmin = user?.role === 'general_manager' || user?.role === 'admin';

  // Helper function to reset the form - defined early so it can be used in useEffect
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(null);
    setCollaborators([]);
    setDepartment('');
    setPriority(TaskPriority.MEDIUM);
  };
  
  // Split the effects to separate concerns
  // First effect: handles data fetching when dialog opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch if dialog is open
        if (open) {
          // Fetch departments
          const deptResponse = await DepartmentService.getDepartments();
          setDepartments(deptResponse);
          
          // Fetch users
          const response = await TaskService.getUsers();
          setUsers(response);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    
    fetchData();
  }, [open]); // Only depend on dialog open state

  // Second effect: handles form initialization with existing data
  useEffect(() => {
    if (!open) return; // Don't do anything if dialog is closed
    
    // Set pre-selected values if provided
    if (preSelectedDepartment) {
      setDepartment(preSelectedDepartment);
    }
    
    if (preSelectedUsers && preSelectedUsers.length > 0) {
      if (pageContext === 'dashboard') {
        setCollaborators(preSelectedUsers);
      } else if (pageContext === 'user') {
        setSelectedUsers(preSelectedUsers);
      }
    }
    
    if (task) {
      // Edit mode - populate form with task data
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.due_date ? new Date(task.due_date) : new Date());
      // Ensure priority is set from the task, defaulting to medium if not present
      setPriority(task.priority || 'medium');
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
    } else {
      // Create mode - reset form (including setting priority to medium)
      resetForm();
    }
  }, [open, task, preSelectedDepartment, preSelectedUsers, pageContext]);
  
  // Third effect: Update user assignments after users are loaded
  useEffect(() => {
    if (!open || !task || users.length === 0) return;
    
    // Determine if users are collaborators or assignees based on task context
    if (task.context === 'personal') {
      // For personal tasks, we treat assigned_to as collaborators
      const taskCollaborators = users.filter(user => 
        task.assigned_to?.includes(user.id.toString())
      );
      setCollaborators(taskCollaborators);
      setSelectedUsers([]);
    } else {
      // For department or user tasks, these are assignees
      const assignedUsers = users.filter(user => 
        task.assigned_to?.includes(user.id.toString())
      );
      setSelectedUsers(assignedUsers);
      setCollaborators([]);
    }
  }, [open, task, users]); // Only run when users or task changes

  const validateDueDate = (date: Date | null): boolean => {
    if (!date) {
      setError('Due date is required');
      return false;
    }

    if (!isValidDueDate(date)) {
      setError('Due date must be in the future');
      return false;
    }

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

    // Validate department if in department context
    if (pageContext === 'department' && !department) {
      setError('Please select a department');
      return;
    }

    // Validate user assignments if in user context
    if (pageContext === 'user' && selectedUsers.length === 0) {
      setError('Please select at least one user to assign');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (task) {
        // Update existing task
        const updateData: TaskUpdate = {
          title,
          description,
          due_date: dueDate?.toISOString(),
          priority,
          department: pageContext === 'department' ? department : task.department,
          assigned_to: pageContext === 'user' 
            ? selectedUsers.map(u => u.id.toString())
            : pageContext === 'dashboard' 
              ? collaborators.map(c => c.id.toString()) 
              : task.assigned_to
        };

        const updatedTask = await TaskService.updateTask(task.id, updateData);
        
        if (onTaskUpdated) {
          onTaskUpdated(updatedTask);
        }
      } else {
        // Create new task
        const newTask: CreateTask = {
          title,
          description,
          due_date: dueDate?.toISOString() || new Date().toISOString(),
          priority,
          status: initialStatus || TaskStatus.PENDING,
          context: pageContext === 'dashboard' 
            ? 'personal'
            : pageContext === 'department' 
              ? 'department' 
              : 'user',
        };

        // Add department if in department context
        if (pageContext === 'department') {
          newTask.department = department;
        }

        // Add user assignments based on context
        if (pageContext === 'user') {
          newTask.assigned_to = selectedUsers.map(user => user.id.toString());
        } else if (pageContext === 'dashboard' && collaborators.length > 0) {
          newTask.assigned_to = collaborators.map(user => user.id.toString());
        }

        await TaskService.createTask(newTask);
        onTaskCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      setError(error instanceof Error ? error.message : 'Failed to save task. Please try again.');
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
          // Ensure dialog doesn't interfere with poppers
          overflow: 'visible',
        },
      }}
    >
      <DialogTitle sx={{ ...glassStyles.text.primary }}>
        {task ? 'Edit Task' : getDialogTitle()}
      </DialogTitle>
      
      <DialogContent sx={{ overflow: 'visible' }}>
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
                },
                popper: { 
                  sx: { zIndex: 9999 } 
                }
              }}
            />
          </LocalizationProvider>
          {dateError && (
            <FormHelperText error>
              {dateError}
            </FormHelperText>
          )}
          
          {/* Priority selector */}
          <TextField
            select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            fullWidth
            InputLabelProps={{
              style: glassStyles.inputLabel
            }}
            sx={{
              '& .MuiOutlinedInput-root': glassStyles.input,
            }}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
          
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
              componentsProps={{
                popper: {
                  sx: { zIndex: 9999 }
                }
              }}
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
              componentsProps={{
                popper: {
                  sx: { zIndex: 9999 }
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Collaborators (Optional)"
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









