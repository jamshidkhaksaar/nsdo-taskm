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
  Chip,
  useTheme,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Task, TaskStatus, TaskPriority } from '../../types';
import TaskStatusBadge from './TaskStatusBadge';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';

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

// Helper for Priority
const getPriorityChipProps = (priority?: TaskPriority) => {
  switch (priority) {
    case TaskPriority.HIGH:
      return { label: 'High', color: 'error' as const, icon: <ErrorOutlineIcon fontSize="small" /> };
    case TaskPriority.MEDIUM:
      return { label: 'Medium', color: 'warning' as const, icon: <ErrorOutlineIcon fontSize="small" /> };
    case TaskPriority.LOW:
      return { label: 'Low', color: 'info' as const, icon: <ErrorOutlineIcon fontSize="small" /> };
    default:
      return null;
  }
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  statusColor,
  onEdit,
  onDelete,
  onChangeStatus,
  getUserName,
  formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  theme,
}) => {
  const [assigneeNames, setAssigneeNames] = useState<{ [key: string]: string }>({});
  const [creatorName, setCreatorName] = useState<string>('');
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);

  const glassmorphismStyles = getGlassmorphismStyles(theme);

  useEffect(() => {
    const loadUserDetails = async () => {
      // Load assignee names using task.assignedToUserIds
      if (task.assignedToUserIds && task.assignedToUserIds.length > 0) {
        const names: { [key: string]: string } = {};
        for (const userId of task.assignedToUserIds) {
          if (userId) {
            names[userId] = await getUserName(userId);
          }
        }
        setAssigneeNames(names);
      }
      
      // Load creator name using task.createdById
      if (task.createdById) { 
        try {
          const name = await getUserName(task.createdById);
          setCreatorName(name);
        } catch (error) {
          console.error('Error fetching creator name:', error);
          setCreatorName('Unknown');
        }
      }
    };

    loadUserDetails();
  }, [task.assignedToUserIds, task.createdById, getUserName]);

  // Check if a due date is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  // Handle status change menu
  const handleStatusMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setStatusAnchorEl(event.currentTarget);
  };
  const handleStatusMenuClose = () => {
    setStatusAnchorEl(null);
  };
  const handleStatusChange = async (newStatus: TaskStatus) => {
    handleStatusMenuClose();
    if (onChangeStatus && !isChangingStatus) {
      setIsChangingStatus(true);
      try {
        await onChangeStatus(String(task.id), newStatus);
      } finally {
        setIsChangingStatus(false);
      }
    }
  };

  // Handle actions menu (Edit/Delete)
  const handleActionMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setActionAnchorEl(event.currentTarget);
  };
  const handleActionMenuClose = () => {
    setActionAnchorEl(null);
  };
  const handleEdit = () => {
    handleActionMenuClose();
    onEdit && onEdit(String(task.id));
  };
  const handleDelete = () => {
    handleActionMenuClose();
    onDelete && onDelete(String(task.id));
  };

  const priorityProps = getPriorityChipProps(task.priority);
  const assignees = task.assignedToUserIds || [];

  return (
    <Card
      sx={{
        position: 'relative',
        backgroundColor: alpha(theme.palette.background.paper, 0.7),
        backdropFilter: 'blur(5px)',
        borderRadius: '12px',
        border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        boxShadow: theme.shadows[1],
        mb: 1.5,
        overflow: 'visible',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header: Title and Actions Menu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium', color: 'text.primary', mr: 1 }}>
            {task.title}
          </Typography>
          <IconButton
            size="small"
            onClick={handleActionMenuClick}
            sx={{ color: 'text.secondary', p: 0.25 }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={actionAnchorEl}
            open={Boolean(actionAnchorEl)}
            onClose={handleActionMenuClose}
          >
            {onEdit && <MenuItem onClick={handleEdit}><EditIcon fontSize="small" sx={{ mr: 1 }}/> Edit</MenuItem>}
            {onDelete && <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" sx={{ mr: 1 }}/> Delete</MenuItem>}
          </Menu>
        </Box>

        {/* Description */}
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

        {/* Meta Info Row: Priority & Due Date */}
        <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: 'center' }}>
          {priorityProps && (
            <Chip
              icon={priorityProps.icon}
              label={priorityProps.label}
              color={priorityProps.color}
              size="small"
              sx={{ height: '22px', fontSize: '0.75rem' }}
            />
          )}
          {task.dueDate && (
            <Tooltip title={`Due: ${formatDate ? formatDate(task.dueDate) : task.dueDate}`}>
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: '1rem', ml: '2px' }} />}
                label={formatDate ? formatDate(task.dueDate) : task.dueDate}
                size="small"
                sx={{
                  height: '22px',
                  fontSize: '0.75rem',
                  color: isOverdue ? theme.palette.error.main : theme.palette.text.secondary,
                  bgcolor: alpha(theme.palette.grey[500], 0.1),
                  border: isOverdue ? `1px solid ${theme.palette.error.main}` : 'none',
                  '& .MuiChip-icon': { color: isOverdue ? theme.palette.error.main : theme.palette.text.secondary },
                }}
              />
            </Tooltip>
          )}
        </Stack>

        {/* Footer Row: Assignees & Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Assignees Avatars */}
          <AvatarGroup 
            max={4} 
            total={assignees.length}
            sx={{ 
              '& .MuiAvatar-root': { 
                width: 28, 
                height: 28, 
                fontSize: '0.75rem', 
                border: `2px solid ${theme.palette.background.paper}`
              }, 
            }}
          >
            {assignees.map(userId => (
              <Tooltip key={userId} title={assigneeNames[userId] || 'Loading...'}>
                <Avatar sx={{ bgcolor: stringToColor(userId || 'default') }}>
                  {(assigneeNames[userId] || '?').charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>

          {/* Status Badge/Button */}
          <Box>
            <Tooltip title="Change Status">
              <Chip
                label={getStatusLabel(task.status as TaskStatus)}
                onClick={handleStatusMenuClick}
                onDelete={handleStatusMenuClick}
                deleteIcon={<KeyboardArrowDownIcon />}
                size="small"
                disabled={isChangingStatus}
                sx={{
                  bgcolor: alpha(statusColor, 0.15),
                  color: statusColor,
                  fontWeight: 'medium',
                  cursor: 'pointer',
                  '& .MuiChip-label': { pr: 0.5 },
                  '& .MuiChip-deleteIcon': { 
                    color: alpha(statusColor, 0.7),
                    '&:hover': {
                      color: statusColor,
                    }
                  }
                }}
              />
            </Tooltip>
            <Menu
              anchorEl={statusAnchorEl}
              open={Boolean(statusAnchorEl)}
              onClose={handleStatusMenuClose}
            >
              {Object.values(TaskStatus).map((status) => (
                <MenuItem 
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  selected={task.status === status}
                  disabled={task.status === status}
                >
                  {getStatusLabel(status)}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default TaskCard; 