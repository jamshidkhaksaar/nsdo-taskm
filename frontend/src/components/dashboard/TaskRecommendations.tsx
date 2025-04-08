import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CircularProgress, 
  Typography, 
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Button,
  Tooltip,
  Skeleton
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import WarningIcon from '@mui/icons-material/Warning';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { format } from 'date-fns';

// Skeleton for loading state
const LoadingSkeleton = () => (
  <Box sx={{ p: 2 }}>
    {[1, 2, 3].map((_, index) => (
      <Box key={index} sx={{ mb: 2 }}>
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }}/>
        <Skeleton variant="rectangular" width="100%" height={40} />
        {index < 2 && <Divider sx={{ my: 1.5 }} />}
      </Box>
    ))}
  </Box>
);

// Define props interface (kept empty as before)
interface TaskRecommendationsProps {}

const TaskRecommendations: React.FC<TaskRecommendationsProps> = () => {
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data } = await axios.get(`${API_BASE_URL}/analytics/recommendations`);
        setRecommendations(data);
      } catch (err) {
        console.error('Error fetching task recommendations:', err);
        setError('Failed to load task recommendations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d');
    } catch (e) {
      return 'No date';
    }
  };

  const renderHighPriorityTasks = () => {
    if (!recommendations?.highPriorityTasks?.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
          No high priority tasks
        </Typography>
      );
    }

    return (
      <List dense disablePadding>
        {recommendations.highPriorityTasks.map((task: any) => (
          <ListItem key={task.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <PriorityHighIcon color="error" fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary={task.title}
              secondary={`Due: ${formatDate(task.dueDate)}`}
              primaryTypographyProps={{ variant: 'body2', noWrap: true }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <Tooltip title="Start Task">
              <Button 
                size="small" 
                sx={{ minWidth: 'auto', p: 0.5 }}
                onClick={() => {/* Handle start task */}}
              >
                <PlayArrowIcon fontSize="small" />
              </Button>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    );
  };

  const renderOverdueTasks = () => {
    if (!recommendations?.overdueTasks?.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
          No overdue tasks
        </Typography>
      );
    }

    return (
      <List dense disablePadding>
        {recommendations.overdueTasks.map((task: any) => (
          <ListItem key={task.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <WarningIcon color="warning" fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary={task.title}
              secondary={`Due: ${formatDate(task.dueDate)}`}
              primaryTypographyProps={{ variant: 'body2', noWrap: true }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <Chip 
              label={task.priority} 
              size="small" 
              color={getPriorityColor(task.priority) as any}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const renderTasksToStart = () => {
    if (!recommendations?.tasksToStart?.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
          No tasks to start
        </Typography>
      );
    }

    return (
      <List dense disablePadding>
        {recommendations.tasksToStart.map((task: any) => (
          <ListItem key={task.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <PlayArrowIcon color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary={task.title}
              secondary={`Due: ${formatDate(task.dueDate)}`}
              primaryTypographyProps={{ variant: 'body2', noWrap: true }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <Chip 
              label={task.priority} 
              size="small" 
              color={getPriorityColor(task.priority) as any}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
      <CardHeader 
        title="Smart Recommendations" 
        titleTypographyProps={{ variant: 'h6' }}
        sx={{ 
          backgroundColor: 'primary.light', 
          color: 'primary.contrastText',
          pb: 1 
        }}
      />
      <CardContent sx={{ flexGrow: 1, overflow: 'auto', 
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.05)' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: '3px' }
       }}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography color="error" variant="body1" align="center">
              {error}
            </Typography>
          </Box>
        ) : recommendations ? (
          <Box>
            <Typography variant="subtitle2" color="primary" fontWeight="medium">
              High Priority Tasks
            </Typography>
            {renderHighPriorityTasks()}
            
            <Divider sx={{ my: 1.5 }} />
            
            <Typography variant="subtitle2" color="error" fontWeight="medium">
              Overdue Tasks
            </Typography>
            {renderOverdueTasks()}
            
            <Divider sx={{ my: 1.5 }} />
            
            <Typography variant="subtitle2" color="info.main" fontWeight="medium">
              Recommended to Start Now
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Based on your average completion time of {recommendations?.averageCompletionDays || '-'} days
            </Typography>
            {renderTasksToStart()}
          </Box>
        ) : (
          <Typography color="text.secondary" align="center">No recommendations available.</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskRecommendations; 