/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { Box, useMediaQuery, useTheme, CircularProgress, Dialog, Button, Typography, Tabs, Tab, DialogTitle, DialogContent, DialogContentText, DialogActions, Skeleton } from '@mui/material';

// Custom Components
import ErrorDisplay from '../components/common/ErrorDisplay';
import CreateTaskDialog from '../components/tasks/CreateTaskDialog';
import TaskViewDialog from '../components/tasks/TaskViewDialog';
import ErrorBoundary from '../components/ErrorBoundary';

// New Dashboard Components
import NotesWidget from '../components/dashboard/NotesWidget';
import TaskKanbanBoard from '../components/dashboard/TaskKanbanBoard';

// Layout Components
import Sidebar from '../components/Sidebar';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';

// Custom Hooks
import { useTasks } from '../hooks/useTasks';
import { useErrorHandler } from '../hooks/useErrorHandler';

// Redux and Services
import { AppDispatch, RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { Task, TaskPriority, TaskStatus, TaskContext } from '../types/task';
import axios from '../utils/axios';
import { TaskService } from '../services/task';
import { standardBackgroundStyleNoPosition } from '../utils/backgroundStyles';

// Interface for TabPanel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}> 
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

// Constants
const DRAWER_WIDTH = 240;
const RIGHT_SIDEBAR_WIDTH = 300;

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch() as AppDispatch;
  const navigate = useNavigate();

  // Authentication state from Redux
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);
  
  // Other state declarations...
  const [showWeatherWidget, setShowWeatherWidget] = useState(true); 
  const { error, handleError, clearError } = useErrorHandler();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(3);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [viewTaskDialogOpen, setViewTaskDialogOpen] = useState(false);
  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [assignTaskDialogOpen, setAssignTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleToggleQuickNotes = () => setShowQuickNotes(prev => !prev);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(!isTablet);
  
  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      console.log('Fetching tasks from API...');
      
      // Get the current token
      const currentToken = localStorage.getItem('access_token');
      if (!currentToken) {
        console.warn('No access token found, redirecting to login');
        return;
      }
      
      // Ensure the token is set in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      
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
        
        console.log('Mapped tasks after fetch:', mappedTasks);
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
      } else {
        handleError(`Failed to load tasks: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError, user]);
  
  // Initial data fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  // Event handlers
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  // --- Sidebar and Widget Toggle Handlers ---
  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleToggleTopWidgets = useCallback(() => {
    setTopWidgetsVisible(prev => !prev);
  }, []);

  const handleToggleRightSidebar = useCallback(() => {
    setRightSidebarVisible(prev => !prev);
  }, []);

  // Placeholder for notification click
  const handleNotificationClick = useCallback(() => {
    console.log("Notification icon clicked");
    // TODO: Implement notification panel logic
  }, []);
  // --- End Sidebar and Widget Toggle Handlers ---

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
      fetchTasks(); // Refresh tasks after deletion
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting task:', err);
      handleError('Failed to delete task. Please try again later.');
    }
  };
  
  // Change task status handler - Modified to return Promise<boolean>
  const changeTaskStatus = async (taskId: string, status: TaskStatus): Promise<boolean> => {
    try {
      console.log(`Dashboard: Changing task ${taskId} status to ${status}`);
      await TaskService.changeTaskStatus(taskId, status);
      await fetchTasks(); // Refresh tasks after status change
      return true; // Indicate success
    } catch (err) {
      console.error('Error changing task status in Dashboard:', err);
      handleError('Failed to update task status. Please try again later.');
      return false; // Indicate failure
    }
  };
  
  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleHelpClick = () => {
    // Implement help action (e.g., open documentation, chat)
    console.log('Help clicked');
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleTaskDrop = async (taskId: string, newStatus: TaskStatus, newContext?: TaskContext) => {
    console.log(`Task ${taskId} dropped onto ${newStatus} in context ${newContext}`);
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (taskToUpdate) {
      const updatedTask: Task = {
        ...taskToUpdate,
        status: newStatus,
        ...(newContext && { context: newContext }), // Add context if provided
      };
      try {
        await axios.put(`/api/tasks/${taskId}`, updatedTask);
        fetchTasks(); // Refetch for consistency
      } catch (error) {
        console.error('Failed to update task status on drop:', error);
        handleError('Failed to update task status.');
      }
    }
  };

  // --- Dialog Close Handlers ---
  const handleCloseCreateTaskDialog = () => setCreateTaskDialogOpen(false);
  const handleCloseEditTaskDialog = () => setEditTaskDialogOpen(false);
  const handleCloseDeleteDialog = () => setDeleteDialogOpen(false);
  // --- End Dialog Close Handlers ---

  // --- Dialog Open Handlers ---
  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setViewTaskDialogOpen(true);
    setEditTaskDialogOpen(false); // Ensure edit dialog is closed
  };

  const handleOpenCreateTaskDialog = (status?: TaskStatus) => {
    setInitialTaskStatus(status || TaskStatus.PENDING);
    setCreateTaskDialogOpen(true);
  };

  const handleOpenDeleteDialog = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDeleteDialogOpen(true);
  };
  // --- End Dialog Open Handlers ---

  // --- Task Created/Updated Callbacks ---
  const handleTaskCreated = () => {
    fetchTasks(); // Refetch tasks when a new one is created
  };

  const handleTaskUpdated = () => { // Added missing handler
    fetchTasks(); // Refetch tasks when one is updated
  };
  // --- End Task Created/Updated Callbacks ---

  // --- Render Logic ---
  if (loading && tasks.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // --- Define Layout Elements ---
  const sidebarElement = (
    <Sidebar
      open={sidebarOpen}
      onToggleDrawer={handleToggleSidebar}
      drawerWidth={DRAWER_WIDTH}
      onLogout={handleLogout}
    />
  );

  const topBarElement = (
    <DashboardTopBar
      username={user?.username || 'User'}
      notificationCount={notifications}
      onToggleSidebar={handleToggleSidebar} // For hamburger menu
      onNotificationClick={handleNotificationClick}
      onLogout={handleLogout}
      onProfileClick={handleProfileClick}
      onSettingsClick={handleSettingsClick}
      onHelpClick={handleHelpClick}
      onToggleTopWidgets={handleToggleTopWidgets}
      topWidgetsVisible={topWidgetsVisible}
      rightSidebarVisible={rightSidebarVisible}
      onToggleRightSidebar={handleToggleRightSidebar}
      onToggleQuickNotes={handleToggleQuickNotes}
      showQuickNotes={showQuickNotes}
    />
  );

  const mainContentElement = (
    <>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>

        <Tabs
          value={activeSubTab}
          onChange={(_, newValue) => setActiveSubTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Task Views"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            color: '#fff',
            '& .Mui-selected': {
              color: '#fff',
            },
          }}
        >
          <Tab label="Task List" {...a11yProps(0)} sx={{ color: '#fff' }} />
          <Tab label="Board View" {...a11yProps(1)} sx={{ color: '#fff' }} />
        </Tabs>

        <TabPanel value={activeSubTab} index={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Task List</Typography>
            {loading ? (
              <Box>
                <Skeleton
                  variant="text"
                  width={200}
                  height={40}
                  animation="wave"
                  sx={{ '& .MuiSkeleton-wave': { animationDuration: '3s' } }}
                />
                {[...Array(3)].map((_, idx) => (
                  <Skeleton
                    key={idx}
                    variant="rectangular"
                    width="100%"
                    height={40}
                    animation="wave"
                    sx={{ '& .MuiSkeleton-wave': { animationDuration: '3s' }, my: 1 }}
                  />
                ))}
              </Box>
            ) : tasks.length === 0 ? (
              <Typography>No tasks found.</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#fff' }}>TITLE</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#fff' }}>STATUS</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#fff' }}>ASSIGNED TO</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#fff' }}>DEPARTMENT</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#fff' }}>PROVINCE</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#fff' }}>DUE DATE</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#fff' }}>CREATED BY</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#fff' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const createdByStr = String(
                        task.created_by === null
                          ? '-'
                          : typeof task.created_by === 'object'
                            ? (task.created_by as any).name ?? JSON.stringify(task.created_by)
                            : typeof task.created_by === 'string'
                              ? task.created_by
                              : '-'
                      );
                      const assignedToStr = String(
                        Array.isArray(task.assigned_to)
                          ? task.assigned_to.join(', ')
                          : typeof task.assigned_to === 'object' && task.assigned_to !== null
                            ? (task.assigned_to as any).name ?? JSON.stringify(task.assigned_to)
                            : typeof task.assigned_to === 'string'
                              ? task.assigned_to
                              : '-'
                      );
                      return (
                        <tr key={task.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '8px', color: '#fff' }}>
                            <strong>{task.title}</strong>
                          </td>
                          <td style={{ padding: '8px', color: '#fff' }}>
                            <span style={{
                              backgroundColor: 'rgba(255, 193, 7, 0.2)',
                              color: '#ffc107',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.8rem'
                            }}>
                              {task.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px', color: '#fff' }}>{assignedToStr}</td>
                          <td style={{ padding: '8px', color: '#fff' }}>
                            {typeof task.department === 'string'
                              ? task.department
                              : task.department?.name || '-'}
                          </td>
                          <td style={{ padding: '8px', color: '#fff' }}>-</td>
                          <td style={{ padding: '8px', color: '#fff' }}>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                          </td>
                          <td style={{ padding: '8px', color: '#fff' }}>{createdByStr}</td>
                          <td style={{ padding: '8px' }}>
                            <span
                              style={{ color: 'blue', cursor: 'pointer', marginRight: '8px' }}
                              onClick={() => handleViewTask(task)}
                            >
                              View
                            </span>
                            <span style={{ color: 'green', cursor: 'pointer', marginRight: '8px' }} onClick={() => handleEditTask(task.id)}>Edit</span>
                            <span style={{ color: 'red', cursor: 'pointer' }} onClick={() => handleOpenDeleteDialog(task.id)}>Delete</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeSubTab} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Board View</Typography>
            <TaskKanbanBoard
              tasks={tasks}
              onEditTask={handleEditTask}
              onDeleteTask={handleOpenDeleteDialog}
              onChangeTaskStatus={changeTaskStatus}
              onCreateTask={handleOpenCreateTaskDialog}
            />
          </Box>
        </TabPanel>
      </Box>

      <ErrorBoundary>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 0 }}> {/* Ensure column flex and height */}
          {/* Top Tabs */}
    
          {/* Tab Panels - Ensure they take remaining space */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', height: 'calc(100% - 49px)' }}> {/* Adjusted height calculation */}
            {/* Overview Tab */}
    
            {/* Kanban Board Tab */}
    
            {/* Analytics Tab */}
          </Box>
    
          {/* Dialogs */}
          <CreateTaskDialog
            open={createTaskDialogOpen}
            onClose={handleCloseCreateTaskDialog}
            onTaskCreated={handleTaskCreated}
            initialStatus={initialTaskStatus}
            dialogType="personal"
          />
    
          {/* Edit Task Dialog - Corrected */}
          {selectedTask && editTaskDialogOpen && (
            <CreateTaskDialog
              open={editTaskDialogOpen}
              onClose={handleCloseEditTaskDialog}
              task={selectedTask}
              onTaskCreated={handleTaskCreated}
              onTaskUpdated={handleTaskUpdated}
              initialStatus={selectedTask.status}
              dialogType="personal"
            />
          )}
    
          <TaskViewDialog
            open={viewTaskDialogOpen}
            onClose={() => setViewTaskDialogOpen(false)}
            task={selectedTask!}
          />

          <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete this task? This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
              <Button onClick={() => {
                if (selectedTaskId) {
                  deleteTask(selectedTaskId);
                } else {
                  console.error("No task selected for deletion");
                  handleError("Could not delete task: No task selected.");
                  handleCloseDeleteDialog();
                }
              }} color="error" autoFocus>
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </ErrorBoundary>
    </>
  );

  const rightPanelElement = (
    showQuickNotes && <NotesWidget />
  );

  // Check if authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; 
  }

  // If authenticated, render the main layout
  return (
    <ModernDashboardLayout
      sidebar={sidebarElement}
      topBar={topBarElement}
      mainContent={mainContentElement}
      rightPanel={rightSidebarVisible ? rightPanelElement : undefined}
      sidebarOpen={sidebarOpen}
      drawerWidth={DRAWER_WIDTH}
      disableMainContentScroll={currentTab === 1}
    />
  );
};

export default Dashboard;
