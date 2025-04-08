import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Divider, 
  Skeleton,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'complete' | 'assign' | 'delete';
  taskId: string;
  taskTitle: string;
  userId: string;
  username: string;
  timestamp: string;
  details?: string;
}

const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real app, this would be an API call to get activities
      // For now, we'll simulate it with a timeout and mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'create',
          taskId: 'task1',
          taskTitle: 'Create new dashboard design',
          userId: 'user1',
          username: 'John Doe',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        },
        {
          id: '2',
          type: 'assign',
          taskId: 'task2',
          taskTitle: 'Fix login page issues',
          userId: 'user2',
          username: 'Jane Smith',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          details: 'Assigned to Marketing team',
        },
        {
          id: '3',
          type: 'update',
          taskId: 'task3',
          taskTitle: 'Update user documentation',
          userId: 'user1',
          username: 'John Doe',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        },
        {
          id: '4',
          type: 'complete',
          taskId: 'task4',
          taskTitle: 'Implement new API endpoints',
          userId: 'user3',
          username: 'Robert Johnson',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
        },
        {
          id: '5',
          type: 'delete',
          taskId: 'task5',
          taskTitle: 'Outdated feature removal',
          userId: 'user2',
          username: 'Jane Smith',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
      ];
      
      setActivities(mockActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity feed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <AssignmentIcon sx={{ color: '#3498db' }} />;
      case 'update':
        return <EditIcon sx={{ color: '#f39c12' }} />;
      case 'complete':
        return <CheckCircleIcon sx={{ color: '#2ecc71' }} />;
      case 'assign':
        return <PersonAddIcon sx={{ color: '#9b59b6' }} />;
      case 'delete':
        return <DeleteIcon sx={{ color: '#e74c3c' }} />;
      default:
        return <AssignmentIcon sx={{ color: '#3498db' }} />;
    }
  };

  // Get activity description based on type
  const getActivityDescription = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'create':
        return `created a new task`;
      case 'update':
        return `updated task`;
      case 'complete':
        return `completed task`;
      case 'assign':
        return `assigned task`;
      case 'delete':
        return `deleted task`;
      default:
        return `interacted with task`;
    }
  };

  // Get activity color based on type
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'create':
        return '#3498db';
      case 'update':
        return '#f39c12';
      case 'complete':
        return '#2ecc71';
      case 'assign':
        return '#9b59b6';
      case 'delete':
        return '#e74c3c';
      default:
        return '#3498db';
    }
  };

  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 8px 0 rgba(31, 38, 135, 0.15)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: isCollapsed ? 'auto' : '250px'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
          Recent Activity
        </Typography>
        <Box>
          <Tooltip title="Refresh activity">
            <span>
              <IconButton 
                size="small" 
                onClick={fetchActivities}
                disabled={isLoading}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  mr: 0.5,
                  '&:hover': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={isCollapsed ? "Expand" : "Collapse"}>
             <IconButton
                size="small"
                onClick={() => setIsCollapsed(!isCollapsed)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                {isCollapsed ? <ExpandMore /> : <ExpandLess />}
              </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Collapse in={!isCollapsed} timeout="auto" sx={{ flexGrow: 1, minHeight: 0 }}>
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflowY: 'auto',
            p: 2,
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
            },
          }}
        >
          {isLoading ? (
            // Loading skeletons
            Array.from(new Array(3)).map((_, index) => (
              <Box key={index} sx={{ display: 'flex', mb: 2 }}>
                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mr: 1.5 }} />
                <Box sx={{ width: '100%' }}>
                  <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                  <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                </Box>
              </Box>
            ))
          ) : error ? (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 2 }}>
              {error}
            </Typography>
          ) : activities.length === 0 ? (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 2 }}>
              No recent activity
            </Typography>
          ) : (
            activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <Box sx={{ display: 'flex', mb: 1.5 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${getActivityColor(activity.type)}20`,
                      color: getActivityColor(activity.type),
                      mr: 1.5,
                      width: 32,
                      height: 32,
                    }}
                  >
                    {getActivityIcon(activity.type)}
                  </Avatar>
                  
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                        {activity.username}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {getActivityDescription(activity)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                        {activity.taskTitle}
                      </Typography>
                    </Box>
                    
                    {activity.details && (
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>
                        {activity.details}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </Typography>
                  </Box>
                </Box>
                {index < activities.length - 1 && <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', my: 1 }} />}
              </React.Fragment>
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default ActivityFeed; 