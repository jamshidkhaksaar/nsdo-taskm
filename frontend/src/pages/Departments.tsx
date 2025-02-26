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
  useTheme,
  useMediaQuery,
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
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';

const DRAWER_WIDTH = 240;

const Departments: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(3);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // State for data
  const [departments, setDepartments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch departments and tasks
  useEffect(() => {
    fetchData();
  }, [selectedDepartment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch departments
      const departmentsResponse = await DepartmentService.getDepartments();
      setDepartments(departmentsResponse);

      // If a department is selected, fetch its tasks
      if (selectedDepartment) {
        const tasksResponse = await TaskService.getDepartmentTasks(selectedDepartment);
        setTasks(tasksResponse);
        
        // Fetch top performers for the selected department
        const performersResponse = await DepartmentService.getDepartmentPerformers(selectedDepartment);
        setTopPerformers(performersResponse);
      }
      
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

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleHelpClick = () => {
    console.log('Help clicked');
  };

  // Filter tasks based on selected department
  const departmentTasks = tasks.filter(task => {
    if (!selectedDepartment) return false;
    return task.department === selectedDepartment;
  });

  const upcomingTasks = departmentTasks.filter(task => 
    task.status === 'pending' && new Date(task.due_date) > new Date()
  );
  
  const ongoingTasks = departmentTasks.filter(task => 
    task.status === 'in_progress' || 
    (task.status === 'pending' && new Date(task.due_date) <= new Date())
  );
  
  const completedTasks = departmentTasks.filter(task => 
    task.status === 'completed'
  );

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
          <Grid item xs={12} md={3}>
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
              <DepartmentList
                departments={departments}
                selectedDepartment={selectedDepartment}
                onSelectDepartment={setSelectedDepartment}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={9}>
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
              {selectedDepartment && departments.length > 0 ? (
                <DepartmentSummary 
                  departmentName={departments.find(d => d.id === selectedDepartment)?.name || 'Department'}
                  totalTasks={departmentTasks.length}
                  completedTasks={completedTasks.length}
                  ongoingTasks={ongoingTasks.length}
                  upcomingTasks={upcomingTasks.length}
                  topPerformers={topPerformers.map(performer => ({
                    id: performer.id,
                    name: `${performer.first_name} ${performer.last_name}`,
                    tasksCompleted: performer.completed_tasks,
                    completionRate: performer.completion_rate
                  }))}
                />
              ) : (
                <Typography sx={{ color: '#fff', textAlign: 'center' }}>
                  Select a department to view details
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                p: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
              }}
            >
              <TasksSection
                currentUserId={user?.id ? Number(user.id) : 0}
                currentDepartmentId={selectedDepartment ? Number(selectedDepartment) : 0}
                viewMode="department"
                upcomingTasks={upcomingTasks}
                ongoingTasks={ongoingTasks}
                completedTasks={completedTasks}
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
      footer={<Footer open={sidebarOpen} drawerWidth={DRAWER_WIDTH} />}
      sidebarOpen={sidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default Departments;
