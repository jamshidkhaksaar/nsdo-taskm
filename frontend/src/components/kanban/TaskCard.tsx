import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Tooltip,
  IconButton,
  alpha,
  Avatar,
  AvatarGroup,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PersonIcon from '@mui/icons-material/Person';
import { Task, TaskStatus } from '../../types';
import TaskStatusBadge from './TaskStatusBadge';

// Define the props interface
interface TaskCardProps {
  task: Task;
  statusColor: string;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onChangeStatus?: (taskId: string, newStatus: TaskStatus) => Promise<boolean> | void;
  getUserName: (userId: string) => Promise<string>;
  formatDate?: (dateString: string) => string;
  theme: any;
}

// Function to get a nicely formatted status label
const getStatusLabel = (status: string): string => {
  switch(status) {
    case TaskStatus.PENDING:
      return 'Pending';
    case TaskStatus.IN_PROGRESS:
      return 'In Progress';
    case TaskStatus.COMPLETED:
      return 'Completed';
    case TaskStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

// Function to get status color
const getStatusColor = (status: string): string => {
  switch(status) {
    case TaskStatus.PENDING:
      return '#3498db';
    case TaskStatus.IN_PROGRESS:
      return '#f39c12';
    case TaskStatus.COMPLETED:
      return '#2ecc71';
    case TaskStatus.CANCELLED:
      return '#e74c3c';
    default:
      return '#3498db';
  }
};

// Function to generate consistent colors from strings (userId)
function stringToColor(string: string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  statusColor,
  onEdit,
  onDelete,
  onChangeStatus,
  getUserName,
  formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(),
  theme,
}) => {
  const [assigneeNames, setAssigneeNames] = useState<{ [key: string]: string }>({});
  const [creatorName, setCreatorName] = useState<string>('');
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const loadUserDetails = async () => {
      // Load assignee names
      if (task.assigned_to && task.assigned_to.length > 0) {
        const names: { [key: string]: string } = {};
        for (const userId of task.assigned_to) {
          if (userId) {
            names[userId] = await getUserName(userId);
          }
        }
        setAssigneeNames(names);
      }
      
      // Load creator name
      if (task.created_by) {
        try {
          const name = await getUserName(task.created_by);
          setCreatorName(name);
        } catch (error) {
          console.error('Error fetching creator name:', error);
          setCreatorName('Unknown');
        }
      }
    };

    loadUserDetails();
  }, [task.assigned_to, task.created_by, getUserName]);

  // Check if a due date is overdue
  const isOverdue = (dateString: string): boolean => {
    const dueDate = new Date(dateString);
    if (!dueDate) return false;
    
    return dueDate < new Date() && dueDate.getDate() !== new Date().getDate();
  };

  // Generate a darker shade of the status color for card border
  const borderColor = alpha(statusColor, 0.8);

  // Handle status change from dropdown
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (onChangeStatus && !isChangingStatus) {
      setStatusAnchorEl(null);
      setIsChangingStatus(true);
      try {
        await onChangeStatus(String(task.id), newStatus);
      } finally {
        setIsChangingStatus(false);
      }
    }
  };

  // Get previous and next status
  const getPreviousStatus = (currentStatus: TaskStatus): TaskStatus | null => {
    switch (currentStatus) {
      case TaskStatus.IN_PROGRESS:
        return TaskStatus.PENDING;
      case TaskStatus.COMPLETED:
        return TaskStatus.IN_PROGRESS;
      default:
        return null;
    }
  };

  const getNextStatus = (currentStatus: TaskStatus): TaskStatus | null => {
    switch (currentStatus) {
      case TaskStatus.PENDING:
        return TaskStatus.IN_PROGRESS;
      case TaskStatus.IN_PROGRESS:
        return TaskStatus.COMPLETED;
      default:
        return null;
    }
  };

  const previousStatus = getPreviousStatus(task.status as TaskStatus);
  const nextStatus = getNextStatus(task.status as TaskStatus);

  return (
    <Card
      sx={{
        position: 'relative',
        mb: 1.5,
        borderLeft: `4px solid ${borderColor}`,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
        overflow: 'visible',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Task title with edit button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
            {task.title}
          </Typography>
          <Box>
            <Tooltip title="Edit Task">
              <IconButton
                size="small"
                onClick={() => onEdit && onEdit(String(task.id))}
                sx={{ ml: 1, color: 'text.secondary' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Task">
              <IconButton
                size="small"
                onClick={() => onDelete && onDelete(String(task.id))}
                sx={{ color: 'error.light' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Created by info */}
        {task.created_by && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PersonIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5, fontSize: '0.875rem' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Created by: {creatorName || 'Loading...'}
            </Typography>
          </Box>
        )}
        
        {/* Task description */}
        {task.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {task.description}
          </Typography>
        )}

        {/* Task metadata */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer', 
                bgcolor: getStatusColor(task.status),
                color: '#fff',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 'medium',
                '&:hover': {
                  opacity: 0.9
                }
              }}
              onClick={(e) => setStatusAnchorEl(e.currentTarget)}
            >
              {getStatusLabel(task.status)}
              <KeyboardArrowDownIcon fontSize="small" sx={{ ml: 0.5 }} />
            </Box>
            
            <Menu
              anchorEl={statusAnchorEl}
              open={Boolean(statusAnchorEl)}
              onClose={() => setStatusAnchorEl(null)}
            >
              {Object.values(TaskStatus).map((status) => (
                <MenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  sx={{
                    minWidth: 120,
                    backgroundColor: task.status === status ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: getStatusColor(status),
                      mr: 1
                    }} 
                  />
                  {getStatusLabel(status)}
                </MenuItem>
              ))}
            </Menu>
            
            {/* Show overdue warning if applicable */}
            {isOverdue(task.dueDate || '') && (
              <Tooltip title="Overdue">
                <ErrorOutlineIcon 
                  color="error" 
                  fontSize="small" 
                  sx={{ ml: 1 }} 
                />
              </Tooltip>
            )}
          </Box>

          <Typography variant="caption" color="text.secondary">
            {formatDate(task.dueDate || '')}
          </Typography>
        </Box>

        {/* Assigned users */}
        {task.assigned_to && task.assigned_to.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Assigned to:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.entries(assigneeNames).length > 0 ? (
                  <AvatarGroup
                    max={3}
                    sx={{
                      '& .MuiAvatar-root': {
                        width: 24,
                        height: 24,
                        fontSize: '0.75rem',
                        border: `1px solid ${theme.palette.background.paper}`,
                      },
                    }}
                  >
                    {Object.entries(assigneeNames).map(([userId, name]) => (
                      <Tooltip key={userId} title={name || 'User'}>
                        <Avatar sx={{ bgcolor: stringToColor(userId) }}>
                          {(name || 'U').charAt(0)}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Loading assignees...
                  </Typography>
                )}
              </Box>

              {/* Status change buttons (optional, in addition to dropdown) */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {previousStatus && (
                  <Tooltip title={`Move to ${getStatusLabel(previousStatus)}`}>
                    <IconButton
                      size="small"
                      onClick={() => handleStatusChange(previousStatus)}
                      disabled={isChangingStatus}
                      sx={{ color: 'text.secondary' }}
                    >
                      <ArrowBackIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {nextStatus && (
                  <Tooltip title={`Move to ${getStatusLabel(nextStatus)}`}>
                    <IconButton
                      size="small"
                      onClick={() => handleStatusChange(nextStatus)}
                      disabled={isChangingStatus}
                      sx={{ color: 'text.secondary' }}
                    >
                      <ArrowForwardIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              No assignees
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default TaskCard; 