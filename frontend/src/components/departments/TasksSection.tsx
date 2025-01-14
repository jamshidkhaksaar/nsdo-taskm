import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import DateRangeIcon from '@mui/icons-material/DateRange';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';

import { Task } from '../../types/task';

interface TasksSectionProps {
  tasks?: Task[];
  currentUserId: number;
  currentDepartmentId: number;
  viewMode: 'department' | 'user' | 'assigned';
  onAddTask?: () => void;
  onTaskClick?: (task: Task) => void;
  showAddButton?: boolean;
  // Allow alternative task grouping
  upcomingTasks?: Task[];
  ongoingTasks?: Task[];
  completedTasks?: Task[];
}

const TasksSection: React.FC<TasksSectionProps> = ({
  tasks,
  currentUserId,
  currentDepartmentId,
  viewMode,
  onAddTask,
  onTaskClick,
  upcomingTasks: propsUpcomingTasks,
  ongoingTasks: propsOngoingTasks,
  completedTasks: propsCompletedTasks
}) => {
  // Use provided grouped tasks or filter from main tasks array
  const upcomingTasks = propsUpcomingTasks || 
    (tasks ? tasks.filter(task => 
      task.status === 'todo' && 
      new Date(task.due_date) > new Date()
    ) : []);
  
  const ongoingTasks = propsOngoingTasks || 
    (tasks ? tasks.filter(task => 
      task.status === 'in_progress' || 
      (task.status === 'todo' && new Date(task.due_date) <= new Date())
    ) : []);
  
  const completedTasks = propsCompletedTasks || 
    (tasks ? tasks.filter(task => task.status === 'done') : []);

  const TaskBox = ({ 
    title, 
    tasks, 
    icon, 
    color,
    onTaskClick,
    showAddButton
  }: { 
    title: string; 
    tasks: Task[]; 
    icon: React.ReactNode; 
    color: string;
    onTaskClick?: (task: Task) => void;
    showAddButton?: boolean;
  }) => (
    <Card
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        height: '100%',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={tasks.length} color="primary">
              {icon}
            </Badge>
            <Typography variant="h6" sx={{ color: '#fff' }}>
              {title}
            </Typography>
          </Box>
          {title === 'Upcoming Tasks' && (
            <Tooltip title="Add New Task">
              <IconButton
                onClick={onAddTask}
                sx={{
                  color: '#fff',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {tasks.length === 0 ? (
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 4 }}>
            No {title.toLowerCase()}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tasks.map((task) => (
              <Box
                key={task.id}
                sx={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 1,
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
                onClick={() => onTaskClick?.(task)}
              >
                <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                  {task.title}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Assigned to: {typeof task.assigned_to === 'object' ? task.assigned_to?.username : 'Unassigned'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#fff',
                      backgroundColor: 
                        task.priority === 'high' ? 'error.main' :
                        task.priority === 'medium' ? 'warning.main' : 'success.main',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.7rem',
                    }}
                  >
                    {task.priority}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mt: 1 }}>
                  Due: {task.due_date}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <TaskBox
          title="Upcoming Tasks"
          tasks={upcomingTasks}
          icon={<DateRangeIcon sx={{ color: '#fff' }} />}
          color="#2196F3"
          onTaskClick={onTaskClick}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TaskBox
          title="Ongoing Tasks"
          tasks={ongoingTasks}
          icon={<WorkIcon sx={{ color: '#fff' }} />}
          color="#FF9800"
          onTaskClick={onTaskClick}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TaskBox
          title="Completed Tasks"
          tasks={completedTasks}
          icon={<CheckCircleIcon sx={{ color: '#fff' }} />}
          color="#4CAF50"
          onTaskClick={onTaskClick}
        />
      </Grid>
    </Grid>
  );
};

export default TasksSection;
