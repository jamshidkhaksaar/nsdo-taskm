import React, { useState, useCallback, useEffect } from 'react';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DragDropContext, Droppable, Draggable, DropResult, DraggingStyle, NotDraggingStyle } from '@hello-pangea/dnd';
import { Task } from '../../types/task';
import { formatDistanceToNow } from 'date-fns';
import { UserService } from '../../services/user';
import { TaskService } from '../../services/task';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DoneIcon from '@mui/icons-material/Done';
import CancelIcon from '@mui/icons-material/Cancel';

// Define the task status type
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// Define the grouped tasks interface
interface GroupedTasks {
  pending: Task[];
  in_progress: Task[];
  completed: Task[];
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

// Helper component for React Beautiful DnD in StrictMode
const ReactBeautifulDndContext = ({ children }: { children: React.ReactNode }) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <>{children}</>;
};

// Get custom styles for draggable items
const getDragStyle = (isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined): React.CSSProperties => ({
  userSelect: 'none',
  padding: 8,
  margin: '0 0 8px 0',
  borderRadius: '4px',
  background: isDragging ? alpha('#2196f3', 0.1) : 'rgba(255, 255, 255, 0.05)',
  boxShadow: isDragging ? '0 5px 10px rgba(0, 0, 0, 0.2)' : 'none',
  ...draggableStyle,
});

// Format date in a compact way
const formatCompactDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  } catch (error) {
    console.error('Error formatting compact date:', error);
    return '';
  }
};

// Task Column Component
interface TaskColumnProps {
  title: string;
  tasks: Task[];
  status: string;
  onAddTask?: (status: TaskStatus) => void;
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
  onAddTask,
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 2,
        p: 1,
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
      
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flexGrow: 1,
              minHeight: '250px',
              maxHeight: '500px',
              overflowY: 'auto',
              transition: 'background-color 0.2s ease',
              backgroundColor: snapshot.isDraggingOver
                ? alpha(getStatusColor(status), 0.05)
                : 'transparent',
              borderRadius: 1,
              p: 0.5,
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '2px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(getStatusColor(status), 0.2),
                borderRadius: '2px',
              },
            }}
            className={`droppable-column ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    sx={{
                      ...getDragStyle(snapshot.isDragging, provided.draggableProps.style),
                      border: `1px solid ${alpha(getStatusColor(status), 0.3)}`,
                      mb: 1,
                      pt: 0.5,
                      pb: 0.5,
                      px: 1,
                    }}
                  >
                    {/* Main content without CardContent to save space */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      {/* Title row with actions */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: '#fff', fontSize: '0.9rem' }}>
                          {task.title}
                        </Typography>
                        <Box sx={{ display: 'flex', ml: 0.5 }}>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onEditTask) onEditTask(task.id);
                            }}
                            sx={{ color: theme.palette.info.main, p: 0.25, ml: 0.25 }}
                          >
                            <EditIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDeleteTask) onDeleteTask(task.id);
                            }}
                            sx={{ color: theme.palette.error.main, p: 0.25, ml: 0.25 }}
                          >
                            <DeleteIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      {/* Description - allow more lines */}
                      <Tooltip 
                        title={task.description || "No description"}
                        placement="top"
                        enterDelay={500}
                        leaveDelay={200}
                        arrow
                        sx={{
                          maxWidth: 300,
                          bgcolor: 'rgba(0,0,0,0.9)',
                          '& .MuiTooltip-arrow': {
                            color: 'rgba(0,0,0,0.9)',
                          },
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            fontSize: '0.75rem',
                            lineHeight: 1.3,
                            mb: 0.5,
                            cursor: 'help', // Show pointer on hover
                          }}
                        >
                          {task.description}
                        </Typography>
                      </Tooltip>
                      
                      {/* Info row with dates and collaborators */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Dates section */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          {/* Created date */}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.5)',
                              fontSize: '0.65rem',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ opacity: 0.7, marginRight: '4px' }}>Created:</span> 
                            {task.created_at ? formatCompactDate(task.created_at) : 'N/A'}
                          </Typography>
                          
                          {/* Due date - more prominent */}
                          {task.due_date && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: new Date(task.due_date) < new Date() ? theme.palette.error.main : theme.palette.success.main,
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <span style={{ opacity: 0.7, marginRight: '4px', fontWeight: 'normal' }}>Due:</span>
                              {formatCompactDate(task.due_date)}
                            </Typography>
                          )}
                        </Box>
                        
                        {/* Right side - avatars and action buttons */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {/* Display Collaborators */}
                          {task.assigned_to && task.assigned_to.length > 0 && (
                            <AvatarGroup 
                              max={3} 
                              sx={{ 
                                '& .MuiAvatar-root': { 
                                  width: 20, 
                                  height: 20, 
                                  fontSize: '0.7rem',
                                  border: 'none'
                                },
                                mr: 0.5 
                              }}
                            >
                              {task.assigned_to.map((userId, index) => (
                                <Tooltip 
                                  key={index} 
                                  title={getUserName(userId)}
                                  placement="top"
                                >
                                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                    {getUserName(userId).charAt(0).toUpperCase()}
                                  </Avatar>
                                </Tooltip>
                              ))}
                            </AvatarGroup>
                          )}
                          
                          {/* Action buttons */}
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {/* Start button for pending tasks */}
                            {status === 'pending' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onChangeTaskStatus) {
                                    onChangeTaskStatus(task.id, 'in_progress');
                                  }
                                }}
                                sx={{ 
                                  minWidth: '20px', 
                                  height: '18px', 
                                  fontSize: '0.55rem',
                                  padding: '0px 4px',
                                  borderRadius: '2px',
                                  lineHeight: 1
                                }}
                              >
                                Start
                              </Button>
                            )}
                            
                            {/* Complete button for pending or in-progress tasks */}
                            {(status === 'pending' || status === 'in_progress') && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onChangeTaskStatus) {
                                    onChangeTaskStatus(task.id, 'completed');
                                  }
                                }}
                                sx={{ 
                                  minWidth: '20px', 
                                  height: '18px', 
                                  fontSize: '0.55rem',
                                  padding: '0px 4px',
                                  borderRadius: '2px',
                                  lineHeight: 1
                                }}
                              >
                                Done
                              </Button>
                            )}
                            
                            {/* Cancel button for in-progress or completed tasks */}
                            {(status === 'in_progress' || status === 'completed') && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onChangeTaskStatus) {
                                    onChangeTaskStatus(task.id, 'pending');
                                  }
                                }}
                                sx={{ 
                                  minWidth: '20px', 
                                  height: '18px', 
                                  fontSize: '0.55rem',
                                  padding: '0px 4px',
                                  borderRadius: '2px',
                                  lineHeight: 1
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
      
      {/* Add task button at bottom of column */}
      {onAddTask && (
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Button 
            startIcon={<AddIcon />} 
            onClick={() => onAddTask(status as TaskStatus)}
            variant="outlined"
            size="small"
            color="primary"
            sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          >
            Add Task
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Auto-scroll provider component 
const AutoScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const [autoScrollInterval, setAutoScrollInterval] = useState<number | null>(null);
  
  const handleDragStart = () => {
    // Reset auto-scroll on drag start
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
  };
  
  const handleDragEnd = () => {
    // Clean up auto-scroll on drag end
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
  };
  
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      const { clientY } = e;
      const scrollContainer = document.querySelector('.droppable-column');
      
      if (!scrollContainer) return;
      
      const containerRect = scrollContainer.getBoundingClientRect();
      const topScrollZone = containerRect.top + 50;
      const bottomScrollZone = containerRect.bottom - 50;
      
      // Clear existing interval
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        setAutoScrollInterval(null);
      }
      
      // Set new interval if in scroll zones
      if (clientY < topScrollZone) {
        // Scroll up
        const interval = window.setInterval(() => {
          scrollContainer.scrollTop -= 10;
        }, 50);
        setAutoScrollInterval(interval);
      } else if (clientY > bottomScrollZone) {
        // Scroll down
        const interval = window.setInterval(() => {
          scrollContainer.scrollTop += 10;
        }, 50);
        setAutoScrollInterval(interval);
      }
    };
    
    document.addEventListener('dragover', handleDragOver);
    
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };
  }, [autoScrollInterval]);
  
  return (
    <div onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
    </div>
  );
};

// Main TaskKanbanBoard component
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
  const [tasksByStatus, setTasksByStatus] = useState<GroupedTasks>({
    pending: [],
    in_progress: [],
    completed: []
  });
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [users, setUsers] = useState<Map<string, any>>(new Map());
  
  // Update local tasks when props change
  useEffect(() => {
    console.log('TaskKanbanBoard received tasks:', tasks);
    
    // Process tasks - ensure assigned_to is an array
    const processedTasks = tasks.map(task => {
      console.log(`Processing task ${task.id}:`, task);
      console.log(`Task ${task.id} assigned_to:`, task.assigned_to);
      
      return {
        ...task,
        assigned_to: Array.isArray(task.assigned_to) 
          ? task.assigned_to 
          : (task.assigned_to ? [task.assigned_to] : [])
      };
    });
    
    console.log('Processed tasks in TaskKanbanBoard:', processedTasks);
    setLocalTasks(processedTasks);
  }, [tasks]);
  
  // Group tasks by status
  useEffect(() => {
    const grouped = localTasks.reduce((acc, task) => {
      if (task.status === 'pending') {
        acc.pending.push(task);
      } else if (task.status === 'in_progress') {
        acc.in_progress.push(task);
      } else if (task.status === 'completed') {
        acc.completed.push(task);
      }
      return acc;
    }, { pending: [] as Task[], in_progress: [] as Task[], completed: [] as Task[] });
    
    console.log('Tasks grouped by status:', grouped);
    setTasksByStatus(grouped);
  }, [localTasks]);
  
  // Handle drag end
  const handleDragEnd = useCallback((result: DropResult) => {
    setIsDragging(false);
    
    const { source, destination, draggableId } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Map droppable IDs to task statuses
    const statusMap: Record<string, TaskStatus> = {
      'pending': 'pending',
      'in_progress': 'in_progress',
      'completed': 'completed',
    };
    
    // Get the new status
    const newStatus = statusMap[destination.droppableId as string];
    
    // Find the task
    const taskToUpdate = localTasks.find(task => task.id === draggableId);
    
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;
    
    // Optimistically update the UI
    const updatedTasks = localTasks.map(task => 
      task.id === draggableId ? { ...task, status: newStatus } : task
    );
    
    setLocalTasks(updatedTasks);
    
    // Call the API to update the task status
    if (onChangeTaskStatus) {
      onChangeTaskStatus(draggableId, newStatus)
        .catch(() => {
          // Revert to original state if the API call fails
          setLocalTasks(localTasks);
          // You could also add a visual notification here for the error
        });
    }
  }, [localTasks, onChangeTaskStatus]);
  
  // Handle task creation
  const handleCreateTask = useCallback((status: TaskStatus) => {
    if (onCreateTask) {
      onCreateTask(status);
    }
  }, [onCreateTask]);
  
  // Handle task editing
  const handleEditTask = useCallback((taskId: string) => {
    if (onEditTask) {
      onEditTask(taskId);
    }
  }, [onEditTask]);
  
  // Handle task deletion
  const handleDeleteTask = useCallback((taskId: string) => {
    if (onDeleteTask) {
      onDeleteTask(taskId);
    }
  }, [onDeleteTask]);
  
  // Handle task status change
  const handleChangeTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    if (onChangeTaskStatus) {
      // Optimistically update the UI
      const updatedTasks = localTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      
      setLocalTasks(updatedTasks);
      
      // Call the API to update the task status
      onChangeTaskStatus(taskId, newStatus)
        .catch(() => {
          // Revert to original state if the API call fails
          setLocalTasks(localTasks);
        });
    }
  }, [localTasks, onChangeTaskStatus]);
  
  // Add a function to fetch user information
  const fetchUsers = async () => {
    try {
      const usersList = await UserService.getUsers();
      const usersMap = new Map();
      usersList.forEach((user: any) => {
        usersMap.set(user.id, user);
      });
      setUsers(usersMap);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Function to get user name from the users map
  const getUserName = (userId: string) => {
    if (users.has(userId)) {
      return users.get(userId).name || users.get(userId).username || users.get(userId).first_name || userId;
    }
    return userId;
  };

  useEffect(() => {
    // Fetch users when component mounts
    fetchUsers();
  }, []);

  return (
    <ReactBeautifulDndContext>
      <AutoScrollProvider>
        <DragDropContext
          onDragEnd={handleDragEnd}
          onDragStart={() => setIsDragging(true)}
        >
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            // Apply subtle styling when dragging is happening
            ...(isDragging && {
              '& .droppable-column:not(.dragging-over)': {
                opacity: 0.75
              },
              '& .dragging-over': {
                opacity: 1,
                transition: 'all 0.2s ease'
              }
            })
          }}>
            <Grid container spacing={1} sx={{ flexGrow: 1, height: '100%' }}>
              <Grid item xs={12} md={4} sx={{ height: { md: '100%' } }}>
                <TaskColumn
                  title="To Do"
                  tasks={tasksByStatus.pending}
                  status="pending"
                  onAddTask={handleCreateTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onChangeTaskStatus={handleChangeTaskStatus}
                  getUserName={getUserName}
                  theme={theme}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ height: { md: '100%' } }}>
                <TaskColumn
                  title="In Progress"
                  tasks={tasksByStatus.in_progress}
                  status="in_progress"
                  onAddTask={handleCreateTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onChangeTaskStatus={handleChangeTaskStatus}
                  getUserName={getUserName}
                  theme={theme}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ height: { md: '100%' } }}>
                <TaskColumn
                  title="Completed"
                  tasks={tasksByStatus.completed}
                  status="completed"
                  onAddTask={handleCreateTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onChangeTaskStatus={handleChangeTaskStatus}
                  getUserName={getUserName}
                  theme={theme}
                />
              </Grid>
            </Grid>
          </Box>
        </DragDropContext>
      </AutoScrollProvider>
    </ReactBeautifulDndContext>
  );
};

export default TaskKanbanBoard;
