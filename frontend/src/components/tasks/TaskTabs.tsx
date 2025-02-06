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
import CreateTaskDialog from './CreateTaskDialog';

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
    status: task.status?.toLowerCase() as Task['status'] || 'todo',
    isUpdating: false
  });

  React.useEffect(() => {
    if (task) {
      const newPriority = task.priority?.toLowerCase() as TaskPriority || 'medium';
      const newStatus = task.status?.toLowerCase() as Task['status'] || 'todo';
      
      // Only update if we're not in the middle of a priority change
      if (!currentTask.isUpdating) {
        setCurrentTask(prevTask => ({
          ...task,
          priority: newPriority,
          status: newStatus,
          isUpdating: false
        }));
      }
      console.log('Task prop updated:', task);
    }
  }, [task, currentTask.isUpdating]);

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
      
      // Set updating flag and update local state immediately
      setCurrentTask(prevTask => ({
        ...prevTask,
        priority: newPriority,
        isUpdating: true
      }));

      // Send only the priority update to the server
      const updatedTask = await TaskService.updateTask(currentTask.id, {
        priority: newPriority,
        updated_at: new Date().toISOString()
      });

      console.log('Task updated successfully:', updatedTask);

      if (!updatedTask || !updatedTask.priority) {
        throw new Error('Invalid task data received');
      }

      // Verify the priority value from the server
      console.log('Server returned priority:', updatedTask.priority);

      // Update local state with the server response but ensure priority is maintained
      setCurrentTask(prevTask => ({
        ...prevTask,
        ...updatedTask,
        priority: newPriority, // Force the new priority
        isUpdating: false
      }));

      // Notify parent component of the update with forced priority
      if (onTaskUpdated) {
        const taskToUpdate = {
          ...updatedTask,
          priority: newPriority // Ensure priority is maintained
        };
        await onTaskUpdated(taskToUpdate);
      }

      // Double-check the update with a fresh fetch
      const refreshedTask = await TaskService.getTask(currentTask.id);
      console.log('Refreshed task from server:', refreshedTask);

      if (refreshedTask.priority !== newPriority) {
        console.warn('Priority mismatch after refresh:', {
          expected: newPriority,
          received: refreshedTask.priority
        });
        
        // Force another update if needed
        if (refreshedTask.priority !== newPriority) {
          await TaskService.updateTask(currentTask.id, {
            priority: newPriority,
            updated_at: new Date().toISOString()
          });
        }
      }

    } catch (err: unknown) {
      // Revert the local state on error
      setCurrentTask(prevTask => ({
        ...prevTask,
        priority: prevTask.priority,
        isUpdating: false
      }));

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
      setStatusAnchorEl(null);

      // Set updating flag and update local state immediately
      setCurrentTask(prevTask => ({
        ...prevTask,
        status: newStatus,
        isUpdating: true
      }));

      const updatedTask = await TaskService.updateTask(currentTask.id, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      if (!updatedTask || !updatedTask.status) {
        throw new Error('Invalid task data received');
      }

      // Update with response but maintain our status
      setCurrentTask(prevTask => ({
        ...prevTask,
        ...updatedTask,
        status: newStatus,
        isUpdating: false
      }));

      if (onTaskUpdated) {
        const taskToUpdate = {
          ...updatedTask,
          status: newStatus
        };
        await onTaskUpdated(taskToUpdate);
      }
    } catch (err: unknown) {
      // Revert the local state on error
      setCurrentTask(prevTask => ({
        ...prevTask,
        status: prevTask.status,
        isUpdating: false
      }));

      const axiosError = err as AxiosError;
      console.error('Error updating status:', err);
      console.error('Error details:', {
        message: axiosError?.message || 'Unknown error',
        response: (axiosError as any)?.response?.data
      });
      alert(`Failed to update task status: ${axiosError?.message || 'Unknown error'}`);
    }
  };

  React.useEffect(() => {
    console.log('Task updated:', currentTask); // For debugging
  }, [currentTask]);

  const handleEditClick = (taskId: string) => {
    if (onEditTask) {
      onEditTask(taskId);
    }
  };

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
                  currentTask?.status === 'DONE' ? 'success.main' :
                  currentTask?.status === 'IN_PROGRESS' ? 'warning.main' : 'info.main',
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
                    !currentTask?.status || currentTask.status === 'TODO' ? 'info.main' :
                    currentTask.status === 'DONE' ? 'success.main' : 'warning.main',
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
                onClick={() => handleEditClick(currentTask.id)}
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    // Only update tasks that haven't been modified locally
    setLocalTasks(prevTasks => {
      return tasks.map(newTask => {
        const existingTask = prevTasks.find(t => t.id === newTask.id);
        if (existingTask) {
          // Preserve local changes if they exist
          return {
            ...newTask,
            priority: existingTask.priority || newTask.priority,
            status: existingTask.status || newTask.status
          };
        }
        return newTask;
      });
    });
  }, [tasks]);

  const handleTaskUpdate = async (updatedTask: Task) => {
    setLocalTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? {
          ...updatedTask,
          priority: updatedTask.priority?.toLowerCase() as TaskPriority || task.priority,
          status: updatedTask.status?.toLowerCase() as Task['status'] || task.status
        } : task
      )
    );
    
    if (onTaskUpdated) {
      await onTaskUpdated(updatedTask);
    }
  };

  const handleEditClick = (taskId: string) => {
    const taskToEdit = localTasks.find(task => task.id === taskId);
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setIsEditDialogOpen(true);
    }
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingTask(null);
  };

  const handleTaskEdited = async () => {
    // Refresh the tasks list
    if (onTaskUpdated) {
      await onTaskUpdated({} as Task); // Trigger a refresh
    }
    handleEditDialogClose();
  };

  const filteredTasks = localTasks.filter(task => {
    if (value === 0) return true;
    if (value === 1) return task.status === 'TODO';
    if (value === 2) return task.status === 'IN_PROGRESS';
    if (value === 3) return task.status === 'DONE';
    if (value === 4) return task.status === 'CANCELLED';
    return true;
  });

  return (
    <>
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
            <Tab label="Cancelled" />
          </Tabs>
        </Box>
        <Box sx={{ p: 2, maxHeight: '360px', overflowY: 'auto' }}>
          {filteredTasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task}
              onEditTask={handleEditClick}
              onDeleteTask={onDeleteTask}
              onTaskUpdated={handleTaskUpdate}
            />
          ))}
        </Box>
      </Box>

      {/* Add the edit dialog */}
      <CreateTaskDialog
        open={isEditDialogOpen}
        onClose={handleEditDialogClose}
        onTaskCreated={handleTaskEdited}
        task={editingTask || undefined}
        dialogType="personal"
      />
    </>
  );
};

export default TaskTabs;
