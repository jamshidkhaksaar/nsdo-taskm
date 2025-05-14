import React, { useState, useEffect, useCallback } from 'react';
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
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
  DialogContentText,
} from '@mui/material';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../types/index';
import { TaskService } from '../../services/task';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import useReferenceData from '@/hooks/useReferenceData';
import { getGlassmorphismStyles } from '@/utils/glassmorphismStyles';
import { useTaskPermissions } from '@/hooks/useTaskPermissions';
import { formatDate, DATE_FORMATS } from '@/utils/dateUtils';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BusinessIcon from '@mui/icons-material/Business';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import SendIcon from '@mui/icons-material/Send';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

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
  const { users, departments, loading: loadingRefData } = useReferenceData();
  const { error: fetchError, handleError, clearError } = useErrorHandler();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);

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
    const prov = departments.find(p => p.id === provinceId);
    return prov ? prov.name : `ID: ${provinceId}`;
  }, [departments]);

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

    let creatorNameNode: React.ReactNode;
    if (task.createdBy) {
        if (currentUser && task.createdById === currentUser.id) {
            creatorNameNode = <Typography variant="body2" component="span" fontWeight="bold">My Task</Typography>;
        } else {
            creatorNameNode = getUserName(task.createdById);
        }
    } else {
        creatorNameNode = task.createdById ? `ID: ${task.createdById}` : 'N/A';
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
                        <Typography variant="body2">Personal Task (Assigned to Creator)</Typography>
                    </Box>
                );
                break;

            default:
                assignmentDetailsNode = <Typography variant="body2" color="text.secondary">Assignment type: {task.type || 'Unknown'}</Typography>;
        }
    } catch (e) {
        console.error("[TaskViewDialog] Error processing assignment details:", e);
        assignmentDetailsNode = <Typography variant="body2" color="error">Error loading assignment</Typography>;
    }

    // Prepare displayed priority
    const priorityText = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'N/A';

    const formattedDueDate = task.dueDate ? formatDate(task.dueDate, DATE_FORMATS.DISPLAY_DATE) : 'Not set';
    const formattedCreatedAt = task.createdAt ? formatDate(task.createdAt, DATE_FORMATS.DISPLAY_DATE) : 'N/A';
    const formattedUpdatedAt = task.updatedAt ? formatDate(task.updatedAt, DATE_FORMATS.DISPLAY_DATE) : 'N/A';

    return (
      <Grid container spacing={2} sx={{ p: 3 }}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            {task.title || '[No Title]'}
          </Typography>
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
              {Object.values(TaskStatus).filter(s => s !== TaskStatus.DELEGATED).map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()}
                  {isUpdatingStatus && task.status === status && <CircularProgress size={16} sx={{ ml: 1 }} />}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box mb={2}>
            <Typography variant="overline" color="text.secondary" display="block">Priority</Typography>
            <Typography variant="body1">{priorityText}</Typography>
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
        </Grid>

        <Grid item xs={12} md={6}>
          <Box mb={2}>
            <Typography variant="overline" color="text.secondary" display="block">Created By</Typography>
            <Typography variant="body1">{creatorNameNode}</Typography>
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
        <DialogTitle sx={{ ...glassStyles, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {task ? task.title : 'Loading Task...'}
          </Typography>
          <Button onClick={onClose} sx={{ minWidth: 'auto', p: 0.5 }} aria-label="close dialog">
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ ...glassStyles, borderTop: 'none', borderBottom: 'none' }}>
          {renderContent()}
        </DialogContent>
        <DialogActions sx={{ ...glassStyles, borderTop: 'none', pt: 1, justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Box>
            {task && onEdit && permissions.canEdit && (
              <Button onClick={() => onEdit(task.id)} startIcon={<EditIcon />} color="primary" variant="outlined" sx={{ mr: 1 }}>
                Edit
              </Button>
            )}
            {task && permissions.canDelegate && (
              <Button
                startIcon={<SendIcon />}
                color="secondary"
                variant="outlined"
                sx={{ mr: 1 }}
                onClick={() => alert('Delegate Task functionality to be implemented.')}
              >
                Delegate
              </Button>
            )}
             {task && permissions.canCancel && task.status !== TaskStatus.CANCELLED && task.status !== TaskStatus.COMPLETED && (
                <Button onClick={() => setOpenCancelDialog(true)} startIcon={<CancelIcon />} color="warning" variant="outlined" sx={{ mr: 1 }}>
                    Cancel Task
                </Button>
            )}
            {task && onDelete && permissions.canDelete && (
              <Button onClick={() => onDelete(task.id)} startIcon={<DeleteIcon />} color="error" variant="outlined">
                Delete
              </Button>
            )}
          </Box>
          <Button onClick={onClose} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

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

export default TaskViewDialog;