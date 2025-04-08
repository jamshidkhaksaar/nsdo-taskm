import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  IconButton,
  Grid,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Task, TaskStatus, TaskPriority } from '../../types/task';
import { UserService } from '../../services/user';
import { formatDate, DATE_FORMATS, parseDate } from '../../utils/dateUtils';
import { KanbanColumn } from '../kanban';

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

const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const user = await UserService.getUserById(userId);
    return user?.name || user?.username || 'Unknown User';
  } catch (error) {
    console.error('Error getting user display name:', error);
    return 'Unknown User';
  }
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
        {Object.entries(groupedTasks).map(([status, statusTasks]) => (
          <Grid 
            item 
            xs={12} // Let the KanbanColumn control its own min/max width ideally
            sm={6} 
            md={3} // Aim for 4 columns on medium screens
            lg={3} 
            key={status}
            sx={{ 
              height: '100%', // Column wrapper takes full height of the container
              // overflowY: 'auto' // Let KanbanColumn handle its internal scroll
              display: 'flex', // Ensure it uses flex for the child
              flexDirection: 'column',
              minWidth: '280px' // Ensure columns have a minimum width
            }}
          >
            <KanbanColumn
              title={statusMap[status]}
              tasks={statusTasks}
              status={status}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onChangeTaskStatus={onChangeTaskStatus}
              getUserName={getUserDisplayName}
              formatDate={formatCompactDate}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TaskKanbanBoard;
