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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DragDropContext, Droppable, Draggable, DropResult, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd';
import { Task } from '../../types/task';
import { formatDistanceToNow } from 'date-fns';

// Define the task status type
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// Define props interface
interface TaskKanbanBoardProps {
  onCreateTask?: (initialStatus: TaskStatus) => void;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
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

// Task Column Component
interface TaskColumnProps {
  title: string;
  tasks: Task[];
  status: string;
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({
  title,
  tasks,
  status,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const theme = useTheme();
  
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
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: getStatusColor(status), fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Chip 
          label={tasks.length} 
          size="small" 
          sx={{ 
            bgcolor: alpha(getStatusColor(status), 0.2),
            color: getStatusColor(status),
            fontWeight: 'bold'
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
              minHeight: '100px',
              overflowY: 'auto',
              transition: 'background-color 0.2s ease',
              backgroundColor: snapshot.isDraggingOver
                ? alpha(getStatusColor(status), 0.05)
                : 'transparent',
              borderRadius: 1,
              p: 1,
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
                    }}
                  >
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: '#fff', mb: 1 }}>
                          {task.title}
                        </Typography>
                        <Box>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                              }}
                              sx={{ color: theme.palette.info.main, p: 0.5 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask(task.id);
                              }}
                              sx={{ color: theme.palette.error.main, p: 0.5 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {task.due_date && (
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            Due {formatDate(task.due_date)}
                          </Typography>
                        )}
                        
                        {task.assigned_to && task.assigned_to.length > 0 && (
                          <Tooltip title="Assigned Users">
                            <Avatar 
                              sx={{ width: 24, height: 24 }} 
                            >
                              {task.assigned_to.length}
                            </Avatar>
                          </Tooltip>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
      
      <Button
        variant="text"
        startIcon={<AddIcon />}
        onClick={() => onAddTask(status as TaskStatus)}
        sx={{
          mt: 2,
          color: getStatusColor(status),
          borderColor: alpha(getStatusColor(status), 0.5),
          '&:hover': {
            borderColor: getStatusColor(status),
            backgroundColor: alpha(getStatusColor(status), 0.1),
          },
        }}
      >
        Add Task
      </Button>
    </Box>
  );
};

// Auto-scroll provider for drag and drop
const AutoScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    if (!isDragging) return;
    
    // Handle drag over for auto-scrolling
    const handleDragOver = (e: DragEvent) => {
      const { clientY } = e;
      const scrollZoneSize = 150; // Size of the scroll zone in pixels
      const scrollSpeed = 15; // Pixels to scroll per frame
      
      const viewportHeight = window.innerHeight;
      const topScrollZone = scrollZoneSize;
      const bottomScrollZone = viewportHeight - scrollZoneSize;
      
      let scrollDirection = 0;
      
      if (clientY < topScrollZone) {
        // Scroll up when near the top
        scrollDirection = -1;
      } else if (clientY > bottomScrollZone) {
        // Scroll down when near the bottom
        scrollDirection = 1;
      }
      
      if (scrollDirection !== 0) {
        // Calculate scroll amount based on how close to the edge
        let scrollAmount = scrollSpeed;
        
        if (scrollDirection < 0) {
          // For upward scrolling, calculate based on distance from top
          const distanceFromTop = clientY;
          const scrollFactor = 1 - (distanceFromTop / topScrollZone);
          scrollAmount = Math.ceil(scrollSpeed * scrollFactor);
        } else {
          // For downward scrolling, calculate based on distance from bottom
          const distanceFromBottom = viewportHeight - clientY;
          const scrollFactor = 1 - (distanceFromBottom / scrollZoneSize);
          scrollAmount = Math.ceil(scrollSpeed * scrollFactor);
        }
        
        // Apply scrolling
        window.scrollBy({
          top: scrollDirection * scrollAmount,
          behavior: 'auto'
        });
      }
    };
    
    // Add event listener for drag over
    document.addEventListener('dragover', handleDragOver);
    
    // Clean up
    return () => {
      document.removeEventListener('dragover', handleDragOver);
    };
  }, [isDragging]);
  
  return (
    <div onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
    </div>
  );
};

// Main TaskKanbanBoard component
interface TaskKanbanBoardProps {
  tasks?: Task[];
  loading?: boolean;
  error?: string | null;
  onCreateTask?: (initialStatus: TaskStatus) => void;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onChangeTaskStatus?: (taskId: string, status: TaskStatus) => Promise<boolean>;
}

const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks = [],
  loading = false,
  error = null,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onChangeTaskStatus
}) => {
  // Local state for tasks to enable drag and drop without waiting for API
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);
  
  // Group tasks by status
  const tasksByStatus = {
    pending: localTasks.filter(task => task.status === 'pending'),
    in_progress: localTasks.filter(task => task.status === 'in_progress'),
    completed: localTasks.filter(task => task.status === 'completed'),
  };
  
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
    const newStatus = statusMap[destination.droppableId];
    
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
  const handleEditTask = useCallback((task: Task) => {
    if (onEditTask) {
      onEditTask(task.id);
    }
  }, [onEditTask]);
  
  // Handle task deletion
  const handleDeleteTask = useCallback((taskId: string) => {
    if (onDeleteTask) {
      onDeleteTask(taskId);
    }
  }, [onDeleteTask]);
  
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
