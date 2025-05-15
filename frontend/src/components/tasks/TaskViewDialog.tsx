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
  FormControl,
  InputLabel,
  OutlinedInput,
  ListItemText,
  Checkbox,
  IconButton,
  Autocomplete,
} from '@mui/material';
import { Task, TaskStatus, TaskPriority, TaskType, User as UserType, CreatorDelegateTaskDto } from '../../types/index';
import { TaskService } from '../../services/task';
import * as tasksService from '../../services/tasks.service';
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
  const { users, departments, loading: loadingRefData, provinces } = useReferenceData();
  const { error: fetchError, handleError, clearError } = useErrorHandler();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);

  const [isCreatorDelegating, setIsCreatorDelegating] = useState(false);
  const [selectedDelegateUsers, setSelectedDelegateUsers] = useState<UserType[]>([]);
  const [delegationError, setDelegationError] = useState<string | null>(null);
  const [isSubmittingDelegation, setIsSubmittingDelegation] = useState(false);

  const glassStyles = getGlassmorphismStyles(theme);

  const permissions = useTaskPermissions(task);

  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');

  const fetchTaskDetails = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    clearError();
    try {
      const taskDetails = await TaskService.getTaskDetails(taskId);
      setTask(taskDetails);
    } catch (err: any) {
      if (err.response?.status === 404) {
        handleError(`Task not found (ID: ${taskId}). It might have been deleted.`);
      } else {
         handleError(`Failed to load task details: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [taskId, clearError, handleError]);

  useEffect(() => {
    if (open && taskId) {
      fetchTaskDetails();
    }
  }, [open, taskId, fetchTaskDetails]);

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

  const handleOpenCreatorDelegateDialog = () => {
    if (task) {
      const initialUsers = users.filter(u => task.assignedToUserIds?.includes(u.id)) as UserType[];
      setSelectedDelegateUsers(initialUsers);
      setIsCreatorDelegating(true);
      setDelegationError(null);
    }
  };

  const handleCloseCreatorDelegateDialog = () => {
    setIsCreatorDelegating(false);
    setSelectedDelegateUsers([]);
    setDelegationError(null);
  };

  const handleSelectedDelegateUsersChange = (event: React.SyntheticEvent, newValue: UserType[]) => {
    setSelectedDelegateUsers(newValue);
  };

  const handleSubmitCreatorDelegation = async () => {
    if (!task || !taskId || selectedDelegateUsers.length === 0) {
      setDelegationError('Please select at least one user to delegate to.');
      return;
    }
    setDelegationError(null);
    setIsSubmittingDelegation(true);
    try {
      const payload: CreatorDelegateTaskDto = {
        delegatedToUserIds: selectedDelegateUsers.map(user => user.id),
      };
      const updatedTask = await tasksService.delegateTaskAssignmentsByCreator(taskId, payload);
      setTask(updatedTask);
      handleCloseCreatorDelegateDialog();
      console.log('Task delegated successfully by creator:', updatedTask);
      fetchTaskDetails();
    } catch (err: any) {
      console.error('Error delegating task by creator:', err);
      setDelegationError(err.message || 'Failed to delegate task.');
    } finally {
      setIsSubmittingDelegation(false);
    }
  };

  const isCreator = task && currentUser?.id === task.createdById;
  const canCreatorDelegate = isCreator && task && 
    ![TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.DELEGATED].includes(task.status);

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
        creatorNameNode = `${task.createdBy.first_name || ''} ${task.createdBy.last_name || ''}`.trim() || task.createdBy.username || `ID: ${task.createdById}`;
    } else if (task.createdById) {
        creatorNameNode = getUserName(task.createdById);
    } else {
        creatorNameNode = 'N/A';
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

    const priorityText = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'N/A';

    const formattedDueDate = task.dueDate ? formatDate(task.dueDate, DATE_FORMATS.DISPLAY_DATE) : 'Not set';
    const formattedCreatedAt = task.createdAt ? formatDate(task.createdAt, DATE_FORMATS.DISPLAY_DATE) : 'N/A';
    const formattedUpdatedAt = task.updatedAt ? formatDate(task.updatedAt, DATE_FORMATS.DISPLAY_DATE) : 'N/A';

    const createdByText = `Created By: ${creatorNameNode} on ${formatDate(task.createdAt, DATE_FORMATS.DISPLAY_DATETIME)}`;
    const dueDateText = `Due Date: ${task.dueDate ? formatDate(task.dueDate, DATE_FORMATS.DISPLAY_DATE) : 'N/A'}`;
    const updatedAtText = `Last Updated: ${formatDate(task.updatedAt, DATE_FORMATS.DISPLAY_DATETIME)}`;

    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                    {task.title}
                </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
                <Box mb={2}>
                    <Typography variant="caption" display="block" gutterBottom>
                        {createdByText}
                    </Typography>
                </Box>
                <Box mb={2}>
                    <Typography variant="caption" display="block" gutterBottom>
                        {dueDateText}
                    </Typography>
                </Box>
                <Box mb={2}>
                    <Typography variant="caption" display="block" gutterBottom>
                        {updatedAtText}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box mb={2}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Description:</Typography>
                    <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto', p:1, border: '1px solid', borderColor: theme.palette.divider, borderRadius: 1 }}>
                        {task.description || 'No description provided.'}
                    </Typography>
                </Box>
            </Grid>
        </Grid>
        
        {isCreatorDelegating && (
          <Box sx={{ mt: 3, p: 2, border: '1px dashed', borderColor: 'grey.500', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Delegate Task Assignments</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select users to delegate this task to. The task status will be updated to 'Delegated'.
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Autocomplete<UserType, true, false, false>
                multiple
                id="delegate-users-autocomplete"
                options={(users.filter(u => u.id !== currentUser?.id) as unknown) as readonly UserType[]}
                getOptionLabel={(option) => `${option.first_name || ''} ${option.last_name || ''} (${option.username})`.trim()}
                value={selectedDelegateUsers}
                onChange={handleSelectedDelegateUsersChange}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Select Users to Delegate To"
                    placeholder="Type to search users..."
                  />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {`${option.first_name || ''} ${option.last_name || ''} (${option.username})`}
                  </li >
                )}
              />
            </FormControl>
            {delegationError && <Alert severity="error" sx={{ mb: 2 }}>{delegationError}</Alert>}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleCloseCreatorDelegateDialog} disabled={isSubmittingDelegation}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitCreatorDelegation}
                variant="contained"
                color="primary"
                disabled={isSubmittingDelegation || selectedDelegateUsers.length === 0}
                startIcon={isSubmittingDelegation ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              >
                Confirm Delegation
              </Button>
            </Box>
          </Box>
        )}
        {task && canCreatorDelegate && !isCreatorDelegating && (
          <Button 
            onClick={handleOpenCreatorDelegateDialog}
            startIcon={<PeopleIcon />}
            variant="outlined" 
            color="secondary"
            sx={{ mr: 1 }}
          >
            Delegate Task
          </Button>
        )}
        {task && permissions.canCancel && !isCreatorDelegating && (
          <Button onClick={() => setOpenCancelDialog(true)} startIcon={<CancelIcon />} variant="outlined" color="warning" sx={{ mr: 1 }}>
            Cancel Task
          </Button>
        )}
        {task && permissions.canDelete && onDelete && !isCreatorDelegating &&(
          <Button onClick={() => onDelete(task.id)} startIcon={<DeleteIcon />} variant="outlined" color="error" sx={{ mr: 1 }}>
            Delete Task
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...glassStyles,
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, position: 'relative', borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Task Details
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 16, top: 12 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ py: 2 }}>
        {renderContent()}
      </DialogContent>
      <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, px:3, py: 2, background: 'rgba(0,0,0,0.03)' }}>
        {permissions.canUpdateTask && (
          <Button 
            onClick={() => onEdit && task && onEdit(task.id)} 
            startIcon={<EditIcon />} 
            variant="outlined" 
            color="primary"
            disabled={!task || loading}
            sx={{ mr: 1 }}
          >
            Edit Task
          </Button>
        )}
        
        {permissions.canCancelTask && task && task.status !== TaskStatus.CANCELLED && (
          <Button 
            onClick={() => setOpenCancelDialog(true)} 
            startIcon={<CancelIcon />} 
            variant="outlined" 
            color="warning"
            disabled={loading || isUpdatingStatus}
            sx={{ mr: 1 }}
          >
            Cancel Task
          </Button>
        )}

        {permissions.canDeleteTask && (
          <Button 
            onClick={() => onDelete && task && onDelete(task.id)} 
            startIcon={<DeleteIcon />} 
            variant="outlined" 
            color="error"
            disabled={!task || loading}
            sx={{ mr: 1 }}
          >
            Delete Task
          </Button>
        )}
        
        <Button onClick={onClose} variant="contained" color="secondary">
          Close
        </Button>
      </DialogActions>

      {task && (
        <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)} PaperProps={{ sx: glassStyles }}>
            <DialogTitle>Cancel Task: {task.title}</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Please provide a reason for cancelling this task. This action cannot be undone.
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="cancelReason"
                    label="Cancellation Reason"
                    type="text"
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={3}
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
                <Button onClick={() => setOpenCancelDialog(false)}>Back</Button>
                <Button onClick={handleCancelTask} color="error" variant="contained" disabled={cancelReason.length < 20}>
                    Confirm Cancellation
                </Button>
            </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
};

export default TaskViewDialog;