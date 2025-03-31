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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Task, TaskStatus } from '../../types/task';
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
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  useEffect(() => {
    const loadUserNames = async () => {
      if (task.assigned_to) {
        const names: { [key: string]: string } = {};
        for (const userId of task.assigned_to) {
          names[userId] = await getUserName(userId);
        }
        setAssigneeNames(names);
      }
    };

    loadUserNames();
  }, [task.assigned_to, getUserName]);

  // Check if a due date is overdue
  const isOverdue = (dateString: string): boolean => {
    const dueDate = new Date(dateString);
    if (!dueDate) return false;
    
    return dueDate < new Date() && dueDate.getDate() !== new Date().getDate();
  };

  // Generate a darker shade of the status color for card border
  const borderColor = alpha(statusColor, 0.8);

  // Handle status change (move to previous or next status)
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (onChangeStatus && !isChangingStatus) {
      setIsChangingStatus(true);
      try {
        await onChangeStatus(task.id, newStatus);
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
                onClick={() => onEdit && onEdit(task.id)}
                sx={{ ml: 1, color: 'text.secondary' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Task">
              <IconButton
                size="small"
                onClick={() => onDelete && onDelete(task.id)}
                sx={{ color: 'error.light' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

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
            <TaskStatusBadge status={task.status as TaskStatus} />
            
            {/* Show overdue warning if applicable */}
            {isOverdue(task.due_date) && (
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
            {formatDate(task.due_date)}
          </Typography>
        </Box>

        {/* Assigned users */}
        {task.assigned_to && task.assigned_to.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              {task.assigned_to.map((userId) => (
                <Tooltip key={userId} title={assigneeNames[userId] || 'User'}>
                  <Avatar sx={{ bgcolor: stringToColor(userId) }}>
                    {(assigneeNames[userId] || 'U').charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>

            {/* Status change buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {previousStatus && (
                <Tooltip title={`Move to ${previousStatus}`}>
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
                <Tooltip title={`Move to ${nextStatus}`}>
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
        )}
      </Box>
    </Card>
  );
};

// Helper function to generate consistent avatar colors
function stringToColor(string: string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

export default TaskCard; 