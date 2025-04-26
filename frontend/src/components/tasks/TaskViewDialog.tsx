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
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
  DialogContentText
} from '@mui/material';
import { Task, Department, Province, TaskStatus, TaskPriority, DelegateTaskData, TaskType, User } from '../../types/index';
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
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BusinessIcon from '@mui/icons-material/Business';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import axios from 'axios';

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

  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');

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

  const handleDelegateSubmit = async (selectedUsers: User[], comment: string) => {
    if (!task || !taskId) return;

    const selectedUserIds = selectedUsers.map(user => user.id);

    if (selectedUserIds.length === 0) {
        setDelegationError("Please select at least one user.");
        return;
    }

    setDelegationLoading(true);
    setDelegationError(null);

    const delegationData: DelegateTaskData = {
        newAssigneeUserIds: selectedUserIds,
        delegationReason: comment,
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
    if (cancelReason.length < 20) {
      setCancelReasonError('Please provide a detailed reason (at least 20 characters)');
      return;
    }
    
    if (!task || !taskId) return;
    
    try {
      await axios.post(`/api/tasks/${taskId}/cancel`, {
        status: 'cancelled',
        cancellationReason: cancelReason
      });
      onClose();
      if (onChangeStatus) {
        onChangeStatus(taskId, TaskStatus.CANCELLED);
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
      handleError('Failed to cancel task. Please try again later.');
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

    let assignmentDetailsNode: React.ReactNode = 'N/A';
    try {
        switch (task.type) {
            case TaskType.USER:
                if (task.assignedToUsers && task.assignedToUsers.length > 0) {
                    assignmentDetailsNode = (
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>Assigned To:</Typography>
                            <AvatarGroup max={4} sx={{ mr: 1 }}>
                                {task.assignedToUsers.map(user => (
                                    <Tooltip key={user.id} title={getUserName(user.id)} arrow>
                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                            {getUserName(user.id)?.charAt(0)?.toUpperCase() || '?'}
                                        </Avatar>
                                    </Tooltip>
                                ))}
                            </AvatarGroup>
                        </Box>
                    );
                } else {
                     assignmentDetailsNode = 'User assignment error';
                }
                break;

            case TaskType.DEPARTMENT:
                if (task.assignedToDepartments && task.assignedToDepartments.length > 0) {
                    assignmentDetailsNode = (
                         <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <BusinessIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ mr: 1 }}>Assigned To Dept(s):</Typography>
                            {task.assignedToDepartments.map(dept => (
                                <Chip key={dept.id} label={getDepartmentName(dept.id)} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                        </Box>
                    );
                } else {
                     assignmentDetailsNode = 'Department assignment error';
                }
                break;

            case TaskType.PROVINCE_DEPARTMENT:
                if (task.assignedToProvinceId && task.assignedToDepartments && task.assignedToDepartments.length > 0) {
                    const provinceName = getProvinceName(task.assignedToProvinceId);
                    assignmentDetailsNode = (
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                             <LocationCityIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                             <Typography variant="body2" sx={{ mr: 1 }}>Assigned To Province/Dept(s):</Typography>
                             <Chip label={provinceName} size="small" color="primary" sx={{ mr: 1, mb: 0.5 }} />
                            {task.assignedToDepartments.map(dept => (
                                <Chip key={dept.id} label={getDepartmentName(dept.id)} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                        </Box>
                    );
                } else {
                    assignmentDetailsNode = 'Province/Department assignment error';
                }
                break;

            case TaskType.PERSONAL:
                assignmentDetailsNode = (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountCircleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">Personal Task for {creatorName}</Typography>
                    </Box>
                );
                break;

            default:
                assignmentDetailsNode = `Unknown Task Type: ${task.type}`;
                break;
        }
    } catch (e) {
         console.error("[TaskViewDialog] Error processing assignees:", e);
         assignmentDetailsNode = <Chip label="Error loading assignees" size="small" color="error" />;
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
                  {assignmentDetailsNode}
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
                        onClick={() => setOpenCancelDialog(true)}
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

      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
        <DialogTitle>Cancel Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a detailed reason for cancelling this task.
            The reason must be at least 20 characters.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="cancellation-reason"
            label="Cancellation Reason"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={cancelReason}
            onChange={(e) => {
              setCancelReason(e.target.value);
              if (e.target.value.length >= 20) {
                setCancelReasonError('');
              }
            }}
            error={!!cancelReasonError}
            helperText={cancelReasonError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>Cancel</Button>
          <Button onClick={handleCancelTask} color="primary" variant="contained">
            Confirm Cancellation
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