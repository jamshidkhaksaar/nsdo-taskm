import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  TextField,
  Autocomplete,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import { Task, User, Department, Province, TaskStatus, TaskPriority, DelegateTaskData, TaskType } from '../../types/index';
import { UserService } from '../../services/user';
import { TaskService } from '../../services/task';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import useReferenceData from '@/hooks/useReferenceData';
import dayjs from 'dayjs';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';
import { useTaskPermissions } from '@/hooks/useTaskPermissions';
import { formatDate, DATE_FORMATS, parseDate } from '../../utils/dateUtils';

interface TaskViewDialogProps {
  open: boolean;
  onClose: () => void;
  taskId: string | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onChangeStatus?: (taskId: string, status: TaskStatus) => Promise<boolean>;
}

const TaskViewDialog: React.FC<TaskViewDialogProps> = ({ open, onClose, taskId, onEdit, onDelete, onChangeStatus }) => {
  const theme = useTheme();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { users, departments, provinces, loading: loadingRefData } = useReferenceData();
  const { error: fetchError, handleError, clearError } = useErrorHandler();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);

  const [delegateDialogOpen, setDelegateDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [delegationComment, setDelegationComment] = useState('');
  const [delegationError, setDelegationError] = useState<string | null>(null);
  const [delegationLoading, setDelegationLoading] = useState(false);
  const glassStyles = getGlassmorphismStyles(theme);

  const permissions = useTaskPermissions(task);

  useEffect(() => {
    if (open && taskId) {
      const fetchDetails = async () => {
        setLoading(true);
        clearError();
        setTask(null);
        try {
          console.log(`[TaskViewDialog] Fetching details for task ID: ${taskId}`);
          const taskDetails = await TaskService.getTaskDetails(taskId);
          setTask(taskDetails);
        } catch (err: any) {
          handleError(`Failed to load task details: ${err.message || 'Unknown error'}`);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
    if (!open) {
      setDelegateDialogOpen(false);
      setSelectedUsers([]);
      setDelegationComment('');
      setDelegationError(null);
      setDelegationLoading(false);
    }
  }, [open, taskId, clearError, handleError]);

  const getUserName = useCallback((userId: string | null | undefined): string => {
    if (!userId) return 'N/A';
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : `ID: ${userId}`;
  }, [users]);

  const getDepartmentName = useCallback((deptId: string | null | undefined): string => {
    if (!deptId) return 'N/A';
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : `ID: ${deptId}`;
  }, [departments]);

  const getProvinceName = useCallback((provinceId: string | null | undefined): string => {
    if (!provinceId) return 'N/A';
    const prov = provinces.find(p => p.id === provinceId);
    return prov ? prov.name : `ID: ${provinceId}`;
  }, [provinces]);

  const handleDelegateSubmit = async () => {
    if (!task || !taskId) return;

    const userIdsToDelegate = selectedUsers.map(user => user.id);

    if (userIdsToDelegate.length === 0) {
        setDelegationError("Please select at least one user.");
        return;
    }

    setDelegationLoading(true);
    setDelegationError(null);

    const delegationData: DelegateTaskData = {
        assignedToUserIds: userIdsToDelegate,
        comment: delegationComment || undefined,
    };

    try {
        console.log(`[TaskViewDialog] Delegating task ${taskId} with data:`, delegationData);
        const newTask = await TaskService.delegateTask(taskId, delegationData);
        console.log("[TaskViewDialog] Delegation successful, new task created/returned:", newTask);
        setDelegateDialogOpen(false);
    } catch (err: any) {
        console.error("Delegation failed:", err);
        handleError(`Delegation failed: ${err.message || 'Unknown error'}`);
        setDelegationError(`Delegation failed: ${err.message || 'Unknown error'}`);
    } finally {
        setDelegationLoading(false);
    }
  };

  const handleStatusChange = async (event: React.ChangeEvent<{ value: unknown }>) => {
    const newStatus = event.target.value as TaskStatus;
    if (task && taskId && permissions.canUpdateStatus) {
      setIsUpdatingStatus(true);
      try {
        let success = true;
        if (onChangeStatus) {
            console.log(`[TaskViewDialog] Calling prop onChangeStatus for task ${taskId} to ${newStatus}`);
            success = await onChangeStatus(taskId, newStatus);
        } else {
            console.warn(`[TaskViewDialog] onChangeStatus prop not provided. Falling back to internal service call.`);
            const updatedTask = await TaskService.changeTaskStatus(taskId, newStatus);
            setTask(updatedTask);
        }
        if (!success) {
            handleError('Failed to update status via parent component.');
        }
      } catch (err: any) {
        handleError(`Failed to update status: ${err.message || 'Unknown error'}`);
      } finally {
        setIsUpdatingStatus(false);
      }
    }
  };

  const handlePriorityChange = async (event: React.ChangeEvent<{ value: unknown }>) => {
    const newPriority = event.target.value as TaskPriority;
    if (task && taskId && permissions.canChangePriority) {
      setIsUpdatingPriority(true);
      try {
        const updatedTask = await TaskService.changeTaskPriority(taskId, newPriority);
        setTask(updatedTask);
      } catch (err: any) {
        handleError(`Failed to update priority: ${err.message || 'Unknown error'}`);
      } finally {
        setIsUpdatingPriority(false);
      }
    }
  };

  const handleCancelTask = async () => {
    if (task && taskId && permissions.canCancel) {
      console.log(`Attempting to cancel task: ${taskId}`);
      setLoading(true);
      try {
        const updatedTask = await TaskService.cancelTask(taskId);
        setTask(updatedTask);
      } catch (err: any) {
        handleError(`Failed to cancel task: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>;
    }
    if (fetchError) {
      return <Alert severity="error" sx={{ m: 2 }}>{fetchError}</Alert>;
    }
    if (!task) {
      console.warn("[TaskViewDialog] Render attempted when task state is null.");
      return <Typography sx={{ p: 2 }}>Task data not available or failed to load.</Typography>;
    }

    let creatorName = 'N/A';
    try {
        creatorName = getUserName(task.createdById); 
    } catch (e) {
        console.error("[TaskViewDialog] Error accessing creator name:", e);
        creatorName = 'Error';
    }

    let assigneesDisplay = 'N/A';
    try {
        if (task.type === TaskType.USER && task.assignedToUsers && task.assignedToUsers.length > 0) {
            assigneesDisplay = task.assignedToUsers.map(u => getUserName(u.id)).join(', ');
        } else if ((task.type === TaskType.DEPARTMENT || task.type === TaskType.PROVINCE_DEPARTMENT) && task.assignedToDepartments && task.assignedToDepartments.length > 0) {
            assigneesDisplay = task.assignedToDepartments.map(d => getDepartmentName(d.id)).join(', ');
        } else if (task.type === TaskType.PERSONAL) {
            assigneesDisplay = `Personal (${creatorName})`;
        }
    } catch (e) {
         console.error("[TaskViewDialog] Error processing assignees:", e);
         assigneesDisplay = 'Error';
    }

    let provinceDisplay = 'N/A';
    try {
        if (task.assignedToProvinceId) {
            provinceDisplay = getProvinceName(task.assignedToProvinceId);
        }
    } catch (e) {
         console.error("[TaskViewDialog] Error processing province:", e);
         provinceDisplay = 'Error';
    }
    
    let delegatedFromDisplay = 'N/A';
    try {
        if (task.isDelegated && task.delegatedByUserId) {
            delegatedFromDisplay = `Delegated by ${getUserName(task.delegatedByUserId)}`;
        }
    } catch (e) {
         console.error("[TaskViewDialog] Error processing delegation info:", e);
         delegatedFromDisplay = 'Error';
    }

    return (
      <Grid container spacing={2} sx={{ p: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h5" component="div" gutterBottom>{task.title || '[No Title]'}</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}><strong>Status:</strong></Typography>
            {permissions.canUpdateStatus ? (
              <FormControl size="small" sx={{ minWidth: 120 }} disabled={isUpdatingStatus}>
                <Select
                  value={task.status}
                  onChange={handleStatusChange as any}
                  label="Status"
                  variant="outlined"
                  sx={{ '.MuiSelect-select': { py: 0.5, px: 1 } }}
                >
                  <MenuItem value={TaskStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
                  <MenuItem value={TaskStatus.COMPLETED}>Completed</MenuItem>
                  <MenuItem value={TaskStatus.CANCELLED} disabled>{/* Creator cancels via button */}Cancelled</MenuItem>
                </Select>
                {isUpdatingStatus && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </FormControl>
            ) : (
              <Chip label={task.status} size="small" color={getStatusColor(task.status)} />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}><strong>Priority:</strong></Typography>
            {permissions.canChangePriority ? (
              <FormControl size="small" sx={{ minWidth: 120 }} disabled={isUpdatingPriority}>
                <Select
                  value={task.priority}
                  onChange={handlePriorityChange as any}
                  label="Priority"
                  variant="outlined"
                  sx={{ '.MuiSelect-select': { py: 0.5, px: 1 } }}
                >
                  <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
                  <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
                </Select>
                {isUpdatingPriority && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </FormControl>
            ) : (
              <Chip label={task.priority} size="small" color={getPriorityColor(task.priority)} />
            )}
          </Box>

          <Typography variant="body2" sx={{ mr: 1 }}><strong>Type:</strong> {task.type}</Typography>
          <Typography variant="body2"><strong>Due Date:</strong> {task.dueDate ? formatDate(task.dueDate, DATE_FORMATS.DISPLAY_DATE) : 'N/A'}</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="body2"><strong>Created By:</strong> {creatorName}</Typography>
          <Typography variant="body2"><strong>Created At:</strong> {formatDate(task.createdAt, DATE_FORMATS.DISPLAY_DATE)}</Typography>
          <Typography variant="body2"><strong>Last Updated:</strong> {formatDate(task.updatedAt)}</Typography>
          {task.type === TaskType.PROVINCE_DEPARTMENT && (
            <Typography variant="body2"><strong>Province:</strong> {provinceDisplay}</Typography>
          )}
        </Grid>

        <Grid item xs={12} sx={{ mr: 1 }}>
          <Typography variant="body2" sx={{ mr: 1 }}><strong>Assignees:</strong> {assigneesDisplay}</Typography>
        </Grid>

        {task.isDelegated && (
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              <strong>Delegated From Task:</strong> {task.delegatedFromTaskId || 'N/A'} by {delegatedFromDisplay}
            </Typography>
          </Grid>
        )}

        <Grid item xs={12} sx={{ mt: 1 }}>
          <Typography variant="subtitle1"><strong>Description:</strong></Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 0.5, p: 1, background: theme.palette.action.hover, borderRadius: 1 }}>
            {task.description || '[No Description]'}
          </Typography>
        </Grid>
      </Grid>
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {renderContent()}
        </DialogContent>
        <DialogActions>
          {permissions.canEdit && task && (
            <Button onClick={() => onEdit && onEdit(task.id.toString())} color="primary">Edit</Button>
          )}
          {permissions.canCancel && task && (
            <Button onClick={handleCancelTask} color="warning" disabled={loading}>Cancel Task</Button>
          )}
          {permissions.canDelete && task && (
            <Button onClick={() => onDelete && onDelete(task.id.toString())} color="error">Delete</Button>
          )}
          {permissions.canDelegate && task && (
            <Button color="secondary" onClick={() => setDelegateDialogOpen(true)}>Delegate</Button>
          )}
          <Button onClick={onClose} color="primary" disabled={loading}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={delegateDialogOpen} onClose={() => setDelegateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delegate Task</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Select users to delegate this task to.
          </Typography>
          {delegationError && (
            <Alert severity="error" sx={{ mb: 2 }}>{delegationError}</Alert>
          )}
          <Autocomplete
            multiple
            options={users as ReadonlyArray<User>}
            getOptionLabel={(option) => `${option.first_name || ''} ${option.last_name || ''}`.trim() || option.username || option.id}
            value={selectedUsers}
            onChange={(event, newValue) => {
                setSelectedUsers(newValue as User[]);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Select User(s) to Delegate To"
                placeholder="Users"
                margin="dense"
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={delegationLoading || loadingRefData}
          />
          <TextField 
            margin="dense"
            label="Delegation Comment (Optional)"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={delegationComment}
            onChange={(e) => setDelegationComment(e.target.value)}
            disabled={delegationLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelegateDialogOpen(false)} disabled={delegationLoading}>Cancel</Button>
          <Button
            onClick={handleDelegateSubmit}
            variant="contained"
            color="primary"
            disabled={selectedUsers.length === 0 || delegationLoading}
          >
            {delegationLoading ? <CircularProgress size={24} /> : 'Confirm Delegation'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const getStatusColor = (status: TaskStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case TaskStatus.PENDING: return 'warning';
    case TaskStatus.IN_PROGRESS: return 'info';
    case TaskStatus.COMPLETED: return 'success';
    case TaskStatus.CANCELLED: return 'error';
    default: return 'default';
  }
};

const getPriorityColor = (priority: TaskPriority): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (priority) {
    case TaskPriority.LOW: return 'info';
    case TaskPriority.MEDIUM: return 'warning';
    case TaskPriority.HIGH: return 'error';
    default: return 'default';
  }
};

export default TaskViewDialog;