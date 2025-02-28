import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Grid,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  keyframes,
  CircularProgress,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import Sidebar from '../components/Sidebar';
import UserList from '../components/users/UserList';
import UserSummary from '../components/users/UserSummary';
import TasksSection from '../components/departments/TasksSection';
import { Task } from '../types/task';
import { UserService } from '../services/user';
import { TaskService } from '../services/task';
import { RootState } from '../store';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';

const DRAWER_WIDTH = 240;

const fillAnimation = keyframes`
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
`;

const numberAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Users: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(3);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, tasksResponse] = await Promise.all([
        UserService.getUsers(),
        TaskService.getTasks(),
      ]);
      setUsers(usersResponse);
      setTasks(tasksResponse);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Handle logout logic here
    navigate('/login');
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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

  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Calculate user stats for the selected user
  const selectedUserData = selectedUser 
    ? users.find((u: any) => u.id === selectedUser) 
    : users.length > 0 
      ? users[0] 
      : null;

  // Filter tasks for the selected user
  const userTasks = selectedUser 
    ? tasks.filter(task => 
        task.assigned_to?.includes(selectedUser) || 
        task.created_by === selectedUser
      ) 
    : [];

  const userCompletedTasks = userTasks.filter(task => task.status === 'completed');
  const userOngoingTasks = userTasks.filter(task => task.status === 'in_progress');
  const userPendingTasks = userTasks.filter(task => task.status === 'pending');

  // Create user summary data
  const userSummaryData = selectedUserData ? {
    username: (selectedUserData as any).username,
    first_name: (selectedUserData as any).first_name,
    last_name: (selectedUserData as any).last_name,
    role: (selectedUserData as any).role || 'User',
    avatar: (selectedUserData as any).avatar,
    totalTasks: userTasks.length,
    completedTasks: userCompletedTasks.length,
    ongoingTasks: userOngoingTasks.length,
    completionRate: userTasks.length > 0 
      ? Math.round((userCompletedTasks.length / userTasks.length) * 100) 
      : 0
  } : null;

  const mainContent = (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: '#2196f3' }} />
        </Box>
      ) : error ? (
        <Typography sx={{ color: '#f44336', textAlign: 'center', mt: 4 }}>{error}</Typography>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              sx={{
                p: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                mb: 3,
              }}
            >
              <UserSummary user={userSummaryData} />
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                p: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                height: '100%',
              }}
            >
              <UserList 
                users={users} 
                selectedUser={selectedUser}
                onSelectUser={handleSelectUser}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                height: '100%',
              }}
            >
              <TasksSection 
                currentUserId={selectedUser ? parseInt(selectedUser) : 0}
                currentDepartmentId={0}
                viewMode="user"
                upcomingTasks={userPendingTasks}
                ongoingTasks={userOngoingTasks}
                completedTasks={userCompletedTasks}
              />
            </Box>
          </Grid>
        </Grid>
      )}
    </Container>
  );

  return (
    <ModernDashboardLayout
      sidebar={
        <Sidebar
          open={sidebarOpen}
          onToggleDrawer={handleToggleSidebar}
          onLogout={handleLogout}
          drawerWidth={DRAWER_WIDTH}
        />
      }
      topBar={
        <DashboardTopBar 
          username={user?.username || 'User'}
          notificationCount={notifications}
          onToggleSidebar={handleToggleSidebar}
          onNotificationClick={handleNotificationClick}
          onLogout={handleLogout}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onHelpClick={handleHelpClick}
        />
      }
      mainContent={mainContent}
      sidebarOpen={sidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default Users;
