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
  Container,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MailIcon from '@mui/icons-material/Mail';
import axios from '../../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';

const DRAWER_WIDTH = 240;

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
  user_id?: string;
  action: string;
  target: string;
  target_id?: string;
  details: string;
  timestamp: string;
  ip_address?: string;
  status: 'success' | 'warning' | 'error';
}

interface DepartmentStat {
  id: string;
  name: string;
  members_count: number;
  active_projects: number;
  completion_rate: number;
  head_name?: string;
}

// Add these styles for the cards
const cardStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(8px)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  boxShadow: 'none',
  height: '100%',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
};

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(3);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    users: 0,
    departments: 0,
    tasks: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    upcomingTasks: 0
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data from API...');
      
      // Fetch dashboard data from the real API
      // The baseURL and endpoints should match your actual API
      const response = await axios.get('/admin/dashboard');
      
      console.log('API response:', response.data);
      
      if (response && response.data) {
        // Set the stats from the API response
        setStats({
          users: response.data.stats?.users || 0,
          departments: response.data.stats?.departments || 0,
          tasks: response.data.stats?.tasks || 0,
          activeUsers: response.data.stats?.activeUsers || 0,
          inactiveUsers: response.data.stats?.inactiveUsers || 0,
          pendingTasks: response.data.stats?.pendingTasks || 0,
          inProgressTasks: response.data.stats?.inProgressTasks || 0,
          completedTasks: response.data.stats?.completedTasks || 0,
          upcomingTasks: response.data.stats?.upcomingTasks || 0
        });
        
        // Set department stats
        setDepartmentStats(response.data.department_stats || []);
        
        // Set activities
        setActivities(response.data.recent_activities || []);
      } else {
        setError('Invalid response data from API');
        console.error('Invalid dashboard data from API');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Failed to load dashboard data: ${err.response.status} ${err.response.statusText}`);
        console.error('Error response:', err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        setError('Server did not respond. Please check your connection.');
        console.error('No response received:', err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('Failed to load dashboard data. Please try again later.');
        console.error('Error message:', err.message);
      }
      
      // For development: Reset to empty states to prevent UI errors
      setStats({
        users: 0,
        departments: 0,
        tasks: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        upcomingTasks: 0
      });
      setDepartmentStats([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleToggleTopWidgets = () => {
    setTopWidgetsVisible(prev => !prev);
  };

  const handleLogout = () => {
    // Handle logout logic here
    navigate('/login');
  };

  const handleNotificationClick = () => {
    setNotifications(0);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleHelpClick = () => {
    console.log('Help clicked');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      default:
        return '#4caf50';
    }
  };

  const mainContent = (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: '#2196f3' }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#fff' }}>
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
            Overview of system statistics and recent activities
          </Typography>

          {/* Stats Overview Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Stats Cards */}
            <Grid item xs={12} md={4}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton
                      sx={{
                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                        color: '#2196f3',
                        mr: 2,
                      }}
                    >
                      <PeopleIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      Users
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      color: '#fff',
                      animation: `${fillNumberAnimation} 1s ease-out`,
                    }}
                  >
                    {stats.users}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Active:</span> <span style={{ color: '#4caf50' }}>{stats.activeUsers}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Inactive:</span> <span style={{ color: '#f44336' }}>{stats.inactiveUsers}</span>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton
                      sx={{
                        backgroundColor: 'rgba(156, 39, 176, 0.2)',
                        color: '#9c27b0',
                        mr: 2,
                      }}
                    >
                      <BusinessIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      Departments
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      color: '#fff',
                      animation: `${fillNumberAnimation} 1s ease-out`,
                    }}
                  >
                    {stats.departments}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
                    Active departments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton
                      sx={{
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        color: '#4caf50',
                        mr: 2,
                      }}
                    >
                      <AssignmentIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      Tasks
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      color: '#fff',
                      animation: `${fillNumberAnimation} 1s ease-out`,
                    }}
                  >
                    {stats.tasks}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pending:</span> <span style={{ color: '#ff9800' }}>{stats.pendingTasks}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>In Progress:</span> <span style={{ color: '#2196f3' }}>{stats.inProgressTasks}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Completed:</span> <span style={{ color: '#4caf50' }}>{stats.completedTasks}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <span>Due soon:</span> <span style={{ color: '#f44336' }}>{stats.upcomingTasks}</span>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activities */}

            {/* Department Stats */}
            <Grid item xs={12}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                    Department Performance
                  </Typography>
                  <Grid container spacing={2}>
                    {departmentStats.length > 0 ? (
                      departmentStats.map((dept) => (
                        <Grid item xs={12} md={4} key={dept.id}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <Typography sx={{ color: '#fff', fontWeight: 500, mb: 1 }}>
                              {dept.name}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Members:
                              </Typography>
                              <Typography sx={{ color: '#fff' }}>{dept.members_count}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Active Projects:
                              </Typography>
                              <Typography sx={{ color: '#fff' }}>{dept.active_projects}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Completion Rate:
                              </Typography>
                              <Typography sx={{ color: '#4caf50' }}>{dept.completion_rate}%</Typography>
                            </Box>
                            {dept.head_name && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  Head:
                                </Typography>
                                <Typography sx={{ color: '#2196f3' }}>{dept.head_name}</Typography>
                              </Box>
                            )}
                            <Box sx={{ mt: 2, position: 'relative', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px' }}>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  height: '100%',
                                  width: `${dept.completion_rate}%`,
                                  backgroundColor: '#4caf50',
                                  borderRadius: '2px',
                                }}
                              />
                            </Box>
                          </Box>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', py: 4 }}>
                          No departments to display
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );

  return (
    <ModernDashboardLayout
      sidebar={
        <Sidebar
          open={isSidebarOpen}
          onToggleDrawer={handleToggleSidebar}
          onLogout={handleLogout}
          drawerWidth={DRAWER_WIDTH}
        />
      }
      topBar={
        <DashboardTopBar
          username={user?.username || 'Admin'}
          notificationCount={notifications}
          onToggleSidebar={handleToggleSidebar}
          onNotificationClick={() => console.log('Notification clicked')}
          onLogout={handleLogout}
          onProfileClick={() => navigate('/profile')}
          onSettingsClick={() => navigate('/admin/settings')}
          onHelpClick={() => console.log('Help clicked')}
          onToggleTopWidgets={handleToggleTopWidgets}
          topWidgetsVisible={topWidgetsVisible}
        />
      }
      mainContent={mainContent}
      sidebarOpen={isSidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default AdminDashboard;