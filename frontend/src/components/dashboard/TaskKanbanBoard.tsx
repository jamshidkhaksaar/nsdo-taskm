import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Grid,
  useTheme,
  alpha,
  Tooltip,
  Stack,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext, Droppable, Draggable, DropResult, ResponderProvided, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd';
import { Task, TaskStatus } from '../../types/task';
import { useMockTaskContext } from '../../contexts/MockTaskContext';

// Fix for React 18 Strict Mode with react-beautiful-dnd
const ReactBeautifulDndContext = ({ children }: { children: React.ReactNode }) => {
  const [enabled, setEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Wait until after client-side hydration to enable
    const timeout = setTimeout(() => {
      setEnabled(true);
      setIsInitializing(false);
    }, 1500); // Further increased timeout for more reliable initialization
    return () => clearTimeout(timeout);
  }, []);

  if (isInitializing || !enabled) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        p: 3,
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={24} color="primary" />
        <Typography variant="body2">Loading kanban board...</Typography>
        <Typography variant="caption" color="text.secondary">
          {isInitializing ? "Initializing drag and drop..." : "Waiting for the drag-and-drop functionality to initialize"}
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

// Custom function to get drag styles with better touch support
const getDragStyle = (isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined): React.CSSProperties => ({
  // Basic styles for draggable items - improves touch dragging
  userSelect: 'none',
  // Apply styles from react-beautiful-dnd
  ...draggableStyle,
  // If dragging, add transform transition for smoother appearance when dropped
  ...(isDragging && {
    transition: 'transform 0.1s ease-out',
  }),
});

// Task Card Component
const TaskCard = memo(({ task, index, onEdit, onDelete }: { 
  task: Task; 
  index: number; 
  onEdit: (task: Task) => void; 
  onDelete: (taskId: string) => void;
}) => {
  const theme = useTheme();
  
  // Priority colors
  const priorityColors = {
    low: theme.palette.info.main,
    medium: theme.palette.warning.main,
    high: theme.palette.error.main
  };

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          elevation={snapshot.isDragging ? 6 : 1}
          sx={{
            p: 1.5,
            mb: 1.5,
            borderRadius: 1.5,
            backgroundColor: snapshot.isDragging 
              ? alpha(theme.palette.primary.light, 0.1) 
              : 'rgba(30, 41, 59, 0.8)',
            border: `1px solid ${snapshot.isDragging 
              ? theme.palette.primary.main 
              : 'rgba(255, 255, 255, 0.1)'}`,
            '&:hover': {
              boxShadow: '0 4px 20px 0 rgba(0,0,0,0.2)',
              '& .drag-handle': {
                opacity: 1,
              }
            },
            transition: 'all 0.2s ease',
            position: 'relative',
            backdropFilter: 'blur(10px)',
            color: 'rgba(255, 255, 255, 0.9)',
            boxShadow: snapshot.isDragging 
              ? '0 8px 24px 0 rgba(0,0,0,0.3)' 
              : '0 2px 10px 0 rgba(0,0,0,0.15)',
            transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
            zIndex: snapshot.isDragging ? 1200 : 1,
            // Make touch selection easier
            touchAction: 'none',
            // Add enhanced accessibility for keyboard navigation
            tabIndex: 0,
            // Add a visual indicator for drag state for better UX
            outline: snapshot.isDragging ? `2px solid ${theme.palette.primary.main}` : 'none',
          }}
          style={getDragStyle(snapshot.isDragging, provided.draggableProps.style)}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 'medium', 
                mb: 0.5,
                color: 'rgba(255, 255, 255, 0.95)'
              }}>
                {task.title}
              </Typography>
            </Box>
            <Box 
              {...provided.dragHandleProps} 
              className="drag-handle"
              sx={{ 
                opacity: 0.3,
                transition: 'opacity 0.2s',
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                color: 'rgba(255, 255, 255, 0.7)',
                // Improved touch target size for mobile
                padding: '4px',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  opacity: 1
                },
                // Ensure good touch target size (at least 44x44px is recommended)
                minWidth: '32px',
                minHeight: '32px',
                justifyContent: 'center'
              }}
            >
              <DragIndicatorIcon fontSize="small" />
            </Box>
          </Box>
          
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            {task.description}
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Chip 
              label={task.priority} 
              size="small"
              sx={{ 
                backgroundColor: alpha(priorityColors[task.priority as keyof typeof priorityColors], 0.2),
                color: priorityColors[task.priority as keyof typeof priorityColors],
                fontWeight: 'medium',
                fontSize: '0.7rem',
                borderRadius: '4px',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
            
            <Typography variant="caption" sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 'medium'
            }}>
              {new Date(task.due_date).toLocaleDateString()}
            </Typography>
          </Stack>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            mt: 1.5,
            pt: 1,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Button 
              size="small" 
              onClick={() => onEdit(task)}
              sx={{ 
                minWidth: 'auto', 
                px: 1,
                color: theme.palette.primary.light,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              Edit
            </Button>
            <Button 
              size="small" 
              color="error" 
              onClick={() => onDelete(task.id)}
              sx={{ 
                minWidth: 'auto', 
                px: 1,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1)
                }
              }}
            >
              Delete
            </Button>
          </Box>
        </Paper>
      )}
    </Draggable>
  );
});

// Task Column Component with improved droppable area
const TaskColumn = memo(({ 
  title, 
  tasks, 
  status, 
  onAddTask, 
  onEditTask, 
  onDeleteTask 
}: { 
  title: string; 
  tasks: Task[]; 
  status: TaskStatus; 
  onAddTask: (status: TaskStatus) => void; 
  onEditTask: (task: Task) => void; 
  onDeleteTask: (taskId: string) => void;
}) => {
  const theme = useTheme();
  
  // Column header colors based on status
  const columnColors = {
    pending: theme.palette.info.main,
    in_progress: theme.palette.warning.main,
    completed: theme.palette.success.main
  };
  
  const columnColor = columnColors[status as keyof typeof columnColors];
  
  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'rgba(15, 23, 42, 0.3)',
      borderRadius: 2,
      p: 1,
      boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1,
        px: 1,
        pb: 1,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              backgroundColor: columnColor,
              mr: 1,
              boxShadow: `0 0 8px ${alpha(columnColor, 0.5)}`
            }} 
          />
          <Typography variant="subtitle2" fontWeight="500" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {title} ({tasks.length})
          </Typography>
        </Box>
        <Tooltip title={`Add task to ${title}`}>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => onAddTask(status)}
            sx={{ 
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              padding: '4px',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`droppable-column ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            sx={{
              minHeight: 100,
              height: '100%',
              backgroundColor: snapshot.isDraggingOver 
                ? alpha(columnColor, 0.15) 
                : 'transparent',
              borderRadius: 1,
              p: 0.5,
              transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.05)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                },
              },
              ...(snapshot.isDraggingOver && {
                boxShadow: `inset 0 0 0 2px ${columnColor}`,
                animation: 'pulse 1.5s infinite ease-in-out',
                '@keyframes pulse': {
                  '0%': { boxShadow: `inset 0 0 0 2px ${columnColor}` },
                  '50%': { boxShadow: `inset 0 0 0 2px ${alpha(columnColor, 0.5)}` },
                  '100%': { boxShadow: `inset 0 0 0 2px ${columnColor}` }
                }
              })
            }}
          >
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  index={index} 
                  onEdit={onEditTask} 
                  onDelete={onDeleteTask} 
                />
              ))
            ) : (
              <Box 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 1,
                  borderRadius: 1,
                  border: `1px dashed ${snapshot.isDraggingOver ? columnColor : 'rgba(255, 255, 255, 0.15)'}`,
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  ...(snapshot.isDraggingOver && {
                    backgroundColor: alpha(columnColor, 0.05),
                    borderColor: columnColor
                  })
                }}
              >
                <Typography variant="caption" sx={{ 
                  color: snapshot.isDraggingOver ? columnColor : 'rgba(255, 255, 255, 0.5)',
                  transition: 'color 0.2s ease',
                  fontWeight: snapshot.isDraggingOver ? 'medium' : 'normal'
                }} align="center">
                  {snapshot.isDraggingOver ? 'Drop here' : 'No tasks yet'}
                </Typography>
              </Box>
            )}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Box>
  );
});

// Add a custom component for autoscrolling during drag operations
const AutoScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const [scrollingEnabled, setScrollingEnabled] = useState(false);
  const [scrollPosition, setScrollPosition] = useState<{ x: number; y: number } | null>(null);
  const [scrollTimer, setScrollTimer] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Enable scrolling when dragging begins
    const handleDragStart = () => {
      setScrollingEnabled(true);
    };
    
    // Disable scrolling when dragging ends
    const handleDragEnd = () => {
      setScrollingEnabled(false);
      setScrollPosition(null);
      
      if (scrollTimer) {
        clearInterval(scrollTimer);
        setScrollTimer(null);
      }
    };
    
    // Track mouse position during drag
    const handleDragOver = (e: DragEvent) => {
      if (!scrollingEnabled) return;
      
      setScrollPosition({ x: e.clientX, y: e.clientY });
    };
    
    // Set up event listeners
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('dragover', handleDragOver);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('dragover', handleDragOver);
      
      if (scrollTimer) {
        clearInterval(scrollTimer);
      }
    };
  }, [scrollingEnabled, scrollTimer]);
  
  useEffect(() => {
    if (!scrollingEnabled || !scrollPosition) return;
    
    // Set up interval for scrolling
    if (!scrollTimer) {
      const timer = setInterval(() => {
        // Find all droppable columns
        const columns = document.querySelectorAll('.droppable-column');
        
        columns.forEach((column) => {
          const rect = column.getBoundingClientRect();
          
          // Check if mouse is over this column
          if (
            scrollPosition.x >= rect.left &&
            scrollPosition.x <= rect.right &&
            scrollPosition.y >= rect.top &&
            scrollPosition.y <= rect.bottom
          ) {
            // Determine scroll direction and speed
            const scrollContainer = column as HTMLElement;
            const scrollSpeed = 10;
            const scrollThreshold = 60; // pixels from edge
            
            // Calculate distance from top and bottom edges
            const distanceFromTop = scrollPosition.y - rect.top;
            const distanceFromBottom = rect.bottom - scrollPosition.y;
            
            // Scroll up if near top
            if (distanceFromTop < scrollThreshold) {
              const scrollAmount = Math.max(1, (scrollThreshold - distanceFromTop) / 10) * scrollSpeed;
              scrollContainer.scrollBy(0, -scrollAmount);
            }
            // Scroll down if near bottom
            else if (distanceFromBottom < scrollThreshold) {
              const scrollAmount = Math.max(1, (scrollThreshold - distanceFromBottom) / 10) * scrollSpeed;
              scrollContainer.scrollBy(0, scrollAmount);
            }
          }
        });
      }, 100); // Adjust interval for smoother/faster scrolling
      
      setScrollTimer(timer);
    }
    
    return () => {
      if (scrollTimer) {
        clearInterval(scrollTimer);
        setScrollTimer(null);
      }
    };
  }, [scrollingEnabled, scrollPosition, scrollTimer]);
  
  return <>{children}</>;
};

// Main component
interface TaskKanbanBoardProps {
  onCreateTask?: (initialStatus: TaskStatus) => void;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  onCreateTask,
  onEditTask,
  onDeleteTask
}) => {
  const { tasks, loading, error, changeTaskStatus } = useMockTaskContext();
  const [isDragging, setIsDragging] = useState(false);
  
  // Local state for tasks to enable immediate UI updates
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  
  // Update local tasks when API tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      setLocalTasks(tasks);
    }
  }, [tasks]);
  
  // Group tasks by status
  const tasksByStatus = {
    pending: localTasks.filter(task => task.status === 'pending'),
    in_progress: localTasks.filter(task => task.status === 'in_progress'),
    completed: localTasks.filter(task => task.status === 'completed')
  };
  
  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    // Add a class to the body to indicate dragging state for global styling if needed
    document.body.classList.add('dragging');
  }, []);
  
  // Handle drag end
  const handleDragEnd = useCallback((result: DropResult, provided: ResponderProvided) => {
    setIsDragging(false);
    document.body.classList.remove('dragging');
    
    const { destination, source, draggableId } = result;
    
    // If there's no destination or the item was dropped back in its original position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Find the task that was dragged
    const task = localTasks.find(t => String(t.id) === draggableId);
    if (!task) {
      console.error('Task not found:', draggableId);
      return;
    }
    
    // Create a new array of tasks
    const newTasks = [...localTasks];
    
    // Update the task's status based on the destination column
    const updatedTask = {
      ...task,
      status: destination.droppableId as TaskStatus
    };
    
    // Update the task in the local state
    const taskIndex = newTasks.findIndex(t => String(t.id) === draggableId);
    if (taskIndex === -1) {
      console.error('Task index not found:', draggableId);
      return;
    }
    
    newTasks[taskIndex] = updatedTask;
    
    // Update local state immediately for a responsive UI
    setLocalTasks(newTasks);
    
    // Update the task status on the server
    changeTaskStatus(draggableId, destination.droppableId as TaskStatus)
      .catch(error => {
        console.error('Error updating task status:', error);
        // Revert to original state if the API call fails
        setLocalTasks(localTasks);
        // You could also add a visual notification here for the error
      });
  }, [localTasks, changeTaskStatus]);
  
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
  
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading tasks...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Using mock data for demonstration purposes.
        </Typography>
      </Box>
    );
  }
  
  return (
    <ReactBeautifulDndContext>
      <AutoScrollProvider>
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
