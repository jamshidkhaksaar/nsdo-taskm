import React from 'react';
import { Task } from '../../types/task';
import { User } from '../../types/user';
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Chip,
  Avatar,
  AvatarGroup,
  Tooltip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { TaskService } from '../../services/task';
import { TaskPriority } from '../../types/task';
import { CollaboratorAvatars } from './CollaboratorAvatars';

interface TaskTabsProps {
  tasks: Task[];
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onTaskUpdated?: () => void;
}

interface TaskItemProps {
  task: Task;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onTaskUpdated?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onEditTask, 
  onDeleteTask,
  onTaskUpdated
}) => {
  const [assignedUsers, setAssignedUsers] = React.useState<User[]>([]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (task.assigned_to && task.assigned_to.length > 0) {
          const response = await TaskService.getUsers();
          console.log('All users:', response);
          console.log('Task assigned_to:', task.assigned_to);
          
          const users = response.filter((user: User) => 
            task.assigned_to?.includes(user.id.toString())
          );
          console.log('Filtered users:', users);
          setAssignedUsers(users);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, [task.assigned_to]);

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    try {
      await TaskService.updateTask(task.id, { priority: newPriority });
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (err) {
      console.error('Error updating priority:', err);
    }
    setAnchorEl(null);
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
                bgcolor: task.status === 'done' ? 'success.main' : 
                        task.status === 'in_progress' ? 'warning.main' : 'info.main',
                flexShrink: 0
              }}
            />
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 500 }}>
              {task.title}
            </Typography>
            <Chip
              label={task.priority}
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                height: '20px',
                bgcolor: task.priority === 'high' ? 'error.main' :
                        task.priority === 'medium' ? 'warning.main' : 'success.main',
                color: '#fff',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
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
          </Box>
          
          {task.description && (
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
              {task.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {format(new Date(task.due_date), 'MMM d, h:mm a')}
              </Typography>
            </Box>
            
            {assignedUsers.length > 0 && (
              <Box sx={{ ml: 'auto' }}>
                <CollaboratorAvatars collaborators={assignedUsers} />
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onEditTask && (
            <IconButton
              size="small"
              onClick={() => onEditTask(task.id)}
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
          )}
          {onDeleteTask && (
            <IconButton
              size="small"
              onClick={() => onDeleteTask(task.id)}
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
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange}
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
        {value === 0 && tasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onTaskUpdated={onTaskUpdated}
          />
        ))}
        {value === 1 && tasks
          .filter(t => t.status === 'todo')
          .map(task => (
            <TaskItem 
              key={task.id} 
              task={task}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onTaskUpdated={onTaskUpdated}
            />
          ))}
        {value === 2 && tasks
          .filter(t => t.status === 'in_progress')
          .map(task => (
            <TaskItem 
              key={task.id} 
              task={task}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onTaskUpdated={onTaskUpdated}
            />
          ))}
        {value === 3 && tasks
          .filter(t => t.status === 'done')
          .map(task => (
            <TaskItem 
              key={task.id} 
              task={task}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onTaskUpdated={onTaskUpdated}
            />
          ))}
      </Box>
    </Box>
  );
};

export default TaskTabs;
