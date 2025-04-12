import React, { useState, useEffect, Suspense, lazy } from 'react';
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
  useMediaQuery,
  Drawer,
  Select,
  IconButton,
  Alert,
} from '@mui/material';
const LocalizationProvider = lazy(() => import('@mui/x-date-pickers/LocalizationProvider').then(m => ({ default: m.LocalizationProvider })));
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
const DateTimePicker = lazy(() => import('@mui/x-date-pickers/DateTimePicker').then(m => ({ default: m.DateTimePicker })));
import { TaskService } from '../../services/task';
import { Task, TaskStatus, TaskPriority, TaskUpdate, DepartmentRef, CreateTask } from '../../types/task';
import { User } from '../../types/user';
import { RootState } from '../../store';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';
import { isValidDueDate } from '../../utils/dateUtils';
import { UserService } from '../../services/user';
import { Department } from '../../services/department';

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
  departmentsList?: Department[]; // Accept departments list from parent
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
  preSelectedUsers,
  departmentsList
}) => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isMobileQuery = useMediaQuery('(max-width:768px)');
  const isMobile = isMobileQuery;
  const glassStyles = getGlassmorphismStyles(theme);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState<Date | null>(task?.dueDate ? new Date(task.dueDate) : null);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || TaskPriority.MEDIUM);
  const [status, setStatus] = useState<TaskStatus>(task?.status || initialStatus || TaskStatus.PENDING);
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [department, setDepartment] = useState<string>(task?.department && typeof task.department === 'string' ? task.department : (task?.department as DepartmentRef)?.id || '');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(null);
    setCollaborators([]);
    setSelectedUsers([]); // Also reset selected users
    // Only reset department if not forced by dialogMode
    if (dialogMode !== 'department') {
      setDepartment('');
    }
    setPriority(TaskPriority.MEDIUM);
    setError(null); // Reset errors
    setDateError(null);
    // Reset pageContext based on dialogMode if provided, else fallback
    setPageContext(dialogMode || (dialogType === 'personal' ? 'dashboard' : 'user'));
  };

  // Initialize pageContext based on dialogMode or fallback to dialogType
  const [pageContext, setPageContext] = useState<'dashboard' | 'department' | 'user'>(
    dialogMode || (dialogType === 'personal' ? 'dashboard' : 'user')
  );

  // Check if user has general manager or admin role
  const isGeneralManagerOrAdmin = currentUser?.role === 'general_manager' || currentUser?.role === 'admin';

  // Simplified effect to fetch just users when dialog opens
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (open) {
          const response = await TaskService.getUsers();
          setUsers(response);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    
    fetchUsers();
  }, [open]);

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
      setDueDate(task.dueDate ? new Date(task.dueDate) : new Date());
      // Ensure priority is set from the task, defaulting to MEDIUM if not present
      setPriority(task.priority || TaskPriority.MEDIUM);
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

  // When dialogMode is 'department', enforce the preSelectedDepartment
  useEffect(() => {
    if (dialogMode === 'department' && preSelectedDepartment) {
      setDepartment(preSelectedDepartment);
      // Ensure context reflects this if it wasn't set initially
      if (pageContext !== 'department') {
        setPageContext('department');
      }
      // Clear any potential validation error once department is set
      setError(null); 
    } else if (dialogMode === 'user' && preSelectedUsers) {
      setSelectedUsers(preSelectedUsers);
      if (pageContext !== 'user') {
        setPageContext('user');
      }
      setError(null); // Also clear error for user mode
    } else if (dialogMode === 'dashboard' && pageContext !== 'dashboard') {
       setPageContext('dashboard');
       setError(null); // Clear error for dashboard mode too
    }
  }, [dialogMode, preSelectedDepartment, preSelectedUsers, pageContext]);

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
    console.log('[Submit] Clicked. Current State:', {
      title, description, dueDate, priority, status, 
      pageContext, department, selectedUsers, collaborators,
      dialogMode, preSelectedDepartment,
      error, dateError, loading
    });

    // Basic validation
    if (!title) {
      setError('Title is required');
      console.log('[Submit] Validation failed: Title missing');
      return;
    }
    if (!dueDate) {
      setError('Due date is required');
      console.log('[Submit] Validation failed: Due Date missing');
      return;
    }
    if (dateError) {
      setError(dateError); // Use the specific date error
      console.log('[Submit] Validation failed: Due Date invalid');
      return;
    }

    // Department Validation (Specific to department context)
    if (pageContext === 'department' && !department) {
      setError('Please select a department');
      console.log('[Submit] Validation failed: Department missing in department context');
      return;
    }
    
    // User Assignment Validation (Specific to user context)
    if (pageContext === 'user' && selectedUsers.length === 0) {
       setError('Please assign at least one user');
       console.log('[Submit] Validation failed: No user assigned in user context');
       return;
    }

    console.log('[Submit] Validation passed. Setting loading true.');
    setLoading(true);
    setError(null);

    try {
      if (task) {
        // === Update Task Logic ===
        console.log('[Submit] Updating task...');
        const updateData: TaskUpdate = { 
          title,
          description,
          status,
          priority,
          dueDate: dueDate.toISOString(),
          assigned_to: pageContext === 'user' 
            ? selectedUsers.map(u => u.id.toString()) 
            : pageContext === 'dashboard'
              ? collaborators.map(c => c.id.toString()) 
              : task.assigned_to,
          departmentId: pageContext === 'department' ? department : undefined,
        };
        console.log('[Submit] Update Payload:', updateData);
        const updatedTask = await TaskService.updateTask(String(task.id), updateData);
        if (onTaskUpdated) {
          onTaskUpdated(updatedTask);
        }
        console.log('[Submit] Task updated successfully.');

      } else {
        // === Create New Task Logic ===
        console.log('[Submit] Creating new task...');
        const newTask: CreateTask = {
          title,
          description,
          dueDate: dueDate.toISOString(),
          priority,
          status: initialStatus || TaskStatus.PENDING,
          departmentId: undefined, // Initialize
          assigned_to: undefined // Initialize
        };

        // Add departmentId if in department context
        if (pageContext === 'department' && department) {
          newTask.departmentId = department;
        }

        // Add user assignments based on context
        if (pageContext === 'user' && selectedUsers.length > 0) {
          newTask.assigned_to = selectedUsers.map(user => user.id.toString());
        } else if (pageContext === 'dashboard' && collaborators.length > 0) {
          newTask.assigned_to = collaborators.map(user => user.id.toString());
        }
        
        console.log('[Submit] Create Payload:', newTask);
        await TaskService.createTask(newTask);
        onTaskCreated();
        console.log('[Submit] Task created successfully.');
      }

      onClose();
    } catch (err) {
      console.error('[Submit] Error saving task:', err);
      // Improved error handling from response
      let message = 'Failed to save task. Please try again.';
      if (err instanceof Error && (err as any).response?.data?.message) {
        message = Array.isArray((err as any).response.data.message) 
          ? (err as any).response.data.message.join(', ') 
          : (err as any).response.data.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      console.log('[Submit] Resetting loading state.');
      setLoading(false);
    }
  };

  function getDialogTitle() {
    if (task) return 'Edit Task';
    
    switch(pageContext) {
      case 'dashboard': return 'Create Personal Task';
      case 'department': return 'Create Department Task';
      case 'user': return 'Assign Task to User';
      default: return 'Create Task';
    }
  }

  // Conditionally render Drawer or Dialog based on isMobile
  return isMobile ? (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          backgroundColor: theme.palette.background.default,
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <DialogTitle sx={{ ...glassStyles.text.primary }}>{getDialogTitle()}</DialogTitle>
        <DialogContent sx={{ overflow: 'visible' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {/* Context selector */}
            {isGeneralManagerOrAdmin && !task && !dialogMode && (
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
            {/* Title */}
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
            {/* Description */}
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
            
            <Suspense fallback={<div>Loading Date Picker...</div>}>
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
            </Suspense>
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
            
            {/* Department selector: Hide if dialogMode is 'department' */}
            {(pageContext === 'department' && dialogMode !== 'department') && (
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
                {departmentsList?.map((dept: Department) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            
            {/* Show selected department name (read-only) if mode is 'department' */}
            {(pageContext === 'department' && dialogMode === 'department') && (
              <TextField
                label="Department (Assigned)"
                value={departmentsList?.find((d: Department) => d.id === department)?.name || department || ''}
                disabled
                fullWidth
                InputLabelProps={{
                  style: glassStyles.inputLabel
                }}
                sx={{
                  '& .MuiOutlinedInput-root': glassStyles.input,
                }}
              />
            )}
            
            {/* User assignment: Hide if dialogMode is 'user' */}
            {(pageContext === 'user' && dialogMode !== 'user') && (
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
            
            {/* Show selected users (read-only) if mode is 'user' */}
            {(pageContext === 'user' && dialogMode === 'user') && (
              <Autocomplete
                multiple
                readOnly
                options={selectedUsers}
                value={selectedUsers}
                getOptionLabel={(option: User) => `${option.first_name} ${option.last_name} (${option.username})`}
                componentsProps={{
                  popper: {
                    sx: { zIndex: 9999 }
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Users (Assigned)"
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
            
            {/* Collaborators (only for dashboard/personal context) */}
            {pageContext === 'dashboard' && (
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
      </Box>
    </Drawer>
  ) : (
    <Dialog 
      open={open} 
      onClose={onClose} 
      PaperProps={{ sx: { ...glassStyles.form, minWidth: '500px', overflow: 'visible' } }}
    >
      <DialogTitle sx={{ ...glassStyles.text.primary }}>{getDialogTitle()}</DialogTitle>
      <DialogContent sx={{ overflow: 'visible' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* Context selector */}
          {isGeneralManagerOrAdmin && !task && !dialogMode && (
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
          {/* Title */}
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
          {/* Description */}
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
          
          <Suspense fallback={<div>Loading Date Picker...</div>}>
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
          </Suspense>
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
          
          {/* Department selector: Hide if dialogMode is 'department' */}
          {(pageContext === 'department' && dialogMode !== 'department') && (
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
              {departmentsList?.map((dept: Department) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          
          {/* Show selected department name (read-only) if mode is 'department' */}
          {(pageContext === 'department' && dialogMode === 'department') && (
            <TextField
              label="Department (Assigned)"
              value={departmentsList?.find((d: Department) => d.id === department)?.name || department || ''}
              disabled
              fullWidth
              InputLabelProps={{
                style: glassStyles.inputLabel
              }}
              sx={{
                '& .MuiOutlinedInput-root': glassStyles.input,
              }}
            />
          )}
          
          {/* User assignment: Hide if dialogMode is 'user' */}
          {(pageContext === 'user' && dialogMode !== 'user') && (
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
          
          {/* Show selected users (read-only) if mode is 'user' */}
          {(pageContext === 'user' && dialogMode === 'user') && (
            <Autocomplete
              multiple
              readOnly
              options={selectedUsers}
              value={selectedUsers}
              getOptionLabel={(option: User) => `${option.first_name} ${option.last_name} (${option.username})`}
              componentsProps={{
                popper: {
                  sx: { zIndex: 9999 }
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Users (Assigned)"
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
          
          {/* Collaborators (only for dashboard/personal context) */}
          {pageContext === 'dashboard' && (
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
};

export default CreateTaskDialog;









