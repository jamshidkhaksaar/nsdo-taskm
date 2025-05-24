/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMediaQuery, useTheme, CircularProgress, Dialog, Button, Typography, Tabs, Tab, DialogTitle, DialogContent, DialogContentText, DialogActions, Skeleton, Paper, Snackbar, Alert, AlertColor, Fab, Collapse, CardHeader, IconButton, Tooltip, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
// Icon Imports for Task Sections
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'; 
import CreateIcon from '@mui/icons-material/Create';             
import PersonIcon from '@mui/icons-material/Person';             
import BusinessIcon from '@mui/icons-material/Business';         
import ForwardIcon from '@mui/icons-material/Forward';           
import SendIcon from '@mui/icons-material/Send';                 
import Chip from '@mui/material/Chip'; // Import Chip
import Stack from '@mui/material/Stack'; // Import Stack for layout
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
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  tasksAssignedToMyDepartments: [],
  tasksDelegatedByMe: [],
  tasksDelegatedToMe: [],
};

// Define identifiers for task sections
type TaskSectionId = 'assigned' | 'created' | 'personal' | 'myDepartments' | 'delegatedTo' | 'delegatedBy';

// Define structure for section configurationinterface TaskSectionConfig {  id: TaskSectionId;  title: string;  tasks: Task[];  color: string; // Subtle background color  showAddButton?: boolean;  addTaskType?: TaskType;  departmentName?: string; // Optional: For dynamic title  description?: string; // Description of what tasks are included in this section}// Define subtle colors for sections
const SECTION_COLORS: Record<TaskSectionId, string> = {
  assigned: 'rgba(100, 181, 246, 0.08)', // Light Blue tint
  created: 'rgba(229, 115, 115, 0.08)', // Light Red tint
  personal: 'rgba(129, 199, 132, 0.08)', // Light Green tint
  myDepartments: 'rgba(255, 215, 64, 0.08)', // Example: Light Gold tint
  delegatedTo: 'rgba(255, 171, 145, 0.08)', // Light Orange tint
  delegatedBy: 'rgba(149, 117, 205, 0.08)', // Light Purple tint
};

// Define the initial order array directly for reference
const initialSectionOrder: TaskSectionId[] = ['assigned', 'myDepartments', 'created', 'personal', 'delegatedTo', 'delegatedBy'];

// --- Persistence Logic --- START ---

// Function to load initial section order
const getInitialSectionOrder = (): TaskSectionId[] => {
  const savedOrder = localStorage.getItem('dashboardSectionOrder');
  const currentDefaultOrder = [...initialSectionOrder]; // Use the updated default

  if (savedOrder) {
    try {
      const parsed = JSON.parse(savedOrder) as TaskSectionId[];
      // Validate saved order against the *current* default set
      if (Array.isArray(parsed) && parsed.length === currentDefaultOrder.length && parsed.every(id => currentDefaultOrder.includes(id)) && currentDefaultOrder.every(id => parsed.includes(id))) {
        return parsed;
      } else {
         console.warn('[Dashboard] Saved order mismatch or invalid, resetting to defaults.');
         localStorage.setItem('dashboardSectionOrder', JSON.stringify(currentDefaultOrder)); // Save the correct default
      }
    } catch (e) {
      console.error('[Dashboard] Error parsing saved order for initial value:', e);
      localStorage.removeItem('dashboardSectionOrder');
    }
  }
  return currentDefaultOrder;
};

// Function to load initial collapsed state (Final Attempt at Robustness)
const getInitialCollapsedState = (): Record<TaskSectionId, boolean> => {
  let currentOrder: TaskSectionId[] = [];
  try {
      // Attempt to get the potentially saved order
      currentOrder = getInitialSectionOrder();
      // Ensure it's valid, otherwise use the hardcoded default
      if (!Array.isArray(currentOrder) || currentOrder.length === 0 || !currentOrder.every(id => initialSectionOrder.includes(id))) {
          console.warn('[Dashboard] getInitialSectionOrder returned invalid/empty, using hardcoded order for collapse state default.');
          currentOrder = [...initialSectionOrder];
      }
  } catch (e) {
       console.error('[Dashboard] Error in getInitialSectionOrder within getInitialCollapsedState, using hardcoded order:', e);
       currentOrder = [...initialSectionOrder];
  }

  // Create default state based on the determined order (guaranteed to be valid array)
  const defaults = currentOrder.reduce((acc, id) => {
    acc[id] = false; // Default to expanded
    return acc;
  }, {} as Record<TaskSectionId, boolean>);

  // Try to merge with saved state
  const savedCollapsed = localStorage.getItem('dashboardCollapsedSections');
  if (savedCollapsed) {
    try {
      const parsed = JSON.parse(savedCollapsed);
      if (typeof parsed === 'object' && parsed !== null) {
        const mergedState = { ...defaults };
        for (const id of currentOrder) {
          if (parsed.hasOwnProperty(id) && typeof parsed[id] === 'boolean') {
            mergedState[id] = parsed[id];
          }
        }
        return mergedState;
      }
    } catch (e) {
      console.error('[Dashboard] Error parsing saved collapsed state:', e);
      localStorage.removeItem('dashboardCollapsedSections');
    }
  }

  return defaults; // Return the guaranteed default structure
};

// --- Persistence Logic --- END ---

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
  const [isQuickNotesVisible, setIsQuickNotesVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('quickNotesVisibleState');
    // Default based on screen size if nothing is saved
    return saved !== null ? JSON.parse(saved) : !isTablet;
  });

  // --- Snackbar State ---
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');

  // --- State for Collapsible/Reorderable Sections ---
  const [sectionOrder, setSectionOrder] = useState<TaskSectionId[]>(getInitialSectionOrder);
  const [collapsedSections, setCollapsedSections] = useState<Record<TaskSectionId, boolean>>(getInitialCollapsedState);
  
  // Initialize allCollapsed simply
  const [allCollapsed, setAllCollapsed] = useState<boolean>(false); // Default to false (expanded)

  // Update allCollapsed state based on collapsedSections whenever it changes
  useEffect(() => {
    if (Object.keys(collapsedSections).length > 0) {
        const allNowCollapsed = Object.values(collapsedSections).every(v => v === true);
        const allNowExpanded = Object.values(collapsedSections).every(v => v === false);
        if (allNowCollapsed) {
            setAllCollapsed(true);
        } else if (allNowExpanded) {
            setAllCollapsed(false);
        } // If mixed, state remains as is until fully collapsed/expanded
    }
  }, [collapsedSections]);

  // --- REMOVED OLD useEffect FOR LOADING STATE ---

  // --- Keep useEffect hooks for SAVING state --- 
  // Save order to localStorage when it changes
  useEffect(() => {
     console.log('[Dashboard] Saving section order to localStorage:', sectionOrder);
    localStorage.setItem('dashboardSectionOrder', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    console.log('[Dashboard] Saving collapsed state to localStorage:', collapsedSections);
    localStorage.setItem('dashboardCollapsedSections', JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  // Save Sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpenState', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Save QuickNotes state to localStorage (use the correct state variable)
  useEffect(() => {
    console.log('[Dashboard] Saving isQuickNotesVisible to localStorage:', isQuickNotesVisible);
    localStorage.setItem('quickNotesVisibleState', JSON.stringify(isQuickNotesVisible));
  }, [isQuickNotesVisible]);

  // --- Handlers ---

  const handleToggleQuickNotes = () => {
    setIsQuickNotesVisible(prev => {
      const newState = !prev;
      // No need to explicitly save here, the useEffect above handles it.
      return newState;
    });
  };

  // Update handleToggleCollapse to just update individual section
  const handleToggleCollapse = (sectionId: TaskSectionId) => {
    setCollapsedSections(prev => {
      const newState = { ...prev, [sectionId]: !prev[sectionId] };
      localStorage.setItem('dashboardCollapsedSections', JSON.stringify(newState));
      return newState;
    });
  };

  // Handler for the Collapse/Expand All button
  const handleToggleAllCollapse = () => {
    const targetState = !allCollapsed; // If all are collapsed, expand all; otherwise, collapse all
    const newState = initialSectionOrder.reduce((acc, id) => {
        acc[id] = targetState;
        return acc;
    }, {} as Record<TaskSectionId, boolean>);

    setCollapsedSections(newState);
    localStorage.setItem('dashboardCollapsedSections', JSON.stringify(newState));
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
    ...(dashboardData?.tasksICreatedForOthers || []),
    ...(dashboardData?.tasksDelegatedByMe || [])
  ], [dashboardData.tasksICreatedForOthers, dashboardData.tasksDelegatedByMe]);

  // Filter and combine tasks for the Kanban board view
  const boardTasks = useMemo(() => {
    const allRelevantTasks: Task[] = [
      ...(dashboardData?.myPersonalTasks || []),
      ...(dashboardData?.tasksAssignedToMe || []),
      ...(dashboardData?.tasksDelegatedToMe || []),
    ];

    // Remove duplicates based on task ID
    return Array.from(new Map(allRelevantTasks.map(task => [task.id, task])).values());
  }, [dashboardData.myPersonalTasks, dashboardData.tasksAssignedToMe, dashboardData.tasksDelegatedToMe]);

  // Move all useCallback hooks outside of conditionals to ensure consistent hook order
  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarOpenState', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const handleToggleTopWidgets = useCallback(() => {
    setTopWidgetsVisible(prev => !prev);
  }, []);

  const handleToggleRightSidebar = useCallback(() => {
    setIsQuickNotesVisible(prev => !prev);
  }, []);

  const handleNotificationClick = useCallback(() => {
    console.log("Notification icon clicked");
    // TODO: Implement notification panel logic
  }, []);

  // --- Snackbar Helper ---
  const showSnackbar = useCallback((message: string, severity: AlertColor = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleCloseSnackbar = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  }, []);

  const handleTaskCreated = useCallback(async () => {
    setCreateTaskDialogOpen(false);
    await fetchDashboardTasks();
    showSnackbar('Task created successfully.');
  }, [fetchDashboardTasks, showSnackbar]);

  const handleCloseCreateTaskDialog = useCallback(() => {
    setCreateTaskDialogOpen(false);
  }, []);

  const handleCloseEditTaskDialog = useCallback(() => {
    setEditTaskDialogOpen(false);
    setSelectedTask(null);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedTaskId('');
  }, []);

  const handleProfileClick = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  const handleSettingsClick = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleHelpClick = useCallback(() => {
    console.log('Help clicked');
  }, []);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  }, []);

  // --- Update Handlers to Show Snackbar ---
  const changeTaskStatus = useCallback(async (taskId: string, status: TaskStatus): Promise<boolean> => {
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
  }, [fetchDashboardTasks, handleError, showSnackbar]);

  const handleTaskDrop = useCallback(async (taskId: string, newStatus: TaskStatus) => {
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
  }, [changeTaskStatus, dashboardData, fetchDashboardTasks, handleError]);

  const handleViewTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setViewTaskDialogOpen(true);
  }, []);

  const handleEditTask = useCallback((taskId: string) => {
    // Search all dashboardData lists for the task
    const taskToEdit =
      [
        ...(dashboardData.myPersonalTasks || []),
        ...(dashboardData.tasksICreatedForOthers || []),
        ...(dashboardData.tasksAssignedToMe || []),
        ...(dashboardData.tasksDelegatedByMe || []),
        ...(dashboardData.tasksDelegatedToMe || []),
      ].find(t => String(t.id) === taskId) || null;
    setSelectedTask(taskToEdit);
    setEditTaskDialogOpen(true);
  }, [dashboardData]);

  // Add state for deletion reason
  const [deletionReason, setDeletionReason] = useState<string>('');
  const [deletionReasonError, setDeletionReasonError] = useState<string>('');

  // Delete task handler
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      if (!deletionReason || deletionReason.length < 20) {
        setDeletionReasonError('Please provide a detailed reason (at least 20 characters)');
        return;
      }
      
      console.log('Deleting task with ID:', taskId);
      await TaskService.deleteTask(taskId, deletionReason); // Pass deletion reason
      fetchDashboardTasks(); // Refresh ALL dashboard data after deletion
      setDeleteDialogOpen(false);
      setDeletionReason(''); // Reset reason
      setDeletionReasonError('');
    } catch (err) {
      console.error('Error deleting task:', err);
      handleError('Failed to delete task. Please try again later.');
    }
  }, [fetchDashboardTasks, handleError, deletionReason]);

  // Ensure this handler always uses PERSONAL type and removes status param
  const handleOpenCreateTaskDialog = useCallback((type: TaskType, departmentId?: string) => {
    setInitialTaskType(type);
    // Removed setting initial status here, let the dialog default
    setCreateTaskDialogOpen(true);
  }, []);

  const handleOpenDeleteDialog = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setDeleteDialogOpen(true);
  }, []);

  // Ensure signature matches () => void for EditTaskDialog prop
  const handleTaskUpdated = useCallback(async (): Promise<void> => {
    console.log('[Dashboard] Task updated, refreshing dashboard data...');
    // Refetch ALL dashboard data after update for consistency
    await fetchDashboardTasks();
  }, [fetchDashboardTasks]);

  // Ensure consistent dependencies for sectionConfigs useMemo
  const sectionConfigs = useMemo((): TaskSectionConfig[] => {
    console.log("[Dashboard] Recalculating sectionConfigs, dashboardData:", dashboardData);

    // Use a generic title for now
    const departmentTitle = "Tasks For My Department(s)";

    return [
      {
        id: 'assigned',
        title: 'Tasks Assigned To Me',
        tasks: dashboardData.tasksAssignedToMe || [],
        color: SECTION_COLORS.assigned,
        description: 'Tasks specifically assigned to me as an individual'
      },
      {
        id: 'myDepartments',
        title: 'Department Tasks',
        tasks: dashboardData.tasksAssignedToMyDepartments || [],
        color: SECTION_COLORS.myDepartments,
        description: 'Tasks assigned to my department(s) as a whole'
      },
      {
        id: 'created',
        title: 'Tasks I Created/Assigned',
        tasks: dashboardData.tasksICreatedForOthers || [],
        color: SECTION_COLORS.created,
        description: 'Tasks I have created or assigned to others'
      },
      {
        id: 'personal',
        title: 'My Personal Tasks',
        tasks: dashboardData.myPersonalTasks || [],
        color: SECTION_COLORS.personal,
        showAddButton: true,
        addTaskType: TaskType.PERSONAL,
        description: 'My personal tasks and reminders'
      },
      {
        id: 'delegatedTo',
        title: 'Tasks Delegated To Me',
        tasks: dashboardData.tasksDelegatedToMe || [],
        color: SECTION_COLORS.delegatedTo,
        description: 'Tasks that have been delegated to me by others'
      },
      {
        id: 'delegatedBy',
        title: 'Tasks I Delegated',
        tasks: dashboardData.tasksDelegatedByMe || [],
        color: SECTION_COLORS.delegatedBy,
        description: 'Tasks I have delegated to others'
      },
    ];
  }, [dashboardData]);

  // Map section data based on the current order
  const orderedSections = useMemo(() => {
    return sectionOrder.map(id => sectionConfigs.find(section => section.id === id)).filter(Boolean) as TaskSectionConfig[];
  }, [sectionOrder, sectionConfigs]);

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
      onToggleQuickNotes={handleToggleQuickNotes}
      showQuickNotes={isQuickNotesVisible}
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
        {/* Add Task Button (Corrected onClick) */}
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
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: isMobile ? 1 : 3, height: '100%' }}> {/* Ensure this box takes full height */} 
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
                    orderedSections.map((section, index) => {
                      // --- Calculate Status Counts ---
                      const counts = section.tasks.reduce((acc, task) => {
                        acc[task.status] = (acc[task.status] || 0) + 1;
                        return acc;
                      }, {} as Record<TaskStatus, number>);
                      // --- End Calculate Status Counts ---

                      return (
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
                                {/* Icon + Title */}
                                <Typography variant="h6" sx={{ color: '#fff', flexGrow: 1, fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
                                  {section.id === 'assigned' && <AssignmentIndIcon sx={{ mr: 1, verticalAlign: 'bottom', fontSize: '1.1rem' }} />}
                                  {section.id === 'myDepartments' && <BusinessIcon sx={{ mr: 1, verticalAlign: 'bottom', fontSize: '1.1rem' }} />}
                                  {section.id === 'created' && <CreateIcon sx={{ mr: 1, verticalAlign: 'bottom', fontSize: '1.1rem' }} />}
                                  {section.id === 'personal' && <PersonIcon sx={{ mr: 1, verticalAlign: 'bottom', fontSize: '1.1rem' }} />}
                                  {section.id === 'delegatedTo' && <ForwardIcon sx={{ mr: 1, verticalAlign: 'bottom', fontSize: '1.1rem' }} />}
                                  {section.id === 'delegatedBy' && <SendIcon sx={{ mr: 1, verticalAlign: 'bottom', fontSize: '1.1rem' }} />}
                                  {section.title}
                                </Typography>
                                {/* Status Counts Chips */}
                                <Stack direction="row" spacing={0.5} sx={{ mr: 1, ml: 1 }}>
                                  {counts[TaskStatus.PENDING] > 0 && (
                                    <Chip label={counts[TaskStatus.PENDING]} color="warning" size="small" sx={{ height: '20px', fontSize: '0.7rem' }} title="Pending"/>
                                  )}
                                  {counts[TaskStatus.IN_PROGRESS] > 0 && (
                                    <Chip label={counts[TaskStatus.IN_PROGRESS]} color="info" size="small" sx={{ height: '20px', fontSize: '0.7rem' }} title="In Progress"/>
                                  )}
                                  {counts[TaskStatus.COMPLETED] > 0 && (
                                    <Chip label={counts[TaskStatus.COMPLETED]} color="success" size="small" sx={{ height: '20px', fontSize: '0.7rem' }} title="Completed"/>
                                  )}
                                  {counts[TaskStatus.CANCELLED] > 0 && (
                                     <Chip label={counts[TaskStatus.CANCELLED]} color="default" size="small" sx={{ height: '20px', fontSize: '0.7rem', bgcolor: 'grey.600', color: '#fff' }} title="Cancelled"/>
                                  )}
                                </Stack>
                                {/* Action Buttons Container (Corrected Closing Tag) */}
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {section.id === 'personal' && section.showAddButton && (
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
                                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                  >
                                    {collapsedSections[section.id] ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                                  </IconButton>
                                </Box>
                              </Box>

                              {/* Collapsible Content */}
                              <Collapse in={!collapsedSections[section.id]} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 1 }}>
                                  <TasksSection
                                    tasks={section.tasks}
                                    currentUserId={user?.id ? Number(user.id) : 0}
                                    currentDepartmentId={0}
                                    viewMode="user"
                                    onTaskClick={handleViewTask}
                                    onTaskUpdated={handleTaskUpdated}
                                  />
                                </Box>
                              </Collapse>
                            </Paper>
                          )}
                        </Draggable>
                      );
                    })
                  )}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </TabPanel>

        <TabPanel value={activeSubTab} index={1}>
          {/* Board View Content */}
          <Box sx={{ 
            pt: 2, 
            display: 'flex', 
            flexDirection: 'column',
            width: '100%',
            minHeight: 'calc(100% - 16px)',
          }}> 
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
  console.log('[Dashboard] Rendering layout, showQuickNotes:', isQuickNotesVisible);

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
        quickNotesVisible={isQuickNotesVisible}
      />
      {/* Render Dialogs OUTSIDE/SIBLING to the ModernDashboardLayout */}
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onClose={handleCloseCreateTaskDialog}
        onTaskCreated={handleTaskCreated}
        initialStatus={initialTaskStatus}
        initialType={initialTaskType}
        dialogType="create"
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
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this task? This action will move the task to the recycle bin.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="deletionReason"
            label="Reason for Deletion (Min 20 characters)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            error={!!deletionReasonError}
            helperText={deletionReasonError}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setDeletionReason('');
            setDeletionReasonError('');
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => deleteTask(selectedTaskId)}
            disabled={!deletionReason || deletionReason.length < 20}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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