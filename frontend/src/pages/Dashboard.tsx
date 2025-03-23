/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Box, useMediaQuery, useTheme, CircularProgress, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Grid } from '@mui/material';

// Custom Components
import Sidebar from '../components/Sidebar';
import ErrorDisplay from '../components/common/ErrorDisplay';
import CreateTaskDialog from '../components/tasks/CreateTaskDialog';
import ErrorBoundary from '../components/ErrorBoundary';

// New Dashboard Components
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import WeatherWidget from '../components/dashboard/WeatherWidget';
import TaskSummary from '../components/dashboard/TaskSummary';
import TaskKanbanBoard from '../components/dashboard/TaskKanbanBoard';
import NotesWidget from '../components/dashboard/NotesWidget';
import ActivityFeed from '../components/dashboard/ActivityFeed';

// Custom Hooks
import { useTasks } from '../hooks/useTasks';
import { useErrorHandler } from '../hooks/useErrorHandler';

// Redux and Services
import { AppDispatch, RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { Task, TaskPriority, TaskStatus, TaskContext } from '../types/task';
import axios from '../utils/axios';
import { TaskService } from '../services/task';

const DRAWER_WIDTH = 240;

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch() as AppDispatch;
  const navigate = useNavigate();

  // Authentication state from Redux
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);
  
  // Custom hooks
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWeatherWidget, setShowWeatherWidget] = useState(true);
  const { error, handleError, clearError } = useErrorHandler();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local state
  const [notifications, setNotifications] = useState(3);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [assignTaskDialogOpen, setAssignTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);
  
  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      console.log('Fetching tasks from API...');
      
      // Get the current token
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found, redirecting to login');
        dispatch(logout());
        navigate('/login');
        return;
      }
      
      // Ensure the token is set in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Log the API URL being used
      console.log('Using API URL:', axios.defaults.baseURL);
      
      // Determine if user is admin or general manager (who can see all tasks)
      const isAdminOrManager = user?.role === 'admin' || user?.role === 'general_manager';
      
      // Make the API request with the appropriate parameters based on user role
      console.log('Making request to /api/tasks');
      let params: any = {};
      
      if (isAdminOrManager) {
        // Admin/managers see all tasks
        params.include_all = true;
      } else {
        // Normal users see tasks they created or are assigned to
        // We don't filter here but rely on the backend permissions
      }
      
      const response = await axios.get('/api/tasks', { params });
      console.log('API response for tasks:', response.data);
      console.log('Response status:', response.status);
      
      // Check if the response is valid
      if (Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} tasks from API`);
        
        // Use the standardizeTask function from TaskService
        const mappedTasks = response.data.map(task => TaskService.standardizeTask(task));
        
        console.log('Mapped tasks:', mappedTasks);
        setTasks(mappedTasks);
      } else {
        console.warn('Unexpected response format:', response.data);
        setTasks([]);
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      
      // Check if this is an authentication error
      if (err.response && err.response.status === 401) {
        console.log('Authentication error (401) when fetching tasks');
        handleError('Your session has expired. Please log in again.');
        setTimeout(() => {
          dispatch(logout());
          navigate('/login');
        }, 2000);
      } else {
        handleError(`Failed to load tasks: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError, dispatch, navigate, user]);
  
  // Initial data fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  // Event handlers
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleNotificationClick = () => {
    setNotifications(0);
  };
  
  const handleEditTask = (taskId: string) => {
    const taskToEdit = tasks.find(t => t.id === taskId) || null;
    setSelectedTask(taskToEdit);
    setEditTaskDialogOpen(true);
  };
  
  // Delete task handler
  const deleteTask = async (taskId: string) => {
    try {
      console.log('Deleting task with ID:', taskId);
      await axios.delete(`/api/tasks/${taskId}`);
      await fetchTasks(); // Refresh tasks after deletion
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      handleError('Failed to delete task. Please try again later.');
      return false;
    }
  };
  
  const handleDeleteTask = async () => {
    if (selectedTaskId) {
      try {
        const success = await deleteTask(selectedTaskId);
        if (success) {
          setDeleteDialogOpen(false);
        }
      } catch (err) {
        console.error('Error deleting task:', err);
        handleError('Failed to delete task. Please try again later.');
      }
    }
  };
  
  // Change task status handler
  const changeTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      console.log(`Dashboard: Changing task ${taskId} status to ${status}`);
      // Use the TaskService instead of direct axios call
      await TaskService.changeTaskStatus(taskId, status);
      await fetchTasks(); // Refresh tasks after status change
      return true;
    } catch (err) {
      console.error('Error changing task status in Dashboard:', err);
      handleError('Failed to update task status. Please try again later.');
      return false;
    }
  };
  
  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleHelpClick = () => {
    // Open help documentation or modal
    console.log('Help clicked');
  };
  
  // Main content for the dashboard
  const mainContent = (
    <Box 
      sx={{ 
        height: '100%', 
        overflow: 'visible',
        px: { xs: 0.5, sm: 1 },
        pb: 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {/* Top row with Weather Widget and Task Summary */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: 1,
          }}>
            {/* Weather Widget (conditionally shown) */}
            {showWeatherWidget && (
              <Box sx={{ 
                flexBasis: { xs: '100%', sm: '30%' },
                minWidth: { xs: 'auto', sm: '250px' },
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <WeatherWidget compact={true} />
              </Box>
            )}
            
            {/* Task Summary - always in compact mode */}
            <Box sx={{ 
              flexGrow: 1,
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <TaskSummary tasks={tasks} compact={true} />
            </Box>
          </Box>
        </Grid>
        
        {/* Task Kanban Board - takes remaining space */}
        <Grid item xs={12} sx={{ flexGrow: 1, display: 'flex' }}>
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              p: { xs: 1, sm: 1.5 },
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              bgcolor: 'rgba(255, 255, 255, 0.02)',
              minHeight: '300px', // Minimum height for smaller screens
              height: { xs: 'auto', md: 'calc(100vh - 200px)' }, // Responsive height calculation
              maxHeight: 'calc(100vh - 200px)', // Maximum height to avoid overflow
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <TaskKanbanBoard
                tasks={tasks}
                onCreateTask={(status) => {
                  setInitialTaskStatus(status);
                  setCreateTaskDialogOpen(true);
                }}
                onEditTask={(taskId) => {
                  const taskToEdit = tasks.find(t => t.id === taskId) || null;
                  setSelectedTask(taskToEdit);
                  setEditTaskDialogOpen(true);
                }}
                onDeleteTask={(taskId) => {
                  setSelectedTaskId(taskId);
                  setDeleteDialogOpen(true);
                }}
                onChangeTaskStatus={changeTaskStatus}
              />
            )}
          </Box>
        </Grid>
      </Grid>
      
      {/* Task Dialogs */}
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onClose={() => setCreateTaskDialogOpen(false)}
        onTaskCreated={async () => {
          console.log('Task created, refreshing tasks...');
          await fetchTasks();
          console.log('Tasks refreshed');
        }}
        dialogType="personal"
        initialStatus={initialTaskStatus}
      />
      <CreateTaskDialog
        open={assignTaskDialogOpen}
        onClose={() => setAssignTaskDialogOpen(false)}
        onTaskCreated={async () => {
          console.log('Task created, refreshing tasks...');
          await fetchTasks();
          console.log('Tasks refreshed');
        }}
        dialogType="assign"
        task={selectedTask ? selectedTask : undefined}
      />
      <CreateTaskDialog
        open={editTaskDialogOpen}
        onClose={() => setEditTaskDialogOpen(false)}
        onTaskCreated={async () => {
          console.log('Task created, refreshing tasks...');
          await fetchTasks();
          console.log('Tasks refreshed');
        }}
        dialogType="assign"
        task={selectedTask ? selectedTask : undefined}
      />
    </Box>
  );

  // Right panel content (only shown on larger screens)
  const rightPanelContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      p: isTablet ? 1.5 : 2,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isTablet ? 1.5 : 2,
        height: '100%',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          flexBasis: '45%', 
          flexGrow: 0, 
          minHeight: isTablet ? '200px' : '250px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <ActivityFeed />
        </Box>
        <Box sx={{ 
          flexBasis: '55%', 
          flexGrow: 1, 
          minHeight: isTablet ? '180px' : '200px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <NotesWidget />
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Error Display */}
      <ErrorDisplay error={error} onClear={clearError} />
      
      <ModernDashboardLayout
        disableMainContentScroll={true}
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
        rightPanel={!isMobile && rightPanelContent}
        sidebarOpen={sidebarOpen}
        drawerWidth={DRAWER_WIDTH}
      />
    </>
  );
};

export default Dashboard;
