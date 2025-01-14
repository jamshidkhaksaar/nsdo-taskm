import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const DRAWER_WIDTH = 240;

// Mock data
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Project Manager',
    tasksCount: 12,
    avatar: '',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Developer',
    tasksCount: 8,
    avatar: '',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'Designer',
    tasksCount: 5,
    avatar: '',
  },
];

const mockUserDetails = {
  name: 'John Doe',
  role: 'Project Manager',
  avatar: '',
  totalTasks: 12,
  completedTasks: 5,
  ongoingTasks: 4,
  upcomingTasks: 3,
  completionRate: 75,
  tasksByPriority: {
    high: 3,
    medium: 6,
    low: 3,
  },
};

const mockTasks = [
  {
    id: '1',
    title: 'Review User Reports',
    description: 'Review and analyze user activity reports for Q1',
    created_by: { id: '1', username: 'Admin' },
    assigned_to: { id: '2', username: 'Jane Smith' },
    department: { id: '1', name: 'Program' },
    due_date: '2024-03-25',
    priority: 'high' as const,
    status: 'todo' as const,
    created_at: '2024-03-01',
    is_private: false,
  },
  {
    id: '2',
    title: 'User Training Session',
    description: 'Conduct training session for new system users',
    created_by: { id: '1', username: 'Admin' },
    assigned_to: { id: '3', username: 'Mike Johnson' },
    department: { id: '2', name: 'Planning Partnership' },
    due_date: '2024-03-20',
    priority: 'medium' as const,
    status: 'in_progress' as const,
    created_at: '2024-03-01',
    is_private: false,
  },
  {
    id: '3',
    title: 'User Access Review',
    description: 'Complete monthly user access review',
    created_by: { id: '1', username: 'Admin' },
    assigned_to: { id: '4', username: 'Sarah Wilson' },
    department: { id: '3', name: 'MEAL' },
    due_date: '2024-03-15',
    priority: 'low' as const,
    status: 'done' as const,
    created_at: '2024-03-01',
    is_private: false,
  },
];

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

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
  };

  // Filter tasks based on status and selected user
  const filteredTasks = mockTasks.filter(task => 
    task.assigned_to?.id === selectedUser || task.created_by.id === selectedUser
  );

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
                users={mockUsers}
                selectedUser={selectedUser}
                onSelectUser={setSelectedUser}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </Grid>
            <Grid item xs={12} md={9}>
              <UserSummary 
                user={{
                  ...mockUserDetails,
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
                }} 
              />
              <TasksSection
                tasks={filteredTasks}
                upcomingTasks={upcomingTasks}
                ongoingTasks={ongoingTasks}
                completedTasks={completedTasks}
                currentUserId={selectedUser || ''}
                currentDepartmentId=""
                viewMode="user"
                onTaskClick={handleTaskClick}
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