import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { Task, TaskStatus } from '../../types/task';
import { User } from '../../types/user';
import { CollaboratorAvatars } from './CollaboratorAvatars';
import { TaskService } from '../../services/task';

interface TaskBoardProps {
  tasks: Task[];
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onTaskUpdated?: (task: Task) => void;
}

const TaskCard: React.FC<{
  task: Task;
  index: number;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}> = ({ task, index, onEdit, onDelete }) => {
  const theme = useTheme();
  const [collaborators, setCollaborators] = useState<User[]>([]);

  useEffect(() => {
    const fetchCollaborators = async () => {
      if (task.assigned_to && task.assigned_to.length > 0) {
        try {
          const users = await TaskService.getUsers();
          const taskCollaborators = users.filter(user => 
            task.assigned_to?.includes(user.id.toString())
          );
          setCollaborators(taskCollaborators);
        } catch (error) {
          console.error('Error fetching collaborators:', error);
        }
      }
    };

    fetchCollaborators();
  }, [task.assigned_to]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          elevation={2}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            '&:hover': {
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {task.title}
            </Typography>
            <Box>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit?.(task.id)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => onDelete?.(task.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {task.description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              label={task.priority}
              size="small"
              sx={{
                backgroundColor: getPriorityColor(task.priority),
                color: 'white'
              }}
            />
            <Tooltip title={format(new Date(task.due_date), 'PPP')}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(task.due_date), 'MMM d')}
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          {collaborators.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <CollaboratorAvatars collaborators={collaborators} />
            </Box>
          )}
        </Paper>
      )}
    </Draggable>
  );
};

const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onTaskUpdated
}) => {
  const theme = useTheme();
  const [localTasks, setLocalTasks] = useState(tasks);

  const columns: { [key in TaskStatus]: string } = {
    'pending': 'Upcoming',
    'in_progress': 'In Progress',
    'completed': 'Done',
    'cancelled': 'Cancelled'
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return localTasks.filter(task => task.status === status);
  };

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = localTasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as TaskStatus;

    try {
      // Update task status in the backend
      const updatedTask = await TaskService.updateTask(task.id, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      // Update local state
      setLocalTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === draggableId
            ? { ...t, status: newStatus }
            : t
        )
      );

      // Notify parent component
      if (onTaskUpdated) {
        onTaskUpdated(updatedTask);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Revert the drag if the update fails
      setLocalTasks([...tasks]);
    }
  };

  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  return (
    <DragDropContext onDragEnd={onDragEnd} onBeforeDragStart={() => {}}>
      <Grid container spacing={2}>
        {Object.entries(columns).map(([status, title]) => (
          <Grid item xs={12} sm={6} md={3} key={status}>
            <Paper
              sx={{
                p: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                height: '100%',
                minHeight: '70vh',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" gutterBottom>
                {title} ({getTasksByStatus(status as TaskStatus).length})
              </Typography>
              <Droppable droppableId={status} type="task">
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{ 
                      minHeight: '100px',
                      height: '100%',
                      transition: 'background-color 0.2s ease',
                      '&:empty': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.4)
                      }
                    }}
                  >
                    {getTasksByStatus(status as TaskStatus).map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                      />
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </DragDropContext>
  );
};

export default TaskBoard; 