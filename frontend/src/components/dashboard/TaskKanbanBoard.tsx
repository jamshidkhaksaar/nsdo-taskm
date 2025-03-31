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
import { Task, TaskStatus, TaskPriority, TaskUpdate } from '../../types/task';
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

// Get color for status
const getStatusColor = (status: string, theme: any): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return theme.palette.warning.main;
    case 'in_progress':
      return theme.palette.info.main;
    case 'completed':
      return theme.palette.success.main;
    case 'cancelled':
      return theme.palette.grey[500];
    default:
      return theme.palette.grey[500];
  }
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

const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const user = await UserService.getUserById(userId);
    return user?.name || user?.username || 'Unknown User';
  } catch (error) {
    console.error('Error getting user display name:', error);
    return 'Unknown User';
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
  getUserName: (userId: string) => Promise<string>;
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
  return (
    <Box
      sx={{
        height: '100%',
        bgcolor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 1.5,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ color: getStatusColor(status, theme), fontWeight: 'bold', fontSize: '1rem' }}>
          {title}
        </Typography>
        <Chip 
          label={tasks.length} 
          size="small" 
          sx={{ 
            bgcolor: alpha(getStatusColor(status, theme), 0.2),
            color: getStatusColor(status, theme),
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
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0,0,0,0.1)'
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px'
        }
      }}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            statusColor={getStatusColor(status, theme)}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onChangeStatus={onChangeTaskStatus}
            getUserName={getUserName}
            formatDate={formatCompactDate}
            theme={theme}
          />
        ))}
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
  getUserName: (userId: string) => Promise<string>;
  formatDate?: (dateString: string) => string;
  theme?: any;
  onTaskUpdate?: (updatedTask: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  statusColor,
  onEdit,
  onDelete,
  onChangeStatus,
  getUserName,
  formatDate = formatCompactDate,
  theme,
  onTaskUpdate
}) => {
  const [assigneeNames, setAssigneeNames] = useState<{ [key: string]: string }>({});

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

  const handlePriorityClick = async (priority: TaskPriority) => {
    try {
      const result = await TaskService.updateTask(task.id, {
        priority,
        updated_at: new Date().toISOString()
      });

      if (onTaskUpdate) {
        onTaskUpdate(result);
      }
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

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
                    <Tooltip key={userId} title={assigneeNames[userId] || 'Loading...'}>
                      <Avatar 
                        alt={assigneeNames[userId] || 'Loading...'}
                        sx={{ bgcolor: stringToColor(assigneeNames[userId] || 'Unknown') }}
                      >
                        {(assigneeNames[userId] || '?').charAt(0).toUpperCase()}
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
              onClick={() => {
                const nextPriority = {
                  [TaskPriority.LOW]: TaskPriority.MEDIUM,
                  [TaskPriority.MEDIUM]: TaskPriority.HIGH,
                  [TaskPriority.HIGH]: TaskPriority.LOW
                }[task.priority] || TaskPriority.MEDIUM;
                handlePriorityClick(nextPriority);
              }}
              sx={{
                height: 16,
                fontSize: '0.6rem',
                p: 0,
                bgcolor: getPriorityColor(task.priority, theme),
                color: '#fff',
                flexShrink: 0,
                cursor: 'pointer'
              }}
            />
          )}
        </Box>
      </Box>
    </Card>
  );
};

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
  const [internalError, setInternalError] = useState<string | null>(null);

  // Group tasks by status with validation
  const groupedTasks = {
    pending: tasks.filter(task => task.status === TaskStatus.PENDING),
    in_progress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS),
    completed: tasks.filter(task => task.status === TaskStatus.COMPLETED),
    cancelled: tasks.filter(task => task.status === TaskStatus.CANCELLED)
  };

  // Map status to display names
  const statusMap: Record<string, string> = {
    pending: 'To Do',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  const handleTaskUpdate = async (taskId: string, updatedTask: Task) => {
    try {
      // Update local state
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? updatedTask : t
      );
      
      // Notify parent component
      if (onTaskUpdate) {
        await onTaskUpdate(taskId, updatedTask);
      }
    } catch (error) {
      console.error('Error in handleTaskUpdate:', error);
      setInternalError('Failed to update task');
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '16px',
      border: '1px solid',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      boxShadow: '0 0 1px rgba(255, 255, 255, 0.1)', // Adds subtle depth
      p: 2,
      position: 'relative',
      '&::after': {  // This adds an additional border effect
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        pointerEvents: 'none'
      }
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6" sx={{ 
          color: '#fff',
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

      {(error || internalError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || internalError}
        </Alert>
      )}

      <Grid 
        container 
        spacing={2}
        sx={{ 
          flexGrow: 1,
          m: 0,
          width: '100%',
          height: 'calc(100% - 48px)',
        }}
      >
        {Object.entries(groupedTasks).map(([status, statusTasks]) => (
          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={status === 'cancelled' ? 6 : 4} 
            lg={3} 
            key={status}
            sx={{ 
              height: '100%',
              maxHeight: '100%',
            }}
          >
            <TaskColumn
              title={statusMap[status]}
              tasks={statusTasks}
              status={status}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onChangeTaskStatus={onChangeTaskStatus}
              getUserName={getUserDisplayName}
              theme={theme}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TaskKanbanBoard;
