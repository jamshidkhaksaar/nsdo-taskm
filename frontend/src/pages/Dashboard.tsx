/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Box, useMediaQuery, useTheme } from '@mui/material';

// Custom Components
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
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
import { Task } from '../types/task';
import { useMockTaskContext } from '../contexts/MockTaskContext';

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
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [showWeatherWidget, setShowWeatherWidget] = useState(true);
  const { error, handleError, clearError } = useErrorHandler();
  const { tasks, loading, error: mockError, refreshTasks: fetchTasks, deleteTask } = useMockTaskContext();
  
  // Local state
  const [notifications, setNotifications] = useState(3);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [assignTaskDialogOpen, setAssignTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);
  
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
  
  const handleDeleteTask = async () => {
    if (selectedTaskId) {
      try {
        const success = await deleteTask(selectedTaskId);
        if (success) {
          setDeleteDialogOpen(false);
          // No need to call fetchTasks as it's handled in the deleteTask function
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
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
        px: { xs: 1, sm: 2 },
        pb: 2
      }}
    >
      <Container 
        maxWidth="xl" 
        disableGutters 
        sx={{ 
          py: isSmallScreen ? 1 : 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Weather Widget (conditionally shown) */}
        {showWeatherWidget && (
          <Box sx={{ 
            mb: isSmallScreen ? 1 : 2,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <WeatherWidget compact={isSmallScreen} />
          </Box>
        )}
        
        {/* Task Summary - use compact mode on mobile */}
        <Box sx={{ 
          mb: isSmallScreen ? 1 : 2,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <TaskSummary tasks={tasks} compact={isMobile || isTablet} />
        </Box>
        
        {/* Task Kanban Board - takes remaining space */}
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            overflow: 'auto',
            height: '100%'
          }}
        >
          <TaskKanbanBoard
            onCreateTask={(status) => {
              setInitialTaskStatus(status);
              setTaskDialogOpen(true);
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
          />
        </Box>
        
        {/* Task Dialogs */}
        <CreateTaskDialog
          open={createTaskDialogOpen}
          onClose={() => setCreateTaskDialogOpen(false)}
          onTaskCreated={fetchTasks}
          dialogType="personal"
        />
        <CreateTaskDialog
          open={assignTaskDialogOpen}
          onClose={() => setAssignTaskDialogOpen(false)}
          onTaskCreated={fetchTasks}
          dialogType="assign"
          task={selectedTask ? selectedTask : undefined}
        />
        <CreateTaskDialog
          open={editTaskDialogOpen}
          onClose={() => setEditTaskDialogOpen(false)}
          onTaskCreated={fetchTasks}
          dialogType="assign"
          task={selectedTask ? selectedTask : undefined}
        />
      </Container>
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
        footer={<Footer open={sidebarOpen} drawerWidth={DRAWER_WIDTH} />}
        sidebarOpen={sidebarOpen}
        drawerWidth={DRAWER_WIDTH}
      />
    </>
  );
};

export default Dashboard;
