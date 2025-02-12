import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format } from 'date-fns';
import { Task, TaskPriority } from '../../types/task';
import { TaskService } from '../../services/task';

interface AssignedByMeSectionProps {
  tasks: Task[];
  onTaskUpdated: (task: Task) => void;
}

const AssignedByMeSection: React.FC<AssignedByMeSectionProps> = ({
  tasks,
  onTaskUpdated,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [statusAnchorEl, setStatusAnchorEl] = React.useState<null | HTMLElement>(null);

  const handlePriorityClick = (event: React.MouseEvent<HTMLDivElement>, task: Task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleStatusClick = (event: React.MouseEvent<HTMLDivElement>, task: Task) => {
    setStatusAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handlePriorityChange = async (priority: TaskPriority) => {
    if (selectedTask) {
      try {
        const updatedTask = await TaskService.updateTask(selectedTask.id, {
          ...selectedTask,
          priority,
          updated_at: new Date().toISOString(),
        });
        onTaskUpdated(updatedTask);
      } catch (error) {
        console.error('Error updating task priority:', error);
      }
    }
    setAnchorEl(null);
  };

  const handleStatusChange = async (status: Task['status']) => {
    if (selectedTask) {
      try {
        const updatedTask = await TaskService.updateTask(selectedTask.id, {
          ...selectedTask,
          status,
          updated_at: new Date().toISOString(),
        });
        onTaskUpdated(updatedTask);
      } catch (error) {
        console.error('Error updating task status:', error);
      }
    }
    setStatusAnchorEl(null);
  };

  return (
    <Card
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
          Tasks Assigned by Me
        </Typography>

        {tasks.length === 0 ? (
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 4 }}>
            No tasks assigned by you
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {tasks.map((task) => (
              <Grid item xs={12} key={task.id}>
                <Box
                  sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 1,
                    p: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor:
                          task.status === 'completed' ? 'success.main' :
                          task.status === 'in_progress' ? 'warning.main' : 'info.main',
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ color: '#fff', flex: 1 }}>
                      {task.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={task.priority?.toUpperCase()}
                        size="small"
                        onClick={(e) => handlePriorityClick(e, task)}
                        sx={{
                          backgroundColor:
                            task.priority === 'high' ? 'error.main' :
                            task.priority === 'medium' ? 'warning.main' : 'success.main',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      />
                      <Chip
                        label={task.status?.replace('_', ' ').toUpperCase()}
                        size="small"
                        onClick={(e) => handleStatusClick(e, task)}
                        sx={{
                          backgroundColor:
                            task.status === 'completed' ? 'success.main' :
                            task.status === 'in_progress' ? 'warning.main' : 'info.main',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      />
                    </Box>
                  </Box>

                  {task.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        mb: 1,
                      }}
                    >
                      {task.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Due: {format(new Date(task.due_date), 'MMM d, h:mm a')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
            },
          }}
        >
          {['low', 'medium', 'high'].map((priority) => (
            <MenuItem
              key={priority}
              onClick={() => handlePriorityChange(priority as TaskPriority)}
              sx={{
                color: '#fff',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor:
                    priority === 'high' ? 'error.main' :
                    priority === 'medium' ? 'warning.main' : 'success.main',
                  mr: 1,
                }}
              />
              {priority.toUpperCase()}
            </MenuItem>
          ))}
        </Menu>

        <Menu
          anchorEl={statusAnchorEl}
          open={Boolean(statusAnchorEl)}
          onClose={() => setStatusAnchorEl(null)}
          PaperProps={{
            sx: {
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
            },
          }}
        >
          {['TODO', 'IN_PROGRESS', 'DONE'].map((status) => (
            <MenuItem
              key={status}
              onClick={() => handleStatusChange(status as Task['status'])}
              sx={{
                color: '#fff',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor:
                    status === 'DONE' ? 'success.main' :
                    status === 'IN_PROGRESS' ? 'warning.main' : 'info.main',
                  mr: 1,
                }}
              />
              {status.replace('_', ' ').toUpperCase()}
            </MenuItem>
          ))}
        </Menu>
      </CardContent>
    </Card>
  );
};

export default AssignedByMeSection; 