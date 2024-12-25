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
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import Sidebar from '../components/Sidebar';
import DepartmentList from '../components/departments/DepartmentList';
import DepartmentSummary from '../components/departments/DepartmentSummary';
import TasksSection from '../components/departments/TasksSection';
import Footer from '../components/Footer';

// Import or define the Task type
interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'upcoming' | 'ongoing' | 'completed';
}

// Mock data with proper typing
const mockDepartments = [
  { id: '1', name: 'Program', tasksCount: 15 },
  { id: '2', name: 'Planning Partnership', tasksCount: 8 },
  { id: '3', name: 'MEAL', tasksCount: 12 },
];

const mockTopPerformers = [
  { id: '1', name: 'John Doe', tasksCompleted: 25, completionRate: 85 },
  { id: '2', name: 'Jane Smith', tasksCompleted: 20, completionRate: 75 },
  { id: '3', name: 'Mike Johnson', tasksCompleted: 18, completionRate: 70 },
];

const mockTasks: {
  upcoming: Task[];
  ongoing: Task[];
  completed: Task[];
} = {
  upcoming: [
    {
      id: '1',
      title: 'Review Q3 Reports',
      assignee: 'John Doe',
      dueDate: '2024-03-20',
      priority: 'high' as const,
      status: 'upcoming' as const,
    },
  ],
  ongoing: [
    {
      id: '2',
      title: 'Prepare Monthly Summary',
      assignee: 'Jane Smith',
      dueDate: '2024-03-15',
      priority: 'medium' as const,
      status: 'ongoing' as const,
    },
  ],
  completed: [
    {
      id: '3',
      title: 'Team Meeting Minutes',
      assignee: 'Mike Johnson',
      dueDate: '2024-03-10',
      priority: 'low' as const,
      status: 'completed' as const,
    },
  ],
};

const DRAWER_WIDTH = 240;

const Departments: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
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

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <DepartmentList
                departments={mockDepartments}
                selectedDepartment={selectedDepartment}
                onSelectDepartment={setSelectedDepartment}
              />
            </Grid>
            <Grid item xs={12} md={9}>
              <DepartmentSummary
                departmentName={mockDepartments.find(d => d.id === selectedDepartment)?.name || 'All Departments'}
                totalTasks={30}
                completedTasks={12}
                ongoingTasks={10}
                upcomingTasks={8}
                topPerformers={mockTopPerformers}
              />
              <TasksSection
                upcomingTasks={mockTasks.upcoming}
                ongoingTasks={mockTasks.ongoing}
                completedTasks={mockTasks.completed}
                onAddTask={() => console.log('Add task clicked')}
              />
            </Grid>
          </Grid>
        </Container>
        
        <Footer open={open} drawerWidth={DRAWER_WIDTH} />
      </Box>
    </Box>
  );
};

export default Departments; 