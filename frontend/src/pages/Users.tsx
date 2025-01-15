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
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import Sidebar from '../components/Sidebar';
import UserList from '../components/users/UserList';
import UserSummary from '../components/users/UserSummary';
import TasksSection from '../components/departments/TasksSection';
import Footer from '../components/Footer';
import { Task } from '../types/task';
import { UserService } from '../services/user';
import { TaskService } from '../services/task';
import { RootState } from '../store';

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
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  // Add new state for real data
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Fetch users and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch users based on current user's department
        const usersResponse = await UserService.getUsers();
        setUsers(usersResponse);

        // If a user is selected, fetch their tasks
        if (selectedUser) {
          const tasksResponse = await TaskService.getAssignedTasks(selectedUser.toString());
          setTasks(tasksResponse);
        }
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedUser]);

  const handleLogout = async () => {
    // Your logout logic
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleNotificationClick = () => {
    setNotifications(0);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  // Filter tasks based on selected user
  const filteredTasks = tasks.filter(task => {
    if (!selectedUser) return false;
    const userId = selectedUser;
    const assignedToId = task.assigned_to;
    const createdById = task.created_by?.toString();
    return (assignedToId === userId) || 
           (createdById === userId);
  });

  const upcomingTasks = filteredTasks.filter(task => 
    task.status === 'todo' && new Date(task.due_date) > new Date()
  );
  
  const ongoingTasks = filteredTasks.filter(task => 
    task.status === 'in_progress' || 
    (task.status === 'todo' && new Date(task.due_date) <= new Date())
  );
  
  const completedTasks = filteredTasks.filter(task => 
    task.status === 'done'
  );

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'error.main' 
        }}
      >
        {error}
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      position: 'relative',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e2a78 0%, #ff3c7d 100%)',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.3)'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/svg%3E")
        `,
        backgroundSize: '40px 40px',
        opacity: 0.5,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}>
      <Sidebar
        open={open}
        onToggleDrawer={toggleDrawer}
        onLogout={handleLogout}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="xl">
          {/* Header with notifications and profile */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center',
              gap: { xs: 1, sm: 2 },
              mb: { xs: 2, sm: 3 },
            }}
          >
            <IconButton
              onClick={handleNotificationClick}
              sx={{
                color: '#fff',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Badge 
                badgeContent={notifications} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    background: '#ff3c7d',
                    color: '#fff',
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton
              onClick={handleProfileClick}
              sx={{
                color: '#fff',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: 'transparent',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                }}
              >
                <AccountCircleIcon />
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleProfileClose}
              onClick={handleProfileClose}
              PaperProps={{
                sx: {
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
                  color: '#fff',
                  mt: 1.5,
                  '& .MuiMenuItem-root': {
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => navigate('/profile')}>
                <ListItemIcon>
                  <AccountCircleIcon sx={{ color: '#fff' }} />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => navigate('/settings')}>
                <ListItemIcon>
                  <SettingsIcon sx={{ color: '#fff' }} />
                </ListItemIcon>
                Settings
              </MenuItem>
            </Menu>
          </Box>

          {/* Main content */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <UserList
                users={users}
                selectedUser={selectedUser}
                onSelectUser={setSelectedUser}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </Grid>
            <Grid item xs={12} md={9}>
              <UserSummary 
                user={selectedUser && users.length > 0 ? {
                  ...users.find(u => u.id === selectedUser),
                  totalTasks: filteredTasks.length,
                  completedTasks: completedTasks.length,
                  ongoingTasks: ongoingTasks.length,
                  completionRate: filteredTasks.length > 0 
                    ? Math.round((completedTasks.length / filteredTasks.length) * 100) 
                    : 0,
                  sx: {
                    completionRate: {
                      animation: `${numberAnimation} 0.8s ease-out forwards`,
                    },
                    progressBar: {
                      '& .MuiLinearProgress-bar': {
                        animation: `${fillAnimation} 1.2s ease-out`,
                        transformOrigin: 'left',
                      },
                    },
                  },
                } : null} 
              />
              <TasksSection
                currentUserId={currentUser?.id ? Number(currentUser.id) : 0}
                currentDepartmentId={selectedUser ? Number(selectedUser) : 0}
                viewMode="user"
                upcomingTasks={upcomingTasks}
                ongoingTasks={ongoingTasks}
                completedTasks={completedTasks}
              />
            </Grid>
          </Grid>
        </Container>

        {/* Footer */}
        <Footer open={open} drawerWidth={DRAWER_WIDTH} />
      </Box>
    </Box>
  );
};

export default Users;
