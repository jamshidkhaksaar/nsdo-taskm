/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMediaQuery, useTheme, CircularProgress, Dialog, Button, Typography, Tabs, Tab, DialogTitle, DialogContent, DialogContentText, DialogActions, Skeleton, Paper } from '@mui/material';
import Box from '@mui/material/Box';

// Custom Components
import ErrorDisplay from '../components/common/ErrorDisplay';
import CreateTaskDialog from '@/components/tasks/CreateTaskDialog';
import TaskViewDialog from '@/components/tasks/TaskViewDialog';
import ErrorBoundary from '@/components/ErrorBoundary';
import EditTaskDialog from '@/components/tasks/EditTaskDialog';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';

// New Dashboard Components
import NotesWidget from '@/components/dashboard/NotesWidget';
import TaskKanbanBoard from '@/components/dashboard/TaskKanbanBoard';

// Layout Components
import Sidebar from '@/components/Sidebar';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';
import ModernDashboardLayout from '@/components/dashboard/ModernDashboardLayout';

// Custom Hooks
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useQuery, useQueryClient } from 'react-query';

// Redux and Services
import { AppDispatch, RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { fetchUsers } from '../store/slices/userSlice';
import { fetchDepartments } from '../store/slices/departmentSlice';
import { fetchProvinces } from '../store/slices/provinceSlice';
import { Task, TaskPriority, TaskStatus, TaskContext, TaskType, DashboardTasksResponse, TaskUpdate } from '../types/task';
import { User } from '../types/user';
import { Department } from '../types/department';
import axios from '@/utils/axios';
import { TaskService } from '@/services/task';
import TasksSection from '@/components/departments/TasksSection'; // Import TasksSection
import { standardBackgroundStyleNoPosition } from '@/utils/backgroundStyles';

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

// Initialize empty dashboard data structure
const initialDashboardData: DashboardTasksResponse = {
  myPersonalTasks: [],
  tasksICreatedForOthers: [],
  tasksAssignedToMe: [],
  tasksDelegatedByMe: [],
  tasksDelegatedToMe: [],
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch() as AppDispatch;
  const navigate = useNavigate();

  // Authentication state from Redux
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);
  const allUsers = useSelector((state: RootState) => state.users.users);
  const allDepartments = useSelector((state: RootState) => state.departments.departments);
  const allProvinces = useSelector((state: RootState) => state.provinces.provinces);

  // Other state declarations...
  const [showWeatherWidget, setShowWeatherWidget] = useState(true);
  const { error, handleError, clearError } = useErrorHandler();

  // --- NEW State for Dashboard Data ---
  const [dashboardData, setDashboardData] = useState<DashboardTasksResponse>(initialDashboardData);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);

  const [notifications, setNotifications] = useState(3);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [viewTaskDialogOpen, setViewTaskDialogOpen] = useState(false);
  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState(0); // State for Tabs
  const [assignTaskDialogOpen, setAssignTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [initialTaskType, setInitialTaskType] = useState<TaskType>(TaskType.USER);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(!isTablet);
  const handleToggleQuickNotes = () => setShowQuickNotes(prev => !prev);

  // Helper functions for name lookups
  const getUserNameById = useCallback((userId: string | null | undefined): string => {
    if (!userId) return '-';
    // Ensure comparison is string-to-string if IDs can be numbers
    const foundUser = allUsers.find(u => String(u.id) === String(userId));
    // Use first/last name if available, otherwise fall back to name or generic placeholder
    return foundUser ? `${foundUser.first_name || ''} ${foundUser.last_name || ''}`.trim() || foundUser.name || 'Unknown User' : `ID: ${userId}`;
  }, [allUsers]);

  // Improved province name lookup function that actually fetches data
  const getProvinceNameById = useCallback((provinceId: string | null | undefined): string => {
    if (!provinceId) return '-';

    // Make sure we're comparing strings to strings
    const stringProvinceId = String(provinceId);
    const foundProvince = allProvinces.find(p => String(p.id) === stringProvinceId);

    if (foundProvince) {
      return foundProvince.name || 'Unknown Province';
    } else {
      console.warn(`[Dashboard] Province NOT found for ID: ${provinceId}`);
      return `ID: ${provinceId}`;
    }
  }, [allProvinces]);

  // --- REFACTORED Fetch Dashboard Tasks ---
  const fetchDashboardTasks = useCallback(async () => {
    if (!user?.id) {
        console.log("[Dashboard] No user ID, skipping task fetch.");
        setLoadingDashboard(false); // Ensure loading stops if no user
        setDashboardData(initialDashboardData); // Clear data if user logs out
        return;
    }

    console.log("[Dashboard] Fetching dashboard data...");
    setLoadingDashboard(true);
    clearError();

    try {
      const data = await TaskService.getDashboardTasks();
      console.log("[Dashboard] Received dashboard data:", data);
      setDashboardData(data || initialDashboardData); // Set data or fallback to initial empty state
    } catch (err: any) {
      console.error('Error fetching dashboard tasks:', err);
      handleError(`Failed to load dashboard tasks: ${err.message || 'Unknown error'}`);
      setDashboardData(initialDashboardData); // Clear data on error
    } finally {
       console.log("[Dashboard] Finished fetching dashboard data.");
       setLoadingDashboard(false); // Set overall loading false after fetch attempt
    }
  // Dependencies: user might change, error handlers
  }, [user, clearError, handleError]);

  // Add the fetch code to the useEffect
  useEffect(() => {
    // First dispatch async fetches to get the necessary data for our lookup functions
    const loadReferenceData = async () => {
        console.log('[Dashboard] Loading reference data...');
        try {
            await Promise.all([
                dispatch(fetchUsers()),
                dispatch(fetchDepartments()),
                dispatch(fetchProvinces())
            ]);
            console.log('[Dashboard] Reference data loaded.');
            return true; // Indicate success
        } catch (refError) {
            console.error('[Dashboard] Failed to load reference data:', refError);
            handleError('Failed to load essential application data. Some features may be unavailable.');
            return false; // Indicate failure
        }
    };

    // Define main data loading sequence
    const loadData = async () => {
        const refDataLoaded = await loadReferenceData();
        if (refDataLoaded) {
            // Only fetch tasks if reference data loaded successfully and user exists
            if (user?.id) {
                 console.log('[Dashboard] Now fetching dashboard tasks...');
                 fetchDashboardTasks();
            } else {
                 console.log('[Dashboard] No user logged in, skipping task fetch after reference data load.');
                 setLoadingDashboard(false); // Ensure loading is false if no user
                 setDashboardData(initialDashboardData); // Clear data
            }
        } else {
            // If reference data failed, don't attempt to load tasks and stop loading indicator
             setLoadingDashboard(false);
        }
    };

    loadData();
  // Dependencies: dispatch is stable, user?.id ensures reload on login/logout, fetchDashboardTasks callback
  }, [dispatch, user?.id, fetchDashboardTasks, handleError]); // Added handleError dependency

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

  // Placeholder handlers for TasksSection props
  // Moved to the main handlers section to avoid duplication

  // Ensure signature matches () => void for EditTaskDialog prop
  const handleTaskUpdated = async (): Promise<void> => {
    console.log('[Dashboard] Task updated, refreshing dashboard data...');
    // Refetch ALL dashboard data after update for consistency
    await fetchDashboardTasks();
  };

  // Moved to the main handlers section to avoid duplication
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
    // TODO: Update this logic to find the task within the new dashboardData structure
    // This might involve searching across multiple arrays (e.g., assignedToMe, delegatedToMe)
    // For now, it might be broken or only find tasks in one specific list if that list is still rendered somewhere.
    // Example placeholder: Find task in 'tasksAssignedToMe' for now
    const taskToEdit = dashboardData.tasksAssignedToMe.find(t => String(t.id) === taskId) || null;
    console.warn("[Dashboard] handleEditTask needs updating for new data structure. Searching in assignedToMe only for now.");
    setSelectedTask(taskToEdit);
    setEditTaskDialogOpen(true);
  };

  // Delete task handler
  const deleteTask = async (taskId: string) => {
    try {
      console.log('Deleting task with ID:', taskId);
      await TaskService.deleteTask(taskId); // Use TaskService for deletion
      fetchDashboardTasks(); // Refresh ALL dashboard data after deletion
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting task:', err);
      handleError('Failed to delete task. Please try again later.');
      // Keep delete dialog open on error? Maybe not.
      // setDeleteDialogOpen(false);
    }
  };

  // Change task status handler - Modified to return Promise<boolean>
  const changeTaskStatus = async (taskId: string, status: TaskStatus): Promise<boolean> => {
    try {
      console.log(`Dashboard: Changing task ${taskId} status to ${status}`);
      await TaskService.changeTaskStatus(taskId, status); // Use TaskService
      await fetchDashboardTasks(); // Refresh ALL dashboard data after status change
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
     // TODO: Find the task across dashboardData lists before updating
     const taskToUpdate = [
         ...dashboardData.myPersonalTasks,
         ...dashboardData.tasksICreatedForOthers,
         ...dashboardData.tasksAssignedToMe,
         ...dashboardData.tasksDelegatedByMe,
         ...dashboardData.tasksDelegatedToMe
     ].find(t => String(t.id) === taskId);

     if (taskToUpdate) {
         const updatedTaskData: TaskUpdate = { // Use TaskUpdate type
             status: newStatus,
             ...(newContext && { context: newContext }), // Add context if provided
         };
         try {
             await TaskService.updateTask(taskId, updatedTaskData); // Use TaskService.updateTask
             fetchDashboardTasks(); // Refetch for consistency
         } catch (error) {
             console.error('Failed to update task status on drop:', error);
             handleError('Failed to update task status.');
         }
     } else {
        console.warn(`[Dashboard] Task ${taskId} not found in dashboard data for drop operation.`);
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

  const handleOpenCreateTaskDialog = (type: TaskType = TaskType.USER, status?: TaskStatus) => {
    console.log(`Opening create task dialog with type: ${type} and status: ${status}`);
    setInitialTaskType(type);
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
    fetchDashboardTasks(); // Refetch tasks when a new one is created
  };

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
            {/* Enhanced Task Sections */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Tasks Assigned To Me */}
              <Paper elevation={0} sx={{ p: 2, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Tasks Assigned To Me</Typography>
                {loadingDashboard ? <CircularProgress size={24} /> :
                  <TasksSection
                    tasks={dashboardData.tasksAssignedToMe}
                    currentUserId={user?.id ? Number(user.id) : 0}
                    currentDepartmentId={0} // Adjust if needed
                    viewMode="assigned"
                    onTaskClick={handleViewTask}
                    onTaskUpdated={handleTaskUpdated}
                  />
                }
              </Paper>

              {/* Tasks I Created/Assigned */}
              <Paper elevation={0} sx={{ p: 2, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Tasks I Created/Assigned</Typography>
                {loadingDashboard ? <CircularProgress size={24} /> :
                  <TasksSection
                    tasks={dashboardData.tasksICreatedForOthers}
                    currentUserId={user?.id ? Number(user.id) : 0}
                    currentDepartmentId={0} // Adjust if needed
                    viewMode="user" // Or a new 'created' mode if needed
                    onTaskClick={handleViewTask}
                    onTaskUpdated={handleTaskUpdated}
                  />
                }
              </Paper>

              {/* My Tasks (Personal) */}
              <Paper elevation={0} sx={{ p: 2, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>My Tasks (Personal)</Typography>
                {loadingDashboard ? <CircularProgress size={24} /> :
                  <TasksSection
                    tasks={dashboardData.myPersonalTasks}
                    currentUserId={user?.id ? Number(user.id) : 0}
                    currentDepartmentId={0} // Adjust if needed
                    viewMode="user" // Or a new 'personal' mode
                    onTaskClick={handleViewTask}
                    onTaskUpdated={handleTaskUpdated}
                    showAddButton={true} // Keep this button specific to personal tasks
                    onAddTask={() => handleOpenCreateTaskDialog(TaskType.PERSONAL)}
                  />
                }
              </Paper>

              {/* Tasks Delegated To Me */}
              <Paper elevation={0} sx={{ p: 2, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Tasks Delegated To Me</Typography>
                {loadingDashboard ? <CircularProgress size={24} /> :
                  <TasksSection
                    tasks={dashboardData.tasksDelegatedToMe}
                    currentUserId={user?.id ? Number(user.id) : 0}
                    currentDepartmentId={0} // Adjust if needed
                    viewMode="assigned" // Or a new 'delegated' mode
                    onTaskClick={handleViewTask}
                    onTaskUpdated={handleTaskUpdated}
                  />
                }
              </Paper>

              {/* Tasks Delegated By Me */}
              <Paper elevation={0} sx={{ p: 2, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Tasks Delegated By Me</Typography>
                {loadingDashboard ? <CircularProgress size={24} /> :
                  <TasksSection
                    tasks={dashboardData.tasksDelegatedByMe}
                    currentUserId={user?.id ? Number(user.id) : 0}
                    currentDepartmentId={0} // Adjust if needed
                    viewMode="user" // Or a new 'delegated' mode
                    onTaskClick={handleViewTask}
                    onTaskUpdated={handleTaskUpdated}
                  />
                }
              </Paper>
            </Box>
          </Box>
        </TabPanel>

        {/* Add TabPanel for Board View index 1 here if needed later */}
        <TabPanel value={activeSubTab} index={1}>
            {/* Placeholder for Board View Content */}
            <Typography sx={{ p: 3, color: '#fff' }}>Board View Content</Typography>
        </TabPanel>

      </Box>
    </>
  );

  // --- Add Correct Main Return --
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      {sidebarElement}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {topBarElement}
        {/* Add padding or specific layout adjustments for main content if needed */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0 /* Adjust padding as needed */ }}>
            {mainContentElement}
        </Box>
        {/* Right Sidebar / Quick Notes logic can be added here if needed */}
      </Box>
      {/* Render Dialogs */}
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onClose={handleCloseCreateTaskDialog}
        onTaskCreated={handleTaskCreated}
        initialStatus={initialTaskStatus}
        initialType={initialTaskType}
        dialogType='assign'
      />
      <EditTaskDialog
        open={editTaskDialogOpen}
        onClose={handleCloseEditTaskDialog}
        onTaskUpdated={handleTaskUpdated}
        taskId={selectedTaskId}
      />
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={() => deleteTask(selectedTaskId)}
        title="Confirm Deletion"
        message="Are you sure you want to delete this task?"
      />
    </Box>
  );
};

export default Dashboard;
