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
  CircularProgress,
  Typography,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import Sidebar from '../components/Sidebar';
import DepartmentList from '../components/departments/DepartmentList';
import DepartmentSummary from '../components/departments/DepartmentSummary';
import TasksSection from '../components/departments/TasksSection';
import Footer from '../components/Footer';
import { Task } from '../types/task';
import { DepartmentService } from '../services/department';
import { TaskService } from '../services/task';
import { RootState } from '../store';
import AdminLayout from '../components/AdminLayout';

const DRAWER_WIDTH = 240;

const Departments: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(3);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Add new state for real data
  const [departments, setDepartments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Fetch departments and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch departments
        const departmentsResponse = await DepartmentService.getDepartments();
        setDepartments(departmentsResponse);

        // If a department is selected, fetch its tasks and performance metrics
        if (selectedDepartment) {
          const departmentId = parseInt(selectedDepartment, 10);
          const [tasksResponse, performanceResponse] = await Promise.all([
            TaskService.getTasksByDepartment(departmentId),
            DepartmentService.getDepartmentPerformance(selectedDepartment)
          ]);
          
          setTasks(tasksResponse);
          // Check if performanceResponse has the expected structure
          if (performanceResponse && typeof performanceResponse === 'object' && 'topPerformers' in performanceResponse) {
            setTopPerformers(performanceResponse.topPerformers || []);
          }
        }
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDepartment]);

  const handleLogout = () => {
    // Handle logout
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

  // Filter tasks based on selected department
  const filteredTasks = tasks.filter(task => 
    task.department?.toString() === selectedDepartment
  );

  const upcomingTasks = filteredTasks.filter(task => 
    task.status === 'pending' && new Date(task.due_date) > new Date()
  );
  
  const ongoingTasks = filteredTasks.filter(task => 
    task.status === 'in_progress' || 
    (task.status === 'pending' && new Date(task.due_date) <= new Date())
  );
  
  const completedTasks = filteredTasks.filter(task => 
    task.status === 'completed'
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

  const selectedDepartmentData = departments.find(d => d.id === selectedDepartment);

  return (
    <AdminLayout>
      <Typography variant="h4" sx={{ color: '#fff' }}>
        Departments Page
      </Typography>
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
            open={Boolean(anchorEl)}
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
              departments={departments}
              selectedDepartment={selectedDepartment}
              onSelectDepartment={setSelectedDepartment}
            />
          </Grid>
          <Grid item xs={12} md={9}>
            <DepartmentSummary
              departmentName={selectedDepartmentData?.name || 'All Departments'}
              totalTasks={filteredTasks.length}
              completedTasks={completedTasks.length}
              ongoingTasks={ongoingTasks.length}
              upcomingTasks={upcomingTasks.length}
              topPerformers={topPerformers}
            />
            <TasksSection
              currentUserId={Number(currentUser?.id) || 0}
              currentDepartmentId={selectedDepartment ? parseInt(selectedDepartment, 10) : 0}
              viewMode="department"
              upcomingTasks={upcomingTasks}
              ongoingTasks={ongoingTasks}
              completedTasks={completedTasks}
            />
          </Grid>
        </Grid>
      </Container>
    </AdminLayout>
  );
};

export default Departments;
