import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  CardActions,
  Button,
  IconButton,
  useTheme,
  Menu,
  MenuItem,
  Tooltip,
  AvatarGroup,
  Select,
  MenuItem as MuiMenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  PriorityHigh as PriorityHighIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { useTaskPermissions } from '../../hooks/useTaskPermissions';
import { User } from '../../types/user';
import { Department } from '../../services/department';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { SelectChangeEvent } from '@mui/material/Select';
import axios from 'axios';

// Custom styles for the components
const customStyles = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(5px)',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  text: {
    primary: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    secondary: {
      color: 'rgba(255, 255, 255, 0.7)',
    },
  },
  iconButton: {
    color: 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
      color: '#fff',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  button: {
    color: 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
      color: '#fff',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
};

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onClick?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onClick,
}) => {
  const theme = useTheme();
  const [statusAnchorEl, setStatusAnchorEl] = React.useState<null | HTMLElement>(null);
  const permissions = useTaskPermissions(task);
  const { users: reduxUsers } = useSelector((state: RootState) => state.users);
  const { departments: reduxDepartments } = useSelector((state: RootState) => state.departments);

  // Find creator and assignee details
  const creator = reduxUsers.find(u => u.id.toString() === task.createdById?.toString());
  const creatorName = creator ? `${creator.first_name} ${creator.last_name}` : 'Unknown';
  const assignedUsers = reduxUsers.filter(user => task.assigned_to?.map(id => id.toString()).includes(user.id.toString()));

  // Find department name if applicable
  const department = reduxDepartments.find(dept => dept.id.toString() === task.departmentId?.toString());
  const departmentName = department?.name || (task.departmentId ? 'Loading...' : 'None');

  // Format due date
  const formattedDueDate = task.dueDate
    ? format(new Date(task.dueDate), 'MMM d, yyyy h:mm a')
    : 'No due date';

  const getStatusLabel = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.PENDING: return 'Pending';
      case TaskStatus.IN_PROGRESS: return 'In Progress';
      case TaskStatus.COMPLETED: return 'Completed';
      case TaskStatus.CANCELLED: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.PENDING: return theme.palette.warning.main;
      case TaskStatus.IN_PROGRESS: return theme.palette.info.main;
      case TaskStatus.COMPLETED: return theme.palette.success.main;
      case TaskStatus.CANCELLED: return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  // Handle status change
  const handleStatusChange = (event: SelectChangeEvent<TaskStatus>) => {
    if (onStatusChange && permissions.canManageStatus) {
      onStatusChange(task.id.toString(), event.target.value as TaskStatus);
    }
  };

  // Get priority color
  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.HIGH: return theme.palette.error.main;
      case TaskPriority.MEDIUM: return theme.palette.warning.main;
      case TaskPriority.LOW: return theme.palette.success.main;
      default: return theme.palette.info.main;
    }
  };
  
  // Determine due date status
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;
  const dueDateText = task.dueDate ? `Due: ${format(new Date(task.dueDate), 'PPp')}` : 'No due date';

  // Find assigned users' full names
  const assignedUserNames = assignedUsers
    .map(user => `${user.first_name} ${user.last_name}`)
    .join(', ') || 'Unassigned';
  
  // Add state for delete dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionReasonError, setDeletionReasonError] = useState('');

  // Update handleDelete
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (deletionReason.length < 20) {
      setDeletionReasonError('Please provide a detailed reason (at least 20 characters)');
      return;
    }
    
    try {
      await axios.post(`/api/tasks/${task.id}/delete`, { deletionReason });
      setOpenDeleteDialog(false);
      onDelete && onDelete(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
      // Handle error appropriately (e.g., show notification)
      // You might want to add a user-facing error message here
    }
  };

  return (
    <Card
      sx={{ mb: 2, position: 'relative', overflow: 'visible', cursor: onClick ? 'pointer' : 'default' }}
      onClick={() => onClick && onClick(task)}
    >
      {/* Priority indicator */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '-8px', 
          right: '-8px', 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          backgroundColor: getPriorityColor(task.priority),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <PriorityHighIcon sx={{ fontSize: '16px', color: '#fff' }} />
      </Box>
      
      <CardContent sx={{ pt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" color="#fff" gutterBottom>
          {task.title}
        </Typography>
        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 1 }}>
          {departmentName !== 'None' ? `Dept: ${departmentName}` : 'Personal'}
        </Typography>
        <Tooltip title={dueDateText}>
          <Chip
            icon={<AccessTimeIcon fontSize="small" />}
            label={task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No due date'}
            size="small"
            sx={{ 
              color: isOverdue ? theme.palette.error.light : 'rgba(255, 255, 255, 0.7)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              mr: 1,
              mb: 1
            }}
          />
        </Tooltip>
        <Tooltip title={`Priority: ${task.priority}`}>
          <Chip
            icon={<PriorityHighIcon fontSize="small" />}
            label={task.priority}
            size="small"
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              mb: 1
            }}
          />
        </Tooltip>
        
        <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tooltip title={`Assigned to: ${assignedUserNames}`}>
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.7rem' } }}>
              {assignedUsers.map(user => (
                <Avatar key={user.id} alt={`${user.first_name} ${user.last_name}`} src={user.avatar}>
                  {user.first_name?.charAt(0)}
                </Avatar>
              ))}
            </AvatarGroup>
          </Tooltip>
          
          {/* Status Select Dropdown */}
          {permissions.canManageStatus && onStatusChange ? (
            <Select
              value={task.status}
              onChange={handleStatusChange}
              size="small"
              variant="outlined"
              onClick={(e) => e.stopPropagation()}
              sx={{ 
                fontSize: '0.8rem', 
                color: 'rgba(255, 255, 255, 0.8)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.5)' },
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <MuiMenuItem value={TaskStatus.PENDING}>Pending</MuiMenuItem>
              <MuiMenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MuiMenuItem>
              <MuiMenuItem value={TaskStatus.COMPLETED}>Completed</MuiMenuItem>
              <MuiMenuItem value={TaskStatus.CANCELLED}>Cancelled</MuiMenuItem>
            </Select>
          ) : (
             <Chip label={task.status} size="small" sx={{ backgroundColor: getStatusColor(task.status), color: '#fff' }} />
          )}
        </Box>
      </CardContent>
      
      {/* Actions */}
      {(permissions.canEdit || permissions.canDelete) && (
        <CardActions sx={{ justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.1)', pt: 1 }}>
          {permissions.canEdit && onEdit && (
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          
          {permissions.canDelete && onDelete && (
            <IconButton 
              size="small" 
              onClick={handleDelete}
              sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>

    {/* Add the dialog at the end of the component */}
    <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
      <DialogTitle>Delete Task</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please provide a detailed reason for deleting this task.
          The reason must be at least 20 characters.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="deletion-reason"
          label="Deletion Reason"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={deletionReason}
          onChange={(e) => {
            setDeletionReason(e.target.value);
            if (e.target.value.length >= 20) {
              setDeletionReasonError('');
            }
          }}
          error={!!deletionReasonError}
          helperText={deletionReasonError}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
        <Button onClick={confirmDelete} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskCard; 