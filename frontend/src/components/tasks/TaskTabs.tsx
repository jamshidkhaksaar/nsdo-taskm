import React, { useEffect, useState } from 'react';
import { Task } from '../../types/task';
import { User } from '../../types/user';
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { TaskService } from '../../services/task';
import { TaskPriority } from '../../types/task';
import { CollaboratorAvatars } from './CollaboratorAvatars';
import { AxiosError } from 'axios';

interface TaskTabsProps {
  tasks: Task[];
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onTaskUpdated?: (task: Task) => void;
}

interface TaskItemProps {
  task: Task;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onTaskUpdated?: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onEditTask, 
  onDeleteTask,
  onTaskUpdated
}) => {
  const [assignedUsers, setAssignedUsers] = React.useState<User[]>([]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [statusAnchorEl, setStatusAnchorEl] = React.useState<null | HTMLElement>(null);
  const [currentTask, setCurrentTask] = React.useState<Task>({
    ...task,
    priority: task.priority?.toLowerCase() as TaskPriority || 'medium',
    status: task.status?.toLowerCase() as Task['status'] || 'todo'
  });

  React.useEffect(() => {
    if (task) {
      setCurrentTask({
        ...task,
        priority: task.priority?.toLowerCase() as TaskPriority || 'medium',
        status: task.status?.toLowerCase() as Task['status'] || 'todo'
      });
      console.log('Task prop updated:', task);
    }
  }, [task]);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (currentTask.assigned_to && currentTask.assigned_to.length > 0) {
          const response = await TaskService.getUsers();
          const filteredUsers = response.filter((user: User) => 
            currentTask.assigned_to?.includes(user.id.toString())
          );
          console.log('Filtered assigned users:', filteredUsers);
          setAssignedUsers(filteredUsers);
        }
      } catch (err: unknown) {
        const axiosError = err as AxiosError;
        console.error('Error fetching users:', err);
        console.error('Error details:', {
          message: axiosError?.message || 'Unknown error',
          response: (axiosError as any)?.response?.data
        });
      }
    };

    fetchUsers();
  }, [currentTask.assigned_to]);

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    try {
      setAnchorEl(null);
      
      console.log('Updating priority to:', newPriority);
      
      const updatedTask = await TaskService.updateTask(currentTask.id, {
        priority: newPriority,
        updated_at: new Date().toISOString()
      });
      
      console.log('Task updated successfully:', updatedTask);
      
      if (!updatedTask || !updatedTask.priority) {
        throw new Error('Invalid task data received');
      }

      const newTask = {
        ...currentTask,
        ...updatedTask,
        priority: updatedTask.priority.toLowerCase() as TaskPriority,
        status: updatedTask.status as Task['status']
      };

      console.log('Setting current task to:', newTask);
      setCurrentTask(newTask);
      
      if (onTaskUpdated) {
        await onTaskUpdated(newTask);
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError;
      console.error('Error updating priority:', err);
      console.error('Error details:', {
        message: axiosError?.message || 'Unknown error',
        response: (axiosError as any)?.response?.data
      });
      alert(`Failed to update task priority: ${axiosError?.message || 'Unknown error'}`);
    }
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    try {
      console.log('Updating status to:', newStatus);
      setStatusAnchorEl(null); // Close menu immediately for better UX
      
      const updatedTask = await TaskService.updateTask(currentTask.id, { 
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      
      console.log('Task updated successfully:', updatedTask);
      
      if (!updatedTask || !updatedTask.status) {
        throw new Error('Invalid task data received');
      }

      const newTask = {
        ...currentTask,
        ...updatedTask,
        priority: updatedTask.priority as TaskPriority,
        status: updatedTask.status as Task['status']
      };

      setCurrentTask(newTask);
      
      if (onTaskUpdated) {
        await onTaskUpdated(newTask);
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError;
      console.error('Error updating status:', err);
      console.error('Error details:', {
        message: axiosError?.message || 'Unknown error',
        response: (axiosError as any)?.response?.data
      });
      
      if (axiosError.message === 'Session expired. Please login again.') {
        // Handle session expiration
        alert('Your session has expired. Please login again.');
        window.location.href = '/login';
        return;
      }
      
      alert(`Failed to update task status: ${axiosError?.message || 'Unknown error'}`);
    }
  };

  React.useEffect(() => {
    console.log('Task updated:', currentTask); // For debugging
  }, [currentTask]);

  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.08)',
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 
                  currentTask?.status === 'done' ? 'success.main' : 
                  currentTask?.status === 'in_progress' ? 'warning.main' : 'info.main',
                flexShrink: 0
              }}
            />
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 500 }}>
              {currentTask?.title || 'Untitled Task'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={
                  currentTask?.priority 
                    ? currentTask.priority.charAt(0).toUpperCase() + currentTask.priority.slice(1)
                    : 'Medium'
                }
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  backgroundColor: 
                    !currentTask?.priority || currentTask.priority === 'medium' ? 'warning.main' :
                    currentTask.priority === 'high' ? 'error.main' : 'success.main',
                  color: '#fff',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.9,
                    transform: 'scale(1.05)',
                  },
                }}
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: {
                    background: 'rgba(30, 30, 30, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#fff',
                    '& .MuiMenuItem-root': {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: '#fff',
                      padding: '8px 16px',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                  }
                }}
              >
                {['low', 'medium', 'high'].map((p) => (
                  <MenuItem 
                    key={p} 
                    onClick={() => handlePriorityChange(p as TaskPriority)}
                    sx={{ 
                      minWidth: 120,
                      borderRadius: '4px',
                      margin: '2px 4px',
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: p === 'high' ? 'error.main' :
                                p === 'medium' ? 'warning.main' : 'success.main',
                      }}
                    />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </MenuItem>
                ))}
              </Menu>
              <Chip
                label={
                  currentTask?.status 
                    ? currentTask.status.replace('_', ' ').toUpperCase()
                    : 'TODO'
                }
                size="small"
                onClick={(e) => setStatusAnchorEl(e.currentTarget)}
                sx={{
                  backgroundColor: 
                    !currentTask?.status || currentTask.status === 'todo' ? 'info.main' :
                    currentTask.status === 'done' ? 'success.main' : 'warning.main',
                  color: '#fff',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.9,
                    transform: 'scale(1.05)',
                  },
                }}
              />
              <Menu
                anchorEl={statusAnchorEl}
                open={Boolean(statusAnchorEl)}
                onClose={() => setStatusAnchorEl(null)}
                PaperProps={{
                  sx: {
                    background: 'rgba(30, 30, 30, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#fff',
                    '& .MuiMenuItem-root': {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: '#fff',
                      padding: '8px 16px',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                  }
                }}
              >
                {['todo', 'in_progress', 'done'].map((status) => (
                  <MenuItem 
                    key={status} 
                    onClick={() => handleStatusChange(status as Task['status'])}
                    sx={{ 
                      minWidth: 120,
                      borderRadius: '4px',
                      margin: '2px 4px',
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 
                          status === 'done' ? 'success.main' :
                          status === 'in_progress' ? 'warning.main' : 'info.main',
                      }}
                    />
                    {status.replace('_', ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>
          
          {currentTask?.description && (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 1
              }}
            >
              {currentTask.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {currentTask?.due_date ? 
                  format(new Date(currentTask.due_date), 'MMM d, h:mm a') : 
                  'No due date'
                }
              </Typography>
            </Box>
            
            {assignedUsers.length > 0 && (
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                <CollaboratorAvatars collaborators={assignedUsers} />
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onEditTask && (
            <Tooltip title="Edit Task" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => onEditTask(currentTask.id)}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: '#fff',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDeleteTask && (
            <Tooltip title="Delete Task" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => onDeleteTask(currentTask.id)}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: '#ff3c7d',
                    background: 'rgba(255, 60, 125, 0.1)'
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const TaskTabs: React.FC<TaskTabsProps> = ({ 
  tasks, 
  onEditTask, 
  onDeleteTask,
  onTaskUpdated
}) => {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [value, setValue] = useState(0);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleTaskUpdate = async (updatedTask: Task) => {
    setLocalTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    
    if (onTaskUpdated) {
      await onTaskUpdated(updatedTask);
    }
  };

  const filteredTasks = localTasks.filter(task => {
    if (value === 0) return true;
    if (value === 1) return task.status === 'todo';
    if (value === 2) return task.status === 'in_progress';
    if (value === 3) return task.status === 'done';
    return true;
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={(_, newValue) => setValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#fff'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#fff'
            }
          }}
        >
          <Tab label="All Tasks" />
          <Tab label="To Do" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
      </Box>
      <Box sx={{ p: 2 }}>
        {filteredTasks.map((task) => (
          <TaskItem 
            key={task.id} 
            task={task}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onTaskUpdated={handleTaskUpdate}
          />
        ))}
      </Box>
    </Box>
  );
};

export default TaskTabs;
