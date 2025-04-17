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
import SendIcon from '@mui/icons-material/Send';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
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
const columns: { id: TaskStatus; title: string; icon: React.ComponentType<any> }[] = [
  { id: TaskStatus.PENDING, title: 'Pending', icon: HelpOutlineIcon },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress', icon: SyncIcon },
  { id: TaskStatus.COMPLETED, title: 'Completed', icon: CheckCircleOutlineIcon },
  { id: TaskStatus.CANCELLED, title: 'Cancelled', icon: CancelIcon },
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
        height: '100%', // Ensure board takes full height of its container
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#1A1F29', // Darker, less transparent background
        borderRadius: '12px',
        border: '1px solid',
        borderColor: theme.palette.divider, // Use theme divider color
        boxShadow: theme.shadows[2], // Use theme shadow
        p: 1.5,
        overflow: 'hidden', // Hide main container overflow, scrolling handled below
        position: 'relative',
      }}>
        {/* Board Header (Optional Title/Actions) */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5, // Adjusted margin
          px: 1, // Add horizontal padding for header content
          flexShrink: 0, // Prevent header from shrinking
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
            Task Board
          </Typography>
          {/* Potential Add Task Button for board-level? */}
          {/* <Button variant="contained" startIcon={<AddIcon />} onClick={() => onCreateTask?.(TaskStatus.PENDING)}>
            Add Task
          </Button> */}
        </Box>

        {/* Error Display */}
        {(error || internalError) && (
            <Alert severity="error" sx={{ mb: 2, mx: 1, flexShrink: 0 }}>
                {error || internalError}
            </Alert>
        )}

        {/* Kanban Columns Container - THIS is the scrollable area */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'row', // Columns side-by-side
          gap: 2, // Space between columns
          flexGrow: 1, // Allow this area to take remaining space
          overflowX: 'auto', // Enable horizontal scrolling ONLY when needed
          overflowY: 'hidden', // Prevent vertical scrolling here (columns handle their own)
          pb: 1, // Padding at the bottom for scrollbar clearance
          // Custom Scrollbar Styles
          '&::-webkit-scrollbar': {
            height: '8px', // Slimmer scrollbar
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', // Subtle track
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)', // Subtle thumb
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)', // Darken on hover
            },
          },
        }}>
          {columns.map((column) => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    minWidth: { xs: '280px', sm: '300px', md: '320px' }, // Responsive column width
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0, // Prevent columns from shrinking below minWidth
                    // Removed redundant bgcolor/border here, handled by KanbanColumn
                  }}
                >
                  <KanbanColumn
                    title={column.title}
                    icon={column.icon} // Pass icon to column
                    tasks={boardState[column.id] || []}
                    columnId={column.id}
                    isDraggingOver={snapshot.isDraggingOver}
                    onTaskClick={onTaskClick}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    currentUser={currentUser}
                    onCreateTask={onCreateTask} // Pass onCreateTask down
                  >
                    {/* Draggable Task Cards are rendered inside KanbanColumn */}
                  </KanbanColumn>
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          ))}
        </Box>
      </Box>
    </DragDropContext>
  );
};

export default TaskKanbanBoard;
