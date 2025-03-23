import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  useTheme,
  alpha,
  Avatar,
  Button
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DoneIcon from '@mui/icons-material/Done';
import CancelIcon from '@mui/icons-material/Cancel';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { format } from 'date-fns';
import { Task, TaskStatus } from '../../types/task';
import { User } from '../../types/user';
import { CollaboratorAvatars } from './CollaboratorAvatars';
import { TaskService } from '../../services/task';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';

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
  onChangeStatus?: (taskId: string, newStatus: TaskStatus) => void;
}> = ({ task, index, onEdit, onDelete, onChangeStatus }) => {
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

  // Function to render status change buttons based on current status
  const renderStatusButtons = () => {
    switch (task.status) {
      case TaskStatus.PENDING:
        return (
          <Tooltip title="Move to In Progress">
            <IconButton
              size="small"
              onClick={() => onChangeStatus && onChangeStatus(task.id, TaskStatus.IN_PROGRESS)}
              sx={{
                color: '#3498db',
                padding: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(52, 152, 219, 0.1)'
                }
              }}
            >
              <PlayArrowIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        );
      case TaskStatus.IN_PROGRESS:
        return (
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Move to Pending">
              <IconButton
                size="small"
                onClick={() => onChangeStatus && onChangeStatus(task.id, TaskStatus.PENDING)}
                sx={{
                  color: '#f39c12',
                  padding: '4px',
                  marginRight: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(243, 156, 18, 0.1)'
                  }
                }}
              >
                <ArrowBackIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Complete Task">
              <IconButton
                size="small"
                onClick={() => onChangeStatus && onChangeStatus(task.id, TaskStatus.COMPLETED)}
                sx={{
                  color: '#2ecc71',
                  padding: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(46, 204, 113, 0.1)'
                  }
                }}
              >
                <DoneIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      case TaskStatus.COMPLETED:
        return (
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Move to In Progress">
              <IconButton
                size="small"
                onClick={() => onChangeStatus && onChangeStatus(task.id, TaskStatus.IN_PROGRESS)}
                sx={{
                  color: '#3498db',
                  padding: '4px',
                  marginRight: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(52, 152, 219, 0.1)'
                  }
                }}
              >
                <ArrowBackIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel Task">
              <IconButton
                size="small"
                onClick={() => onChangeStatus && onChangeStatus(task.id, TaskStatus.CANCELLED)}
                sx={{
                  color: '#e74c3c',
                  padding: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(231, 76, 60, 0.1)'
                  }
                }}
              >
                <CancelIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      case TaskStatus.CANCELLED:
        return (
          <Tooltip title="Move to Pending">
            <IconButton
              size="small"
              onClick={() => onChangeStatus && onChangeStatus(task.id, TaskStatus.PENDING)}
              sx={{
                color: '#f39c12',
                padding: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(243, 156, 18, 0.1)'
                }
              }}
            >
              <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: '#fff',
        borderRadius: 2,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: '#2c3e50',
              fontWeight: 500,
              mb: 1
            }}
          >
            {task.title}
          </Typography>
          
          {task.description && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#7f8c8d',
                mb: 2,
                fontSize: '0.875rem',
                lineHeight: 1.5
              }}
            >
              {task.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={task.priority.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: 
                  task.priority === 'high' ? '#ff5252' :
                  task.priority === 'medium' ? '#ffa726' : '#81c784',
                color: '#fff',
                height: '20px',
                fontSize: '0.75rem'
              }}
            />
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              color: '#95a5a6',
              fontSize: '0.75rem'
            }}>
              <AccessTimeIcon sx={{ fontSize: '0.875rem' }} />
              {format(new Date(task.due_date), 'MMM d, h:mm a')}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {renderStatusButtons()}
          {onEdit && (
            <IconButton
              size="small"
              onClick={() => onEdit(task.id)}
              sx={{
                color: '#bdc3c7',
                padding: '4px',
                '&:hover': {
                  color: '#3498db',
                  backgroundColor: 'rgba(52, 152, 219, 0.1)'
                }
              }}
            >
              <EditIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              onClick={() => onDelete(task.id)}
              sx={{
                color: '#bdc3c7',
                padding: '4px',
                '&:hover': {
                  color: '#e74c3c',
                  backgroundColor: 'rgba(231, 76, 60, 0.1)'
                }
              }}
            >
              <DeleteIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {collaborators.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <CollaboratorAvatars collaborators={collaborators} />
        </Box>
      )}
    </Paper>
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
  const [activeTab, setActiveTab] = useState('my_tasks');

  const columns: { [key in TaskStatus]: { title: string; icon: React.ReactNode; color: string } } = {
    [TaskStatus.PENDING]: { 
      title: 'Upcoming', 
      icon: '📋', 
      color: 'rgba(237, 238, 245, 0.95)'
    },
    [TaskStatus.IN_PROGRESS]: { 
      title: 'In Progress', 
      icon: '🔄', 
      color: 'rgba(237, 238, 245, 0.95)'
    },
    [TaskStatus.COMPLETED]: { 
      title: 'Completed', 
      icon: '✅', 
      color: 'rgba(237, 238, 245, 0.95)'
    },
    [TaskStatus.CANCELLED]: { 
      title: 'Cancelled', 
      icon: '❌', 
      color: 'rgba(237, 238, 245, 0.95)'
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return localTasks.filter(task => task.status === status);
  };

  // Use this function to update task status instead of drag and drop
  const handleChangeTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Find the task
      const task = localTasks.find(t => t.id === taskId);
      if (!task) return;

      // Update task status in the backend
      const updatedTask = await TaskService.updateTask(taskId, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      // Update local state
      setLocalTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? { ...t, status: newStatus }
            : t
        )
      );

      if (onTaskUpdated) {
        onTaskUpdated({ ...task, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Update localTasks when tasks prop changes
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  return (
    <Box sx={{ 
      p: 3,
      minHeight: '100vh',
      backgroundColor: '#f8f9fe',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflowY: 'auto',
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'rgba(0,0,0,0.1)',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: 'rgba(0,0,0,0.3)',
      },
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        position: 'relative',
        zIndex: 1,
      }}>
        <Typography variant="h5" sx={{ 
          color: '#2d3436',
          fontWeight: 500,
          fontSize: '1.5rem'
        }}>
          Task Board
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            size="small"
            sx={{
              color: '#b2bec3',
              '&:hover': { color: '#636e72' }
            }}
          >
            <FilterListIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: '#3498db',
              color: '#fff',
              textTransform: 'none',
              px: 2,
              py: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: '#2980b9'
              }
            }}
          >
            Create Task
          </Button>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        mb: 4,
        borderBottom: '1px solid #e1e4e8',
      }}>
        <Button
          onClick={() => setActiveTab('my_tasks')}
          sx={{
            color: activeTab === 'my_tasks' ? '#3498db' : '#636e72',
            borderBottom: activeTab === 'my_tasks' ? '2px solid #3498db' : '2px solid transparent',
            borderRadius: 0,
            px: 1,
            py: 1.5,
            minWidth: 'auto',
            textTransform: 'none',
            fontWeight: activeTab === 'my_tasks' ? 600 : 400,
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#3498db'
            }
          }}
        >
          My Tasks
        </Button>
        <Button
          onClick={() => setActiveTab('assigned')}
          sx={{
            color: activeTab === 'assigned' ? '#3498db' : '#636e72',
            borderBottom: activeTab === 'assigned' ? '2px solid #3498db' : '2px solid transparent',
            borderRadius: 0,
            px: 1,
            py: 1.5,
            minWidth: 'auto',
            textTransform: 'none',
            fontWeight: activeTab === 'assigned' ? 600 : 400,
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#3498db'
            }
          }}
        >
          Assigned to Me
        </Button>
        <Button
          onClick={() => setActiveTab('created')}
          sx={{
            color: activeTab === 'created' ? '#3498db' : '#636e72',
            borderBottom: activeTab === 'created' ? '2px solid #3498db' : '2px solid transparent',
            borderRadius: 0,
            px: 1,
            py: 1.5,
            minWidth: 'auto',
            textTransform: 'none',
            fontWeight: activeTab === 'created' ? 600 : 400,
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#3498db'
            }
          }}
        >
          Created by Me
        </Button>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {Object.entries(columns).map(([status, { title, icon, color }]) => (
            <Grid item xs={12} sm={6} md={3} key={status}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  backgroundColor: color,
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {icon} {title}
                  </Typography>
                  <Chip
                    label={getTasksByStatus(status as TaskStatus).length}
                    size="small"
                    sx={{ fontWeight: 'medium', backgroundColor: alpha('#000', 0.1) }}
                  />
                </Box>

                <Box sx={{ overflow: 'auto', maxHeight: '500px' }}>
                  {getTasksByStatus(status as TaskStatus).map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onChangeStatus={handleChangeTaskStatus}
                    />
                  ))}
                  {getTasksByStatus(status as TaskStatus).length === 0 && (
                    <Typography variant="body2" sx={{ color: alpha('#000', 0.5), textAlign: 'center', mt: 2 }}>
                      No tasks in this column
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default TaskBoard; 