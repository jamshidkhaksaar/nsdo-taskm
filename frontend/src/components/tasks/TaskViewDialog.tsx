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
  FormControl,
  SelectChangeEvent,
  Divider
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
import DelegateTaskDialog from './DelegateTaskDialog';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';

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
          if (err.response?.status === 404) {
            handleError(`Task not found (ID: ${taskId}). It might have been deleted.`);
          } else {
             handleError(`Failed to load task details: ${err.message || 'Unknown error'}`);
          }
          console.error("Error fetching task details:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
    if (!open || !taskId) {
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
        setTask(newTask);
        setDelegateDialogOpen(false);
    } catch (err: any) {
        console.error("Delegation failed:", err);
        const errMsg = `Delegation failed: ${err.response?.data?.message || err.message || 'Unknown error'}`;
        handleError(errMsg);
        setDelegationError(errMsg);
    } finally {
        setDelegationLoading(false);
    }
  };

  const handleStatusChange = async (event: SelectChangeEvent<TaskStatus>) => {
    const newStatus = event.target.value as TaskStatus;
    if (!task || !taskId || !permissions.canUpdateStatus || newStatus === task.status) return;

    console.log(`Attempting to change status to: ${newStatus}`);
    setIsUpdatingStatus(true);
    try {
      const updatedTask = await TaskService.changeTaskStatus(taskId, newStatus);
      setTask(updatedTask);
      if (onChangeStatus) {
        onChangeStatus(taskId, newStatus);
      }
    } catch (err: any) {
      handleError(`Failed to update status: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (event: SelectChangeEvent<TaskPriority>) => {
    const newPriority = event.target.value as TaskPriority;
     if (!task || !taskId || !permissions.canChangePriority || newPriority === task.priority) return;

    console.log(`Attempting to change priority to: ${newPriority}`);
    setIsUpdatingPriority(true);
    try {
      const updatedTask = await TaskService.changeTaskPriority(taskId, newPriority);
      setTask(updatedTask);
    } catch (err: any) {
      handleError(`Failed to update priority: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingPriority(false);
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
    if (loading || loadingRefData) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: 200 }}><CircularProgress /></Box>;
    }
    if (fetchError) {
      return (
          <Alert severity="error" sx={{ m: 2 }} action={
              <Button color="inherit" size="small" onClick={onClose}>
                  Close
              </Button>
          }>
              {fetchError}
          </Alert>
      );
    }
    if (!task) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: 200 }}>
            <Typography variant="body1" color="text.secondary">
                {taskId ? "Task data could not be loaded." : "No task selected."}
            </Typography>
        </Box>
      );
    }

    let creatorName = 'N/A';
    try {
        creatorName = getUserName(task.createdById); 
    } catch (e) {
        console.error("[TaskViewDialog] Error accessing creator name:", e);
        creatorName = 'Error loading name';
    }

    let assigneesDisplayNode: React.ReactNode = 'N/A';
    try {
        if (task.type === TaskType.USER && task.assignedToUsers && task.assignedToUsers.length > 0) {
            assigneesDisplayNode = task.assignedToUsers.map(u => (
                <Chip key={u.id} label={getUserName(u.id)} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
            ));
        } else if ((task.type === TaskType.DEPARTMENT || task.type === TaskType.PROVINCE_DEPARTMENT) && task.assignedToDepartments && task.assignedToDepartments.length > 0) {
            assigneesDisplayNode = task.assignedToDepartments.map(d => (
                 <Chip key={d.id} label={getDepartmentName(d.id)} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
            ));
        } else if (task.type === TaskType.PERSONAL) {
            assigneesDisplayNode = `Personal (${creatorName})`;
        }
    } catch (e) {
         console.error("[TaskViewDialog] Error processing assignees:", e);
         assigneesDisplayNode = <Chip label="Error loading assignees" size="small" color="error" />;
    }

    let provinceDisplayNode: React.ReactNode = 'N/A';
    try {
        if (task.assignedToProvinceId) {
            provinceDisplayNode = getProvinceName(task.assignedToProvinceId);
        } else if (task.type === TaskType.PROVINCE_DEPARTMENT) {
             provinceDisplayNode = <Chip label="Province not assigned" size="small" color="warning" />;
        }
    } catch (e) {
         console.error("[TaskViewDialog] Error processing province:", e);
         provinceDisplayNode = <Chip label="Error loading province" size="small" color="error" />;
    }
    
    let delegatedFromDisplay: React.ReactNode = null;
    try {
        if (task.isDelegated && task.delegatedByUserId) {
            delegatedFromDisplay = (
                <Typography variant="caption" color="text.secondary">
                    Delegated by {getUserName(task.delegatedByUserId)}
                </Typography>
            );
        }
    } catch (e) {
         console.error("[TaskViewDialog] Error processing delegation info:", e);
         delegatedFromDisplay = <Typography variant="caption" color="error">Error loading delegator</Typography>;
    }

    const formattedDueDate = task.dueDate ? formatDate(task.dueDate, DATE_FORMATS.DISPLAY_DATE) : 'Not set';
    const formattedCreatedAt = task.createdAt ? formatDate(task.createdAt, DATE_FORMATS.DISPLAY_DATE) : 'N/A';
    const formattedUpdatedAt = task.updatedAt ? formatDate(task.updatedAt, DATE_FORMATS.DISPLAY_DATE) : 'N/A';

    return (
      <Grid container spacing={2} sx={{ p: 3 }}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            {task.title || '[No Title]'}
          </Typography>
           {delegatedFromDisplay && <Box sx={{ mb: 1 }}>{delegatedFromDisplay}</Box>}
        </Grid>

        <Grid item xs={12} md={6}>
          <Box mb={2}>
            <Typography variant="overline" color="text.secondary" display="block">Status</Typography>
            <Select
              value={task.status}
              onChange={handleStatusChange}
              disabled={!permissions.canUpdateStatus || isUpdatingStatus}
              size="small"
              fullWidth
              displayEmpty
              renderValue={(selected) => {
                if (!selected) return <em>N/A</em>;
                return selected.charAt(0).toUpperCase() + selected.slice(1).replace('_', ' ');
              }}
              sx={{ minWidth: 120, ...glassStyles, background: 'transparent' }}
            >
              {Object.values(TaskStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
             {isUpdatingStatus && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Box>

          <Box mb={2}>
            <Typography variant="overline" color="text.secondary" display="block">Priority</Typography>
             <Select
              value={task.priority}
              onChange={handlePriorityChange}
              disabled={!permissions.canChangePriority || isUpdatingPriority}
              size="small"
              fullWidth
              displayEmpty
              renderValue={(selected) => {
                if (!selected) return <em>N/A</em>;
                return selected.charAt(0).toUpperCase() + selected.slice(1);
              }}
              sx={{ minWidth: 120, ...glassStyles, background: 'transparent' }}
            >
              {Object.values(TaskPriority).map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </MenuItem>
              ))}
            </Select>
             {isUpdatingPriority && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Box>

          <Box mb={2}>
            <Typography variant="overline" color="text.secondary" display="block">Task Type</Typography>
            <Typography variant="body1">{task.type ? task.type.charAt(0).toUpperCase() + task.type.slice(1).replace('_', ' ') : 'N/A'}</Typography>
          </Box>

          <Box mb={2}>
            <Typography variant="overline" color="text.secondary" display="block">Due Date</Typography>
            <Typography variant="body1">{formattedDueDate}</Typography>
          </Box>

           <Box mb={2}>
              <Typography variant="overline" color="text.secondary" display="block">Assignees</Typography>
               <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                  {assigneesDisplayNode}
              </Box>
          </Box>

           {task.type === TaskType.PROVINCE_DEPARTMENT || task.assignedToProvinceId && (
               <Box mb={2}>
                  <Typography variant="overline" color="text.secondary" display="block">Province</Typography>
                  {typeof provinceDisplayNode === 'string' ? (
                      <Typography variant="body1">{provinceDisplayNode}</Typography>
                  ) : (
                      provinceDisplayNode
                  )}
              </Box>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Box mb={2}>
            <Typography variant="overline" color="text.secondary" display="block">Created By</Typography>
            <Typography variant="body1">{creatorName}</Typography>
          </Box>
          <Box mb={2}>
            <Typography variant="overline" color="text.secondary" display="block">Created At</Typography>
            <Typography variant="body1">{formattedCreatedAt}</Typography>
          </Box>
          <Box mb={2}>
            <Typography variant="overline" color="text.secondary" display="block">Last Updated</Typography>
            <Typography variant="body1">{formattedUpdatedAt}</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box mb={2}>
            <Typography variant="overline" color="text.secondary" display="block">Description</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {task.description || <Box component="em" sx={{ color: 'text.secondary' }}>No description provided.</Box>}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
            sx: {
                ...glassStyles,
                borderRadius: '12px',
            }
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" component="div">Task Details</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, borderTop: 'none', borderBottom: 'none' }}>
          {renderContent()}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'space-between' }}>
            <Box>
                 {permissions.canEdit && task && (
                    <Button
                        onClick={() => onEdit && onEdit(task.id.toString())}
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        sx={{ mr: 1 }}
                    >
                        Edit
                    </Button>
                )}
                 {permissions.canDelegate && task && (
                    <Button
                        color="secondary"
                        variant="contained"
                        onClick={() => setDelegateDialogOpen(true)}
                        startIcon={<PeopleIcon />}
                        sx={{ mr: 1 }}
                    >
                        Delegate
                    </Button>
                 )}
                 {permissions.canCancel && task && (
                    <Button
                        onClick={handleCancelTask}
                        variant="outlined"
                        color="warning"
                        startIcon={<CancelIcon />}
                        disabled={loading}
                        sx={{ mr: 1 }}
                    >
                        Cancel Task
                    </Button>
                )}
                 {permissions.canDelete && task && (
                    <Button
                        onClick={() => onDelete && onDelete(task.id.toString())}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                         sx={{ mr: 1 }}
                    >
                        Delete
                    </Button>
                )}
            </Box>
             <Box>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    startIcon={<CloseIcon />}
                    disabled={loading}
                >
                    Close
                </Button>
            </Box>
        </DialogActions>
      </Dialog>

      {task && (
        <DelegateTaskDialog
          open={delegateDialogOpen}
          onClose={() => setDelegateDialogOpen(false)}
          taskId={taskId!}
          taskTitle={task.title}
          currentAssignees={task.assignedToUsers || []}
          users={users}
          onSubmit={handleDelegateSubmit}
          loading={delegationLoading}
          error={delegationError}
        />
      )}
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