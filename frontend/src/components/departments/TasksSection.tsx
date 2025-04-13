import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Badge,
  Chip,
} from '@mui/material';
import DateRangeIcon from '@mui/icons-material/DateRange';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import { Task } from '../../types/task';
import { UserService } from '../../services/user';

interface TasksSectionProps {
  tasks?: Task[];
  currentUserId: number;
  currentDepartmentId: number;
  viewMode: 'department' | 'user' | 'assigned';
  onAddTask?: () => void;
  onTaskClick?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => Promise<void>;
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
  onTaskUpdated,
  showAddButton,
  upcomingTasks: propsUpcomingTasks,
  ongoingTasks: propsOngoingTasks,
  completedTasks: propsCompletedTasks
}) => {
  const [userCache, setUserCache] = useState<Record<string, string>>({});
  
  // Use provided grouped tasks or filter from main tasks array
  const upcomingTasks = propsUpcomingTasks || 
    (tasks ? tasks.filter(task => 
      task.status === 'pending' && 
      new Date(task.dueDate || '') > new Date()
    ) : []);
  
  const ongoingTasks = propsOngoingTasks || 
    (tasks ? tasks.filter(task => 
      task.status === 'in_progress' || 
      (task.status === 'pending' && new Date(task.dueDate || '') <= new Date())
    ) : []);
  
  const completedTasks = propsCompletedTasks || 
    (tasks ? tasks.filter(task => task.status === 'completed') : []);
  
  // Load user data for assigned tasks
  useEffect(() => {
    const loadUserData = async () => {
      const allTasks = [...upcomingTasks, ...ongoingTasks, ...completedTasks];
      const userIds = new Set<string>();
      
      // Collect all unique user IDs
      allTasks.forEach(task => {
        if (task.created_by) userIds.add(String(task.created_by));
        if (task.assigned_to) {
          task.assigned_to.forEach(userId => userIds.add(String(userId)));
        }
      });
      
      // Fetch user data for all IDs
      const newCache: Record<string, string> = { ...userCache };
      // Use Array.from to convert Set to Array for iteration
      for (const userId of Array.from(userIds)) {
        if (!userCache[userId]) {
          try {
            const user = await UserService.getUserById(userId);
            newCache[userId] = user?.first_name && user?.last_name 
              ? `${user.first_name} ${user.last_name}`
              : user?.username || userId;
          } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
            newCache[userId] = `User ${userId}`;
          }
        }
      }
      
      setUserCache(newCache);
    };
    
    loadUserData();
  }, [upcomingTasks, ongoingTasks, completedTasks, userCache]);
  
  // Helper function to get user name
  const getUserName = (userId: string | number) => {
    const id = String(userId);
    return userCache[id] || id;
  };
  
  // Format assigned users for display
  const formatAssignedUsers = (assignedIds?: string[]) => {
    if (!assignedIds || assignedIds.length === 0) return "Unassigned";
    
    if (assignedIds.length === 1) {
      return getUserName(assignedIds[0]);
    }
    
    return `${getUserName(assignedIds[0])} + ${assignedIds.length - 1} more`;
  };

  const TaskBox = ({ 
    title, 
    tasks, 
    icon, 
    color,
    onTaskClick,
    showAddButton,
    onTaskUpdated
  }: { 
    title: string; 
    tasks: Task[]; 
    icon: React.ReactNode; 
    color: string;
    onTaskClick?: (task: Task) => void;
    showAddButton?: boolean;
    onTaskUpdated?: (task: Task) => Promise<void>;
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
          {title === 'Upcoming Tasks' && showAddButton && (
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
                onClick={() => {
                  if (onTaskClick) onTaskClick(task);
                  if (onTaskUpdated) onTaskUpdated(task);
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                  {task.title}
                </Typography>
                
                {/* Created by info */}
                {task.created_by && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', mr: 0.5 }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Created by: {getUserName(task.created_by)}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {formatAssignedUsers(task.assigned_to)}
                    </Typography>
                  </Box>
                  <Chip
                    label={task.priority?.toUpperCase()}
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '0.65rem',
                      color: '#fff',
                      backgroundColor: 
                        task.priority === 'high' ? 'error.main' :
                        task.priority === 'medium' ? 'warning.main' : 'success.main',
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mt: 1 }}>
                  Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
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
          showAddButton={showAddButton}
          onTaskUpdated={onTaskUpdated}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TaskBox
          title="Ongoing Tasks"
          tasks={ongoingTasks}
          icon={<WorkIcon sx={{ color: '#fff' }} />}
          color="#FF9800"
          onTaskClick={onTaskClick}
          showAddButton={showAddButton}
          onTaskUpdated={onTaskUpdated}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TaskBox
          title="Completed Tasks"
          tasks={completedTasks}
          icon={<CheckCircleIcon sx={{ color: '#fff' }} />}
          color="#4CAF50"
          onTaskClick={onTaskClick}
          showAddButton={showAddButton}
          onTaskUpdated={onTaskUpdated}
        />
      </Grid>
    </Grid>
  );
};

export default TasksSection;
