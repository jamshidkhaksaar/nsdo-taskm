import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  IconButton,
  Grid,
  useTheme,
  Paper,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Task, TaskStatus, TaskPriority, User } from '../../types';
import { UserService } from '../../services/user';
import { formatDate, DATE_FORMATS, parseDate } from '../../utils/dateUtils';
import { KanbanColumn } from '../kanban';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { useTaskPermissions } from '@/hooks/useTaskPermissions';

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
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
  onTaskClick: (task: Task) => void;
  currentUser: User | null;
}

// Format date in a compact way with error handling
const formatCompactDate = (dateString: string) => {
  return formatDate(dateString, DATE_FORMATS.COMPACT_DATE);
};

const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const user = await UserService.getUserById(userId);
    return user?.name || user?.username || 'Unknown User';
  } catch (error) {
    console.error('Error getting user display name:', error);
    return 'Unknown User';
  }
};

// Define columns based on TaskStatus
const columns: { id: TaskStatus; title: string }[] = [
  { id: TaskStatus.PENDING, title: 'Pending' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress' },
  { id: TaskStatus.COMPLETED, title: 'Completed' },
  { id: TaskStatus.CANCELLED, title: 'Cancelled' },
];

// Helper to reorder tasks within the same column (optional, not strictly needed for status change)
const reorder = (list: Task[], startIndex: number, endIndex: number): Task[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
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
  onError,
  onTaskStatusChange,
  onTaskClick,
  currentUser
}) => {
  const theme = useTheme();
  const [internalError, setInternalError] = useState<string | null>(null);
  // State to hold tasks grouped by status
  const [boardState, setBoardState] = useState<Record<TaskStatus, Task[]>>({} as Record<TaskStatus, Task[]>);

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

  // Update board state when tasks prop changes
  useEffect(() => {
    const newBoardState = columns.reduce((acc, column) => {
      acc[column.id] = tasks.filter(task => task.status === column.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Simple sort by creation
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
    setBoardState(newBoardState);
  }, [tasks]);

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

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list or in the same place
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const taskId = draggableId;
    const newStatus = destination.droppableId as TaskStatus;
    const originalStatus = source.droppableId as TaskStatus;
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
        console.error('Dragged task not found!');
        return;
    }

    // --- Permission Check ---
    // We need task permissions hook here or passed down. For now, let's assume it's available.
    // Ideally, check if the user can update status *before* attempting the API call.
    // Example: const permissions = useTaskPermissions(task); if (!permissions.canUpdateStatus) return;
    // Skipping detailed permission check for now, assuming onTaskStatusChange handles it or backend enforces.
    console.log(`Attempting to move task ${taskId} from ${originalStatus} to ${newStatus}`);

    // Optimistically update UI first for better responsiveness
    const sourceTasks = Array.from(boardState[originalStatus]);
    const [movedTask] = sourceTasks.splice(source.index, 1);
    const destinationTasks = Array.from(boardState[newStatus] || []);
    destinationTasks.splice(destination.index, 0, { ...movedTask, status: newStatus });

    setBoardState(prevState => ({
      ...prevState,
      [originalStatus]: sourceTasks,
      [newStatus]: destinationTasks,
    }));

    // Call the API to persist the change
    try {
      const success = await onTaskStatusChange(taskId, newStatus);
      if (!success) {
        // Revert UI change if API call fails
        console.warn(`Failed to update status for task ${taskId}. Reverting UI.`);
        setBoardState(prevState => { // Re-calculate original state
            const revertedSourceTasks = Array.from(prevState[originalStatus]);
            revertedSourceTasks.splice(source.index, 0, movedTask); // Add back to source
            const revertedDestinationTasks = Array.from(prevState[newStatus] || []);
            revertedDestinationTasks.splice(destination.index, 1); // Remove from destination
            return {
                ...prevState,
                [originalStatus]: revertedSourceTasks,
                [newStatus]: revertedDestinationTasks,
            }
        });
      }
    } catch (error) {
      console.error('Error during task status update:', error);
      // Revert UI on error as well (logic is similar to !success case)
       setBoardState(prevState => { // Re-calculate original state
            const revertedSourceTasks = Array.from(prevState[originalStatus]);
            revertedSourceTasks.splice(source.index, 0, movedTask);
            const revertedDestinationTasks = Array.from(prevState[newStatus] || []);
            revertedDestinationTasks.splice(destination.index, 1);
            return {
                ...prevState,
                [originalStatus]: revertedSourceTasks,
                [newStatus]: revertedDestinationTasks,
            }
        });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={{ 
        width: '100%', 
        flexGrow: 1,
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
          mb: 2,
          flexShrink: 0
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
            flexWrap: 'nowrap',
            overflowX: 'auto',
            overflowY: 'hidden'
          }}
        >
          {columns.map((column) => (
            <Grid 
              item 
              xs={12} // Let the KanbanColumn control its own min/max width ideally
              sm={6} 
              md={3} // Aim for 4 columns on medium screens
              lg={3} 
              key={column.id}
              sx={{ 
                height: '100%', // Column wrapper takes full height of the container
                // overflowY: 'auto' // Let KanbanColumn handle its internal scroll
                display: 'flex', // Ensure it uses flex for the child
                flexDirection: 'column',
                minWidth: '280px' // Ensure columns have a minimum width
              }}
            >
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <Paper
                    ref={provided.innerRef as React.RefObject<HTMLDivElement>}
                    {...provided.droppableProps}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      width: { xs: '280px', sm: '300px' }, // Responsive column width
                      minWidth: { xs: '280px', sm: '300px' },
                      flexShrink: 0,
                      height: '100%', // Allow column to take full height
                      maxHeight: 'calc(100vh - 150px)', // Adjust max height as needed
                      overflowY: 'auto', // Scroll within column if needed
                      background: snapshot.isDraggingOver ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)',
                      backdropFilter: 'blur(5px)',
                      transition: 'background-color 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      '&::-webkit-scrollbar': { width: '6px' },
                      '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.1)' },
                      '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: '3px' },
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1.5, px: 1, fontWeight: 600 }}>
                      {column.title}
                    </Typography>
                    <Box sx={{ flexGrow: 1, minHeight: '50px' /* Ensure droppable area exists even when empty */ }}>
                      {(boardState[column.id] || []).map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onClick={onTaskClick}
                          currentUser={currentUser}
                        />
                      ))}
                      {provided.placeholder}
                    </Box>
                  </Paper>
                )}
              </Droppable>
            </Grid>
          ))}
        </Grid>
      </Box>
    </DragDropContext>
  );
};

export default TaskKanbanBoard;
