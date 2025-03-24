import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  useTheme,
  alpha,
  AvatarGroup,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DoneIcon from '@mui/icons-material/Done';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Task, TaskStatus } from '../../types/task';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { UserService } from '../../services/user';
import { TaskService } from '../../services/task';
import { formatDate, DATE_FORMATS, parseDate, isValidDueDate } from '../../utils/dateUtils';

// Define the grouped tasks interface
interface GroupedTasks {
  pending: Task[];
  in_progress: Task[];
  completed: Task[];
  cancelled: Task[];
}

// Define props interface
interface TaskKanbanBoardProps {
  tasks?: Task[];
  loading?: boolean;
  error?: string | null;
  onCreateTask?: (initialStatus: TaskStatus) => void;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onChangeTaskStatus?: (taskId: string, status: TaskStatus) => Promise<boolean>;
  onTaskUpdate?: (taskId: string, taskUpdate: any) => void;
  onError?: (error: any) => void;
}

// Format date in a compact way with error handling
const formatCompactDate = (dateString: string) => {
  return formatDate(dateString, DATE_FORMATS.COMPACT_DATE);
};

// Check if a due date is overdue
const isOverdue = (dateString: string): boolean => {
  const dueDate = parseDate(dateString);
  if (!dueDate) return false;
  
  return dueDate < new Date() && dueDate.getDate() !== new Date().getDate();
};

// Get color for priority chip
const getPriorityColor = (priority: string, theme: any): string => {
  switch (priority.toLowerCase()) {
    case 'high':
      return theme.palette.error.main;
    case 'medium':
      return theme.palette.warning.main;
    case 'low':
      return theme.palette.success.main;
    default:
      return theme.palette.grey[500];
  }
};

// Task Column Component
interface TaskColumnProps {
  title: string;
  tasks: Task[];
  status: string;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onChangeTaskStatus?: (taskId: string, newStatus: TaskStatus) => Promise<boolean> | void;
  getUserName: (userId: string) => string;
  theme: any;
}

const TaskColumn: React.FC<TaskColumnProps> = ({
  title,
  tasks,
  status,
  onEditTask,
  onDeleteTask,
  onChangeTaskStatus,
  getUserName,
  theme
}) => {
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.palette.warning.main;
      case 'in_progress':
        return theme.palette.info.main;
      case 'completed':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 2,
        p: 1,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ color: getStatusColor(status), fontWeight: 'bold', fontSize: '1rem' }}>
          {title}
        </Typography>
        <Chip 
          label={tasks.length} 
          size="small" 
          sx={{ 
            bgcolor: alpha(getStatusColor(status), 0.2),
            color: getStatusColor(status),
            fontWeight: 'bold',
            height: '20px',
            '& .MuiChip-label': {
              padding: '0 6px'
            }
          }} 
        />
      </Box>

      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto',
        minHeight: 0,
      }}>
        {tasks.map((task, index) => (
          <TaskCard 
            key={task.id}
            task={task}
            statusColor={getStatusColor(status)}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onChangeStatus={onChangeTaskStatus}
            getUserName={getUserName}
            formatDate={formatDate}
            theme={theme}
          />
        ))}
        {tasks.length === 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100px',
            opacity: 0.6
          }}>
            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
              No tasks
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Task Card Component with improved error handling
interface TaskCardProps {
  task: Task;
  statusColor: string;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onChangeStatus?: (taskId: string, newStatus: TaskStatus) => Promise<boolean> | void;
  getUserName: (userId: string) => string;
  formatDate: (dateString: string) => string;
  theme: any;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  statusColor,
  onEdit,
  onDelete,
  onChangeStatus,
  getUserName,
  formatDate,
  theme
}) => {
  // Function to safely render action buttons based on current status
  const renderActionButtons = () => {
    // Ensure task has a valid status
    const status = task.status || TaskStatus.PENDING;
    
    switch (status) {
      case TaskStatus.PENDING:
        return (
          <Tooltip title="Start Task">
            <IconButton
              size="small"
              onClick={() => onChangeStatus && task.id && onChangeStatus(task.id, TaskStatus.IN_PROGRESS)}
              sx={{
                color: theme.palette.info.main,
                p: 0.25,
                ml: 0.25
              }}
            >
              <PlayArrowIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
            </IconButton>
          </Tooltip>
        );
      case TaskStatus.IN_PROGRESS:
        return (
          <>
            <Tooltip title="Move Back to Pending">
              <IconButton
                size="small"
                onClick={() => onChangeStatus && task.id && onChangeStatus(task.id, TaskStatus.PENDING)}
                sx={{
                  color: theme.palette.warning.main,
                  p: 0.25,
                  ml: 0.25
                }}
              >
                <ArrowBackIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Complete Task">
              <IconButton
                size="small"
                onClick={() => onChangeStatus && task.id && onChangeStatus(task.id, TaskStatus.COMPLETED)}
                sx={{
                  color: theme.palette.success.main,
                  p: 0.25,
                  ml: 0.25
                }}
              >
                <DoneIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
          </>
        );
      case TaskStatus.COMPLETED:
        return (
          <>
            <Tooltip title="Reopen Task">
              <IconButton
                size="small"
                onClick={() => onChangeStatus && task.id && onChangeStatus(task.id, TaskStatus.IN_PROGRESS)}
                sx={{
                  color: theme.palette.info.main,
                  p: 0.25,
                  ml: 0.25
                }}
              >
                <ArrowBackIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel Task">
              <IconButton
                size="small"
                onClick={() => onChangeStatus && task.id && onChangeStatus(task.id, TaskStatus.CANCELLED)}
                sx={{
                  color: theme.palette.error.main,
                  p: 0.25,
                  ml: 0.25
                }}
              >
                <CancelIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
          </>
        );
      case TaskStatus.CANCELLED:
        return (
          <Tooltip title="Restore Task">
            <IconButton
              size="small"
              onClick={() => onChangeStatus && task.id && onChangeStatus(task.id, TaskStatus.PENDING)}
              sx={{
                color: theme.palette.warning.main,
                p: 0.25,
                ml: 0.25
              }}
            >
              <ArrowForwardIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
            </IconButton>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  // Safe check if required properties exist
  if (!task || !task.id) {
    return (
      <Card
        sx={{
          mb: 1,
          pt: 0.5,
          pb: 0.5,
          px: 1,
          border: `1px solid ${alpha(theme.palette.error.main, 0.5)}`,
          backgroundColor: alpha(theme.palette.error.main, 0.05)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorOutlineIcon color="error" fontSize="small" />
          <Typography variant="body2" color="error">
            Invalid task data
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        mb: 1,
        pt: 0.5,
        pb: 0.5,
        px: 1,
        border: `1px solid ${alpha(statusColor, 0.3)}`,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 8px ${alpha(statusColor, 0.2)}`
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {/* Title row with actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 'medium', 
              color: '#fff', 
              fontSize: '0.9rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word'
            }}
          >
            {task.title || 'Untitled Task'}
          </Typography>
          <Box sx={{ display: 'flex', ml: 0.5, flexShrink: 0 }}>
            {renderActionButtons()}
            {onEdit && (
              <Tooltip title="Edit Task">
                <IconButton
                  size="small"
                  onClick={() => onEdit(task.id)}
                  sx={{
                    color: theme.palette.text.secondary,
                    p: 0.25,
                    ml: 0.25
                  }}
                >
                  <EditIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Delete Task">
                <IconButton
                  size="small"
                  onClick={() => onDelete(task.id)}
                  sx={{
                    color: theme.palette.error.main,
                    p: 0.25,
                    ml: 0.25
                  }}
                >
                  <DeleteIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {/* Description - truncated */}
        {task.description && (
          <Typography 
            variant="body2" 
            color="textSecondary" 
            sx={{ 
              fontSize: '0.8rem', 
              mb: 0.5, 
              color: alpha('#fff', 0.7),
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word'
            }}
          >
            {task.description}
          </Typography>
        )}
        
        {/* Task details row */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.5
        }}>
          {/* Left section with user info */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            minWidth: 0,
            flex: '1 1 auto'
          }}>
            {task.assigned_to && task.assigned_to.length > 0 && (
              <AvatarGroup max={3} sx={{ 
                '& .MuiAvatar-root': { 
                  width: 20, 
                  height: 20, 
                  fontSize: '0.625rem',
                  border: `1px solid ${theme.palette.background.paper}`
                }
              }}>
                {task.assigned_to.map((userId) => (
                  userId && (
                    <Tooltip key={userId} title={getUserName(userId)}>
                      <Avatar 
                        alt={getUserName(userId)} 
                        sx={{ bgcolor: stringToColor(getUserName(userId)) }}
                      >
                        {getUserName(userId).charAt(0).toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  )
                ))}
              </AvatarGroup>
            )}
            
            {task.due_date && (
              <Typography 
                variant="caption" 
                sx={{ 
                  ml: task.assigned_to && task.assigned_to.length > 0 ? 0.5 : 0, 
                  color: isOverdue(task.due_date) ? theme.palette.error.main : 'text.secondary',
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {formatCompactDate(task.due_date)}
              </Typography>
            )}
          </Box>
          
          {/* Right section with priority */}
          {task.priority && (
            <Chip
              label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.6rem',
                p: 0,
                bgcolor: getPriorityColor(task.priority, theme),
                color: '#fff',
                flexShrink: 0
              }}
            />
          )}
        </Box>
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

const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks = [],
  loading = false,
  error = null,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onChangeTaskStatus,
  onTaskUpdate,
  onError
}) => {
  const theme = useTheme();
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [internalError, setInternalError] = useState<string | null>(null);
  
  // Validate tasks and filter out invalid ones
  const validTasks = tasks.filter(task => {
    // Check if task has the minimal required properties
    if (!task || typeof task !== 'object') return false;
    if (!task.id) return false;
    
    // Task must have a valid status
    if (!task.status || !Object.values(TaskStatus).includes(task.status)) {
      console.warn(`Task ${task.id} has invalid status: ${task.status}`);
      // We'll include it but fix the status
      task.status = TaskStatus.PENDING;
    }
    
    return true;
  });
  
  // Group tasks by status with validation
  const groupedTasks = {
    pending: validTasks.filter(task => task.status === TaskStatus.PENDING),
    in_progress: validTasks.filter(task => task.status === TaskStatus.IN_PROGRESS),
    completed: validTasks.filter(task => task.status === TaskStatus.COMPLETED),
    cancelled: validTasks.filter(task => task.status === TaskStatus.CANCELLED)
  };
  
  // Map status to display names
  const statusMap: Record<string, string> = {
    pending: 'To Do',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  
  // Fetch users with error handling
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setInternalError(null);
        const response = await UserService.getUsers();
        
        if (!response || !Array.isArray(response)) {
          throw new Error('Invalid response from UserService');
        }
        
        // Fix the mapping to ensure we only keep valid user objects
        const usersList = response
          .map((user: any) => {
            // Ensure user object has required properties
            if (!user || !user.id) {
              return null;
            }
            
            return {
              id: user.id.toString(),
              name: user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user.username || user.name || 'Unknown User'
            };
          })
          .filter((user): user is { id: string; name: string } => user !== null); // Type predicate to filter out nulls
        
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        setInternalError('Failed to load user information');
        if (onError) onError(error);
      }
    };
    
    fetchUsers();
  }, [onError]);
  
  // Handle task status change with improved error handling
  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!taskId) {
      console.error('Cannot change status: Invalid task ID');
      setInternalError('Cannot update task: Missing task ID');
      return false;
    }
    
    if (!newStatus || !Object.values(TaskStatus).includes(newStatus)) {
      console.error(`Cannot change to invalid status: ${newStatus}`);
      setInternalError(`Invalid status: ${newStatus}`);
      return false;
    }
    
    try {
      setInternalError(null);
      
      if (onChangeTaskStatus) {
        const success = await onChangeTaskStatus(taskId, newStatus);
        if (success && onTaskUpdate) {
          onTaskUpdate(taskId, { status: newStatus });
        }
        return success;
      }
      
      // Default implementation if no callback provided
      const updatedTask = await TaskService.updateTask(taskId, { status: newStatus });
      if (onTaskUpdate) {
        onTaskUpdate(taskId, updatedTask);
      }
      return true;
    } catch (error) {
      console.error('Error changing task status:', error);
      setInternalError(`Failed to update task status: ${(error as Error).message || 'Unknown error'}`);
      if (onError) onError(error);
      return false;
    }
  };
  
  // Get user name by ID with error handling
  const getUserName = (userId: string) => {
    if (!userId) return 'Unknown User';
    
    try {
      const user = users.find(u => u.id === userId);
      return user ? user.name : 'Unknown User';
    } catch (error) {
      console.error('Error getting user name:', error);
      return 'Unknown User';
    }
  };
  
  // Handle new task creation
  const handleCreateTask = (status: TaskStatus) => {
    if (onCreateTask) {
      onCreateTask(status);
    }
  };
  
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* Header with Add Task button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6" sx={{ 
          color: '#fff',  // Changed from 'text.primary' to '#fff'
          fontWeight: 500 
        }}>
          Task Board
        </Typography>
        {onCreateTask && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onCreateTask(TaskStatus.PENDING)}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
            size="small"
          >
            Add Task
          </Button>
        )}
      </Box>

      {/* Error alert */}
      {(error || internalError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || internalError}
        </Alert>
      )}
      
      {/* Kanban board grid */}
      <Grid container spacing={1} sx={{ flexGrow: 1, height: 'calc(100% - 40px)' }}>
        {Object.entries(groupedTasks).map(([status, tasksInStatus]) => (
          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={status === 'cancelled' ? 6 : 4} 
            lg={3} 
            key={status} 
            sx={{ height: { xs: '400px', sm: '100%' } }}
          >
            <TaskColumn
              title={statusMap[status] || status}
              tasks={tasksInStatus}
              status={status}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onChangeTaskStatus={handleTaskStatusChange}
              getUserName={getUserName}
              theme={theme}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TaskKanbanBoard;
