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
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
const LocalizationProvider = lazy(() => import('@mui/x-date-pickers/LocalizationProvider').then(m => ({ default: m.LocalizationProvider })));
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
const DateTimePicker = lazy(() => import('@mui/x-date-pickers/DateTimePicker').then(m => ({ default: m.DateTimePicker })));
import { TaskService } from '../../services/task';
import { Task, TaskStatus, TaskPriority, CreateTask, TaskType } from '../../types/task';
import { User } from '../../types/user';
import { RootState } from '../../store';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';
import { isValidDueDate } from '../../utils/dateUtils';
// import { UserService } from '../../services/user';
import type { Department } from '../../types/department';
import { DateTimeValidationError } from '@mui/x-date-pickers/models';
import { Dayjs } from 'dayjs';

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
  preSelectedDepartmentIds?: string[]; // <<< Add new prop for multiple departments
  preSelectedProvince?: string | null; // For pre-selecting a province
  departmentsList?: Department[]; // Accept departments list from parent
  selectedUserId?: string; // Add selectedUserId for task assignment from user page
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
  preSelectedDepartmentIds, // <<< Destructure new prop
  preSelectedProvince,
  departmentsList,
  selectedUserId
}) => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { provinces } = useSelector((state: RootState) => state.provinces);
  const theme = useTheme();
  const isMobileQuery = useMediaQuery('(max-width:768px)');
  const isMobile = isMobileQuery;
  const glassStyles = getGlassmorphismStyles(theme);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState<Dayjs | null>(task?.dueDate ? task.dueDate.toDayjs() : null);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || TaskPriority.MEDIUM);
  const status = task?.status || initialStatus || TaskStatus.PENDING;
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [department, setDepartment] = useState<string>(''); // Keep for single selection if needed elsewhere
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]); // State for multi-department assignment
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null); // State for province selection
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
    setSelectedProvinceId(null); // Reset province selection
    setPriority(TaskPriority.MEDIUM);
    setError(null); // Reset errors
    setDateError(null);
    // Reset pageContext based on dialogMode if provided, else fallback
    setPageContext(dialogMode || (dialogType === 'personal' ? 'dashboard' : 'user'));
  };

  // Initialize pageContext based on dialogMode or fallback to dialogType
  // Modify initial context based on pre-selected props
  const [pageContext, setPageContext] = useState<'dashboard' | 'department' | 'user'>(() => {
      if (preSelectedDepartmentIds && preSelectedDepartmentIds.length > 0) return 'department';
      if (preSelectedUsers && preSelectedUsers.length > 0) return 'user';
      if (preSelectedDepartment) return 'department'; // Keep for single pre-selection?
      if (selectedUserId) return 'user';
      return dialogMode || (dialogType === 'personal' ? 'dashboard' : 'user');
  });

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

  // Second effect: handles form initialization with existing data OR pre-selections
  useEffect(() => {
    if (!open) return; // Don't do anything if dialog is closed

    // Set pre-selected values if provided
    if (preSelectedDepartmentIds && preSelectedDepartmentIds.length > 0) {
        setSelectedDepartmentIds(preSelectedDepartmentIds);
        setPageContext('department'); // Ensure context is department
        // Disable single department selection if multiple are pre-selected?
        setDepartment(''); // Clear single department state
    } else if (preSelectedDepartment) {
        setDepartment(preSelectedDepartment);
        setSelectedDepartmentIds([preSelectedDepartment]); // Treat single pre-select as multi
        setPageContext('department');
    } else {
        // Clear department selections if not pre-selected
        setDepartment('');
        setSelectedDepartmentIds([]);
    }

    // Set pre-selected province if provided
    if (preSelectedProvince) {
        setSelectedProvinceId(preSelectedProvince);
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
      setDueDate(task.dueDate ? task.dueDate.toDayjs() : null);
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

      // Handle existing assignments (assuming Task type has assignedToDepartmentIds)
      if (task.assignedToDepartmentIds && task.assignedToDepartmentIds.length > 0) {
         setSelectedDepartmentIds(task.assignedToDepartmentIds);
         setPageContext('department');
      } else {
         // Clear if editing a task that previously had no dept assignments
         setSelectedDepartmentIds([]);
      }
    } else {
      // Create mode - reset form, applying pre-selections handled above
      setTitle('');
      setDescription('');
      setDueDate(null);
      setPriority(TaskPriority.MEDIUM);
      setError(null);
      setDateError(null);
      // Keep pre-selections, don't call resetForm() directly here
      if (!(preSelectedDepartmentIds && preSelectedDepartmentIds.length > 0) && !preSelectedDepartment) {
          setSelectedDepartmentIds([]);
      }
    }
  }, [open, task, preSelectedDepartment, preSelectedUsers, preSelectedDepartmentIds]); // Add preSelectedDepartmentIds dependency

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

  // Initialize selectedUsers if selectedUserId is provided
  useEffect(() => {
    if (selectedUserId && users.length > 0 && pageContext === 'user') {
      const targetUser = users.find(user => user.id === selectedUserId);
      if (targetUser && (!selectedUsers || selectedUsers.length === 0)) {
        setSelectedUsers([targetUser]);
        console.log('[Task Dialog] Setting selected user:', targetUser);
      }
    }
  }, [selectedUserId, users, pageContext, selectedUsers]);

  const validateDueDate = (date: Dayjs | null): boolean => {
    if (!date) {
      setError('Due date is required');
      return false;
    }

    if (!isValidDueDate(date.toDate())) {
      setError('Due date must be in the future');
      return false;
    }

    return true;
  };

  const handleDueDateChange = (newValue: Dayjs | null) => {
    setDueDate(newValue);
    if (newValue) {
      validateDueDate(newValue);
    }
  };

  // Define the DatePicker change handler with correct value type
  const handleDateChange = (value: Dayjs | null /*, context: any */) => { // Context type might be inferred
    setDueDate(value);
  };

  const handleSubmit = async () => {
    console.log('[Submit] Clicked. Current State:', {
      title, description, dueDate, priority, status,
      pageContext, department, selectedUsers, collaborators,
      dialogMode, preSelectedDepartment, selectedUserId,
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
    if (pageContext === 'user' && selectedUsers.length === 0 && !selectedUserId) {
       setError('Please assign at least one user');
       console.log('[Submit] Validation failed: No user assigned in user context');
       return;
    }

    console.log('[Submit] Validation passed. Setting loading true.');
    setLoading(true);
    setError(null);

    let taskType: TaskType = TaskType.USER; // Default
    if (selectedDepartmentIds.length > 0) {
      if (selectedProvinceId) {
        taskType = TaskType.PROVINCE_DEPARTMENT;
      } else {
        taskType = TaskType.DEPARTMENT;
      }
    } else if (selectedUsers.length > 0) {
      taskType = TaskType.USER;
    } else {
      taskType = TaskType.PERSONAL;
    }

    const taskData: CreateTask = {
      title,
      description,
      priority,
      status: initialStatus || TaskStatus.PENDING, // Use initialStatus if provided
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      type: taskType,
      assignedToDepartmentIds: selectedDepartmentIds.length > 0 ? selectedDepartmentIds : undefined, // Pass the selected IDs
      assignedToUserIds: selectedUsers.length > 0 ? selectedUsers.map(u => u.id.toString()) : undefined, // Pass selected user IDs
      assignedToProvinceId: selectedProvinceId
      // createdById is handled by backend
    };

    console.log('Submitting Task Data:', taskData);

    try {
      if (task) {
        // Update existing task
        // Ensure update service handles assignedToDepartmentIds
        // await TaskService.updateTask(task.id, taskData); // Might need a different DTO for update
        if (onTaskUpdated) {
          // onTaskUpdated(updatedTask); // Pass back updated task
        }
        alert('Task updated successfully!'); // Placeholder
      } else {
        // Create new task
        await TaskService.createTask(taskData);
        onTaskCreated();
        alert('Task created successfully!'); // Placeholder
      }
      onClose(); // Close dialog on success
      resetForm();
    } catch (err: any) { // Catch specific error types if possible
      console.error('Error saving task:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save task');
    } finally {
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
                  onChange={handleDateChange}
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

            {/* Province selector */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="province-select-label" sx={glassStyles.inputLabel}>Province</InputLabel>
              <Select
                labelId="province-select-label"
                value={selectedProvinceId || ''}
                onChange={(e) => setSelectedProvinceId(e.target.value === '' ? null : e.target.value)}
                label="Province"
                sx={{
                  '& .MuiOutlinedInput-root': glassStyles.input,
                }}
              >
                <MenuItem value="">None</MenuItem>
                {provinces?.map((province: any) => (
                  <MenuItem key={province.id} value={province.id}>
                    {province.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
                onChange={handleDateChange}
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









