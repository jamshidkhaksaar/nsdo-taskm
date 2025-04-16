/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMediaQuery, useTheme, CircularProgress, Dialog, Button, Typography, Tabs, Tab, DialogTitle, DialogContent, DialogContentText, DialogActions, Skeleton, Paper, Snackbar, Alert, AlertColor, Fab, Collapse, CardHeader, IconButton, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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
import { Task, TaskPriority, TaskStatus, TaskType, DashboardTasksResponse, TaskUpdate, User, Department } from '../types/index';
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

// Define identifiers for task sections
type TaskSectionId = 'assigned' | 'created' | 'personal' | 'delegatedTo' | 'delegatedBy';

// Define structure for section configuration
interface TaskSectionConfig {
  id: TaskSectionId;
  title: string;
  tasks: Task[];
  color: string; // Subtle background color
  showAddButton?: boolean;
  addTaskType?: TaskType;
  viewMode: 'assigned' | 'user'; // Simplified viewMode for TasksSection
}

// Define subtle colors for sections
const SECTION_COLORS: Record<TaskSectionId, string> = {
  assigned: 'rgba(100, 181, 246, 0.08)', // Light Blue tint
  created: 'rgba(229, 115, 115, 0.08)', // Light Red tint
  personal: 'rgba(129, 199, 132, 0.08)', // Light Green tint
  delegatedTo: 'rgba(255, 171, 145, 0.08)', // Light Orange tint
  delegatedBy: 'rgba(149, 117, 205, 0.08)', // Light Purple tint
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
  const [showQuickNotes, setShowQuickNotes] = useState<boolean>(() => {
    const saved = localStorage.getItem('quickNotesVisibleState');
    return saved !== null ? JSON.parse(saved) : false; 
  });
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [assignTaskDialogOpen, setAssignTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [initialTaskType, setInitialTaskType] = useState<TaskType>(TaskType.USER);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebarOpenState');
    return saved !== null ? JSON.parse(saved) : true; 
  });
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(!isTablet);

  // --- Snackbar State ---
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');

  // --- State for Collapsible/Reorderable Sections ---
  const initialSectionOrder: TaskSectionId[] = ['assigned', 'created', 'personal', 'delegatedTo', 'delegatedBy'];
  const [sectionOrder, setSectionOrder] = useState<TaskSectionId[]>(initialSectionOrder);
  const [collapsedSections, setCollapsedSections] = useState<Record<TaskSectionId, boolean>>(
    () => initialSectionOrder.reduce((acc, id) => { acc[id] = false; return acc; }, {} as Record<TaskSectionId, boolean>)
  );

  // --- Persistence Logic ---
  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('dashboardSectionOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        // Basic validation
        if (Array.isArray(parsedOrder) && parsedOrder.every(id => initialSectionOrder.includes(id))) {
          setSectionOrder(parsedOrder);
        } else {
          localStorage.removeItem('dashboardSectionOrder'); // Clear invalid
        }
      } catch { localStorage.removeItem('dashboardSectionOrder'); }
    }

    const savedCollapsed = localStorage.getItem('dashboardCollapsedSections');
    if (savedCollapsed) {
      try {
        const parsedCollapsed = JSON.parse(savedCollapsed);
        // Basic validation (check if it's an object)
        if (typeof parsedCollapsed === 'object' && parsedCollapsed !== null) {
            // Ensure all keys exist, default to false if needed
            const initialCollapsed = initialSectionOrder.reduce((acc, id) => {
                acc[id] = parsedCollapsed[id] === true; // Ensure boolean, default false
                return acc;
            }, {} as Record<TaskSectionId, boolean>);
             setCollapsedSections(initialCollapsed);
        } else {
            localStorage.removeItem('dashboardCollapsedSections');
        }
      } catch { localStorage.removeItem('dashboardCollapsedSections'); }
    } else {
        // Default all sections to open if nothing saved
        const initialCollapsed = initialSectionOrder.reduce((acc, id) => {
            acc[id] = false;
            return acc;
        }, {} as Record<TaskSectionId, boolean>);
        setCollapsedSections(initialCollapsed);
    }

  }, []); // Empty dependency array means run only on mount

  // Save order to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dashboardSectionOrder', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dashboardCollapsedSections', JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  // Save Sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpenState', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Save QuickNotes state to localStorage
  useEffect(() => {
    // Log state change before saving
    console.log('[Dashboard] Saving quickNotesVisible to localStorage:', showQuickNotes);
    localStorage.setItem('quickNotesVisibleState', JSON.stringify(showQuickNotes));
  }, [showQuickNotes]);

  // Handler to toggle section collapse
  const handleToggleCollapse = (sectionId: TaskSectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Handler for Drag and Drop end
  const onSectionDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    // Dropped outside the list or no movement
    if (!destination || destination.index === source.index) {
      return;
    }

    const newOrder = Array.from(sectionOrder);
    const [reorderedItem] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, reorderedItem);

    setSectionOrder(newOrder);
  };

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

  // Combined task lists for consolidated view
  const tasksRequiringAction = useMemo(() => [
    ...(dashboardData.tasksAssignedToMe || []),
    ...(dashboardData.tasksDelegatedToMe || [])
  ], [dashboardData.tasksAssignedToMe, dashboardData.tasksDelegatedToMe]);

  const tasksManagedByMe = useMemo(() => [
    ...(dashboardData.tasksICreatedForOthers || []),
    ...(dashboardData.tasksDelegatedByMe || [])
  ], [dashboardData.tasksICreatedForOthers, dashboardData.tasksDelegatedByMe]);

  // Filter and combine tasks for the Kanban board view
  const boardTasks = useMemo(() => {
    const allRelevantTasks: Task[] = [
      ...(dashboardData.myPersonalTasks || []),
      ...(dashboardData.tasksAssignedToMe || []),
      ...(dashboardData.tasksDelegatedToMe || []),
      // Potentially add tasks assigned to user's department here if not included above
      // Example: ...(allTasks.filter(t => t.assignedToDepartmentIds?.includes(user.department.id)))
    ];

    // Remove duplicates based on task ID
    const uniqueTasks = Array.from(new Map(allRelevantTasks.map(task => [task.id, task])).values());

    return uniqueTasks;
  }, [dashboardData]);

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
    // Search all dashboardData lists for the task
    const taskToEdit =
      [
        ...dashboardData.myPersonalTasks,
        ...dashboardData.tasksICreatedForOthers,
        ...dashboardData.tasksAssignedToMe,
        ...dashboardData.tasksDelegatedByMe,
        ...dashboardData.tasksDelegatedToMe,
      ].find(t => String(t.id) === taskId) || null;
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

  // --- Snackbar Helper ---
  const showSnackbar = (message: string, severity: AlertColor = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // --- Update Handlers to Show Snackbar ---
  const changeTaskStatus = async (taskId: string, status: TaskStatus): Promise<boolean> => {
    try {
      console.log(`Dashboard: Changing task ${taskId} status to ${status}`);
      await TaskService.changeTaskStatus(taskId, status);
      await fetchDashboardTasks();
      // Show success notification
      showSnackbar(`Task moved to ${status.replace('_', ' ')}`, 'success');
      return true;
    } catch (err) {
      console.error('Error changing task status in Dashboard:', err);
      handleError('Failed to update task status. Please try again later.');
      // Show error notification
      showSnackbar('Failed to update task status', 'error');
      return false;
    }
  };

  const handleTaskCreated = () => {
    fetchDashboardTasks();
    // Show success notification
    showSnackbar('Task created successfully!', 'success');
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Corrected handleTaskDrop signature
  const handleTaskDrop = async (taskId: string, newStatus: TaskStatus) => {
    console.log(`[Dashboard] Task ${taskId} dropped onto ${newStatus}`);
    setLoadingDashboard(true); // Show loading indicator
    try {
      const success = await changeTaskStatus(taskId, newStatus);
      if (success) {
        console.log(`[Dashboard] Status changed for ${taskId}, refreshing data...`);
        // Re-fetch might be too slow, optimistically update local state first
        // Find the task and update its status in the local dashboardData
        const updateTaskLocally = (taskCategory: keyof DashboardTasksResponse, id: string, status: TaskStatus) => {
            const tasks = dashboardData[taskCategory];
            if (!tasks) return false;
            const taskIndex = tasks.findIndex(t => t.id === id);
            if (taskIndex > -1) {
                const updatedTasks = [...tasks];
                updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: status };
                setDashboardData(prev => ({ ...prev, [taskCategory]: updatedTasks }));
                return true;
            }
            return false;
        };

        let updated = false;
        if (updateTaskLocally('myPersonalTasks', taskId, newStatus)) updated = true;
        if (updateTaskLocally('tasksAssignedToMe', taskId, newStatus)) updated = true;
        if (updateTaskLocally('tasksDelegatedToMe', taskId, newStatus)) updated = true;
        // Note: We probably shouldn't allow dropping tasks from 'managed' lists

        if (!updated) {
            // If task not found in expected lists, fall back to full refresh
            await fetchDashboardTasks();
        } else {
             // If updated locally, stop the main loading indicator sooner
             setLoadingDashboard(false);
             // Still consider a background refresh for full consistency
             // queryClient.invalidateQueries('dashboardTasks'); // If using react-query
        }

      } else {
        console.error(`[Dashboard] Failed to change status for ${taskId}`);
        handleError('Failed to update task status.');
        setLoadingDashboard(false);
      }
    } catch (err: any) { // Catch potential errors from changeTaskStatus
      console.error(`[Dashboard] Error during task drop status change:`, err);
      handleError(`Error updating task status: ${err.message || 'Unknown error'}`);
      setLoadingDashboard(false);
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

  // --- Prepare Section Data Structure ---
  const allSections: TaskSectionConfig[] = useMemo(() => [
    {
      id: 'assigned',
      title: 'Tasks Assigned To Me',
      tasks: dashboardData.tasksAssignedToMe,
      color: SECTION_COLORS.assigned,
      viewMode: 'assigned'
    },
    {
      id: 'created',
      title: 'Tasks I Created/Assigned',
      tasks: dashboardData.tasksICreatedForOthers,
      color: SECTION_COLORS.created,
      viewMode: 'user'
    },
    {
      id: 'personal',
      title: 'My Tasks (Personal)',
      tasks: dashboardData.myPersonalTasks,
      color: SECTION_COLORS.personal,
      showAddButton: true,
      addTaskType: TaskType.PERSONAL,
      viewMode: 'user'
    },
    {
      id: 'delegatedTo',
      title: 'Tasks Delegated To Me',
      tasks: dashboardData.tasksDelegatedToMe,
      color: SECTION_COLORS.delegatedTo,
      viewMode: 'assigned'
    },
    {
      id: 'delegatedBy',
      title: 'Tasks Delegated By Me',
      tasks: dashboardData.tasksDelegatedByMe,
      color: SECTION_COLORS.delegatedBy,
      viewMode: 'user'
    },
  ], [dashboardData]);

  // Map section data based on the current order
  const orderedSections = useMemo(() => {
      return sectionOrder.map(id => allSections.find(section => section.id === id)).filter(Boolean) as TaskSectionConfig[];
  }, [sectionOrder, allSections]);

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
      username={user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'User' : 'User'}
      notificationCount={notifications}
      onToggleSidebar={handleToggleSidebar}
      onNotificationClick={() => console.log('Notifications clicked')}
      onLogout={handleLogout}
      onProfileClick={handleProfileClick}
      onSettingsClick={handleSettingsClick}
      onHelpClick={handleHelpClick}
      onToggleTopWidgets={handleToggleTopWidgets}
      topWidgetsVisible={topWidgetsVisible}
      rightSidebarVisible={rightSidebarVisible}
      onToggleRightSidebar={() => setRightSidebarVisible(p => !p)}
      onToggleQuickNotes={handleToggleQuickNotes}
      showQuickNotes={showQuickNotes}
      showQuickNotesButton={true}
    />
  );

  const mainContentElement = (
    <>
      {/* Tabs Container */}
      <Box sx={{ 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        bgcolor: 'rgba(255, 255, 255, 0.03)',
        px: 2, 
        borderBottom: '1px solid', 
        borderColor: 'rgba(255, 255, 255, 0.1)' 
      }}>
        <Tabs
          value={activeSubTab}
          onChange={(_, newValue) => setActiveSubTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Task Views"
          sx={{
            color: '#fff',
            flexGrow: 1,
            '& .MuiTabs-indicator': {
               backgroundColor: theme.palette.primary.main,
            },
            '& .Mui-selected': {
              color: '#fff', 
            },
            '& .MuiTab-root': {
               color: 'rgba(255, 255, 255, 0.7)', 
               '&.Mui-selected': {
                 color: '#fff',
               },
            }
          }}
        >
          <Tab label="Task List" {...a11yProps(0)} />
          <Tab label="Board View" {...a11yProps(1)} />
        </Tabs>
        {/* Add Task Button */} 
        {activeSubTab === 1 && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCreateTaskDialog(TaskType.PERSONAL)}
            sx={{
              ml: 2,
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            Add Task
          </Button>
        )}
      </Box>

      {/* Tab Panels Container */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <TabPanel value={activeSubTab} index={0}>
          <DragDropContext onDragEnd={onSectionDragEnd}>
            <Droppable droppableId="taskListSections">
              {(provided) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  {loadingDashboard ? (
                    // Show skeletons if loading
                    <> 
                      <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 2 }} />
                      <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                      <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                    </>
                  ) : (
                    // Map over ordered sections
                    orderedSections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(providedDraggable) => (
                          <Paper
                            ref={providedDraggable.innerRef as React.RefObject<HTMLDivElement>}
                            {...providedDraggable.draggableProps}
                            elevation={0}
                            sx={{ 
                              background: section.color, 
                              borderRadius: 2,
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            {/* Section Header */}
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                p: 1, 
                                cursor: 'pointer',
                                borderBottom: collapsedSections[section.id] ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                              onClick={() => handleToggleCollapse(section.id)}
                            >
                              {/* Drag Handle */}
                              <Box 
                                {...providedDraggable.dragHandleProps} 
                                sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.4)', mr: 1, cursor: 'grab' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DragIndicatorIcon fontSize='small' />
                              </Box>
                              {/* Title */}
                              <Typography variant="h6" sx={{ color: '#fff', flexGrow: 1, fontSize: '1rem' }}>
                                {section.title}
                              </Typography>
                              {/* Add Task Button (Personal Section Only) */}
                              {section.showAddButton && (
                                <Tooltip title="Add Personal Task">
                                  <IconButton 
                                     size="small"
                                     onClick={(e) => { 
                                        e.stopPropagation(); 
                                        handleOpenCreateTaskDialog(TaskType.PERSONAL);
                                     }}
                                     sx={{ color: '#fff', mr: 1 }}
                                  >
                                    <AddIcon fontSize='small'/>
                                  </IconButton>
                                </Tooltip>
                              )}
                              {/* Collapse Toggle Icon */}
                              <IconButton 
                                size="small" 
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  handleToggleCollapse(section.id);
                                }}
                                sx={{ color: '#fff' }}
                              >
                                {collapsedSections[section.id] ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                              </IconButton>
                            </Box>

                            {/* Collapsible Content */}
                            <Collapse in={!collapsedSections[section.id]} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 1 }}>
                                <TasksSection
                                  tasks={section.tasks}
                                  currentUserId={user?.id ? Number(user.id) : 0}
                                  currentDepartmentId={0}
                                  viewMode={section.viewMode}
                                  onTaskClick={handleViewTask}
                                  onTaskUpdated={handleTaskUpdated}
                                />
                              </Box>
                            </Collapse>
                          </Paper>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </TabPanel>

        <TabPanel value={activeSubTab} index={1}>
          {/* Board View Content */}
          <Box sx={{ pt: 2, height: '100%', overflow: 'hidden' }}> 
            <TaskKanbanBoard
              tasks={boardTasks}
              onTaskStatusChange={changeTaskStatus}
              onTaskClick={handleViewTask}
              loading={loadingDashboard}
              currentUser={user as User | null}
            />
          </Box>
        </TabPanel>
      </Box>
    </>
  );

  // --- Main Return ---
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }

  // Log state just before rendering the layout
  console.log('[Dashboard] Rendering layout, showQuickNotes:', showQuickNotes);

  // Restore the main return statement for the Dashboard component
  return (
    <>
      <ModernDashboardLayout
        sidebar={sidebarElement}
        topBar={topBarElement}
        mainContent={mainContentElement}
        sidebarOpen={sidebarOpen}
        drawerWidth={DRAWER_WIDTH}
        quickNotesPanel={<NotesWidget />}
        quickNotesVisible={showQuickNotes}
      />
      {/* Render Dialogs OUTSIDE/SIBLING to the ModernDashboardLayout */}
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
        taskId={selectedTask?.id || ''} 
      />
       <TaskViewDialog
        open={viewTaskDialogOpen}
        onClose={() => setViewTaskDialogOpen(false)}
        taskId={selectedTask?.id || ''}
        onEdit={handleEditTask}
        onDelete={handleOpenDeleteDialog}
        onChangeStatus={changeTaskStatus}
      />
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={() => deleteTask(selectedTaskId)}
        title="Confirm Deletion"
        message="Are you sure you want to delete this task?"
      />

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Dashboard; 