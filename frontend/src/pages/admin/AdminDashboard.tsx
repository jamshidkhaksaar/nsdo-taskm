import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  keyframes,
  CircularProgress,
  Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AdminLayout from '../../layouts/AdminLayout';
import axios from '../../utils/axios';

const fillNumberAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface DepartmentStat {
  id: string;
  name: string;
  members_count: number;
  active_projects: number;
  completion_rate: number;
}

// Add these styles for the cards
const cardStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  height: '100%',
  '& .MuiTypography-root': {
    color: '#fff',
  },
  '& .MuiTypography-body2': {
    color: 'rgba(255, 255, 255, 0.7)',
  }
};

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    activeUsers: 0,
    totalProjects: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/');
      console.log('Dashboard data:', response.data);  // Debug log
      
      // Access stats from the nested structure
      setStats({
        totalUsers: response.data.stats.total_users,
        totalDepartments: response.data.stats.total_departments,
        activeUsers: response.data.stats.active_users,
        totalProjects: response.data.stats.total_projects,
      });
      
      setRecentActivities(response.data.recent_activities);
      setDepartmentStats(response.data.department_stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#fff' }}>
          Admin Dashboard
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}
        >
          Overview of your system's statistics and activities
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {/* Total Users Card */}
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton sx={{ bgcolor: 'primary.main', color: '#fff' }}>
                      <PeopleIcon />
                    </IconButton>
                    <Box>
                      <Typography variant="h5" sx={{ animation: `${fillNumberAnimation} 1s ease-out` }}>
                        {stats.totalUsers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Users
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Departments Card */}
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton sx={{ bgcolor: 'success.main', color: '#fff' }}>
                      <BusinessIcon />
                    </IconButton>
                    <Box>
                      <Typography variant="h5" sx={{ animation: `${fillNumberAnimation} 1s ease-out` }}>
                        {stats.totalDepartments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Departments
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Users Card */}
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton sx={{ bgcolor: 'warning.main', color: '#fff' }}>
                      <PeopleIcon />
                    </IconButton>
                    <Box>
                      <Typography variant="h5" sx={{ animation: `${fillNumberAnimation} 1s ease-out` }}>
                        {stats.activeUsers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Users
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Projects Card */}
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton sx={{ bgcolor: 'error.main', color: '#fff' }}>
                      <AssignmentIcon />
                    </IconButton>
                    <Box>
                      <Typography variant="h5" sx={{ animation: `${fillNumberAnimation} 1s ease-out` }}>
                        {stats.totalProjects}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Projects
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Activities */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activities
                  </Typography>
                  {recentActivities.map((activity: Activity) => (
                    <Box 
                      key={activity.id} 
                      sx={{ 
                        mb: 2,
                        p: 2,
                        borderRadius: 1,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">
                          {activity.action}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                        >
                          {new Date(activity.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}
                      >
                        {activity.details}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Department Stats */}
            <Grid item xs={12} md={6}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Department Statistics
                  </Typography>
                  {departmentStats.map((dept: DepartmentStat) => (
                    <Box 
                      key={dept.id} 
                      sx={{ 
                        mb: 2,
                        p: 2,
                        borderRadius: 1,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Typography variant="subtitle2">
                        {dept.name}
                      </Typography>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          gap: 2, 
                          mt: 1,
                          color: 'rgba(255, 255, 255, 0.7)' 
                        }}
                      >
                        <Typography variant="body2">
                          Members: {dept.members_count}
                        </Typography>
                        <Typography variant="body2">
                          Active Projects: {dept.active_projects}
                        </Typography>
                        <Typography variant="body2">
                          Completion Rate: {dept.completion_rate}%
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard; 