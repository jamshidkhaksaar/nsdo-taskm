import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  Chip,
  CircularProgress,
  LinearProgress,
  IconButton,
  Skeleton,
  useTheme,
  useMediaQuery,
  Fab,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  DonutLarge as DonutLargeIcon,
  ErrorOutline as ErrorOutlineIcon,
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import { Task, Department as DepartmentType, TaskStatus, TaskPriority, TaskType, User } from '../types';
import { TaskService } from '../services/task';
import { getTasks as getTaskListTasks, deleteTask } from '../services/tasks.service';
import { DepartmentService } from '../services/department';
import DepartmentStats from '../components/tasks-overview/DepartmentStats';
import { UserService } from '../services/user';
import { RootState } from '../store';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import CreateTaskDialog from '../components/tasks/CreateTaskDialog';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title, TooltipItem } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import ProvincePerformance from '../components/provinces/ProvincePerformance';

const DRAWER_WIDTH = 240;

// Define colors for different statuses
const COLORS = {
  pending: '#2196F3',
  in_progress: '#FF9800', 
  completed: '#4CAF50',
  cancelled: '#F44336',
  departments: ['#3F51B5', '#009688', '#9C27B0', '#FF5722', '#607D8B', '#795548', '#FFEB3B', '#03A9F4'],
  users: ['#8BC34A', '#E91E63', '#9C27B0', '#2196F3', '#FF9800', '#795548', '#009688', '#673AB7'],
};

interface Department {
  id: string;
  name: string;
  taskCount: number;
  completedTasks: number;
  completionRate: number;
}

interface UserData {
  id: string;
  name: string;
  avatar?: string;
  taskCount: number;
  completedTasks: number;
  completionRate: number;
  role: string;
}

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const TasksOverview: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departmentData, setDepartmentData] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(3);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
    completionRate: 0,
  });

  // --- State for Task List View & Form ---
  const [taskListTasks, setTaskListTasks] = useState<Task[]>([]);
  const [taskListLoading, setTaskListLoading] = useState<boolean>(true);
  const [taskListError, setTaskListError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  // -------------------------------------

  useEffect(() => {
    // Check if user is admin or leadership
    if (user?.role !== 'admin' && user?.role !== 'leadership') {
      navigate('/dashboard');
    }
    
    fetchData();
    fetchTaskListData();
  }, [navigate, user?.role]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all tasks, departments, and users data
      const [tasksResponse, departmentsResponse, usersResponse] = await Promise.all([
        TaskService.getVisibleTasks('all', { include_all: true }),
        DepartmentService.getDepartments(),
        UserService.getUsers(),
      ]);
      
      setTasks(tasksResponse);
      
      // Process department data
      const departmentData = departmentsResponse.map((dept: DepartmentType) => {
        const deptTasks = tasksResponse.filter((task: Task) => {
          return task.assignedToDepartmentIds?.includes(dept.id);
        });
        
        const completedTasks = deptTasks.filter((task: Task) => task.status === 'completed').length;
        
        return {
          id: dept.id,
          name: dept.name,
          taskCount: deptTasks.length,
          completedTasks,
          completionRate: deptTasks.length > 0 ? (completedTasks / deptTasks.length) * 100 : 0,
        };
      });
      
      setDepartmentData(departmentData);
      
      // Process user data
      const userData = usersResponse.map((u: User) => {
        const userTasks = tasksResponse.filter((task: Task) =>
          (task.assignedToUserIds && task.assignedToUserIds.includes(u.id)) || 
          task.createdById === u.id
        );
        
        const completedTasks = userTasks.filter(task => task.status === TaskStatus.COMPLETED).length;
        const pendingTasks = userTasks.filter(task => task.status === TaskStatus.PENDING).length;
        const inProgressTasks = userTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
        const overdueTasks = userTasks.filter(task => 
          task.status !== TaskStatus.COMPLETED && 
          task.dueDate && new Date(task.dueDate) < new Date()
        ).length;
        
        return {
          id: u.id,
          name: `${u.first_name} ${u.last_name}`,
          avatar: u.avatar,
          role: u.role || 'user',
          taskCount: userTasks.length,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          overdueTasks,
          department: u.department?.name || 'N/A',
          completionRate: userTasks.length > 0 ? (completedTasks / userTasks.length) * 100 : 0,
        };
      });
      
      setUsers(userData);
      
      // Calculate task statistics
      const pending = tasksResponse.filter((task: Task) => task.status === 'pending').length;
      const inProgress = tasksResponse.filter((task: Task) => task.status === 'in_progress').length;
      const completed = tasksResponse.filter((task: Task) => task.status === 'completed').length;
      const cancelled = tasksResponse.filter((task: Task) => task.status === 'cancelled').length;
      
      // Calculate overdue tasks
      const now = new Date();
      const overdue = tasksResponse.filter((task: Task) => {
        const isPendingOrInProgress = task.status === 'pending' || task.status === 'in_progress';
        const isOverdue = task.dueDate && new Date(task.dueDate) < now;
        return isPendingOrInProgress && isOverdue;
      }).length;
      
      setTaskStats({
        total: tasksResponse.length,
        pending,
        in_progress: inProgress,
        completed,
        cancelled,
        overdue,
        completionRate: tasksResponse.length > 0 ? (completed / tasksResponse.length) * 100 : 0
      });
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
      setTasks([]);
      setDepartmentData([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Function to fetch data for TaskList ---
  const fetchTaskListData = async () => {
    setTaskListLoading(true);
    setTaskListError(null);
    try {
      // Use the TaskService to get tasks for the list view
      const data = await TaskService.getTasks();
      setTaskListTasks(data);
    } catch (err) {
      console.error('Error fetching task list data:', err);
      setTaskListError('Failed to fetch task list');
      setTaskListTasks([]);
    } finally {
      setTaskListLoading(false);
    }
  };
  // -----------------------------------------

  const handleLogout = () => {
    navigate('/login');
  };

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleToggleTopWidgets = useCallback(() => {
    setTopWidgetsVisible(prev => !prev);
  }, []);

  const handleNotificationClick = () => {
    setNotifications(0);
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
  
  const handleCreateTask = () => {
    setCreateTaskDialogOpen(true);
  };
  
  const handleTaskCreated = async () => {
    await fetchData();
    await fetchTaskListData();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleDepartmentView = (deptId: string) => {
    navigate(`/departments`);
  };
  
  const handleUserView = (userId: string) => {
    navigate(`/users`);
  };

  // Create chart data for tasks by status
  const statusChartData = [
    { name: 'Pending', value: taskStats.pending, color: COLORS.pending },
    { name: 'In Progress', value: taskStats.in_progress, color: COLORS.in_progress },
    { name: 'Completed', value: taskStats.completed, color: COLORS.completed },
    { name: 'Cancelled', value: taskStats.cancelled, color: COLORS.cancelled },
  ];
  
  // Enhanced chart data for departments with proper Chart.js formatting
  const getDepartmentChartData = () => {
    if (departmentData.length === 0) return { labels: [], datasets: [] };
    
    return {
      labels: departmentData.map(dept => dept.name),
      datasets: [
        {
          data: departmentData.map(dept => dept.taskCount),
          backgroundColor: COLORS.departments.slice(0, departmentData.length),
          borderColor: departmentData.map(() => 'rgba(255, 255, 255, 0.1)'),
          borderWidth: 1,
        }
      ]
    };
  };
  
  // Create chart data for top performers
  const topPerformers = [...users]
    .filter(u => u.taskCount > 0)
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 5);
  
  // Enhanced chart data for top performers with proper Chart.js formatting
  const getTopPerformersChartData = () => {
    if (topPerformers.length === 0) return { labels: [], datasets: [] };
    
    return {
      labels: topPerformers.map(user => user.name),
      datasets: [
        {
          label: 'Completion Rate (%)',
          data: topPerformers.map(user => user.completionRate),
          backgroundColor: COLORS.users.slice(0, topPerformers.length),
          borderColor: topPerformers.map(() => 'rgba(255, 255, 255, 0.1)'),
          borderWidth: 1,
        }
      ]
    };
  };

  // --- Handlers from Tasks.tsx (adapted) ---
  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedTask(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTask(null);
  };

  const handleFormSuccess = () => {
    fetchTaskListData();
    handleCloseForm();
  };

  const handleDeletionSuccess = () => {
    fetchTaskListData();
  };
  // ---------------------------------------

  // Dashboard tab content
  const renderDashboardTab = () => (
    <Box p={3}>
      {/* Summary Cards and other Dashboard content - keep existing dashboard content */}
      {/* ... existing Dashboard tab content ... */}
    </Box>
  );
  
  // Departments tab content
  const renderDepartmentsTab = () => (
    <Box p={3}>
      {/* Department-related content - keep existing department content */}
      {/* ... existing Departments tab content ... */}
    </Box>
  );
  
  // Top Performers tab content
  const renderUsersTab = () => (
    <Box p={3}>
      {/* User/top performer-related content - keep existing users content */}
      {/* ... existing Top Performers tab content ... */}
    </Box>
  );
  
  // Tasks tab content
  const renderTasksTab = () => (
    <Box p={3}>
      {/* Tasks list - keep existing tasks content */}
      {/* ... existing Tasks tab content ... */}
    </Box>
  );
  
  // Province Performance tab content
  const renderProvincePerformanceTab = () => (
    <Box p={3}>
      <ProvincePerformance />
    </Box>
  );

  // Dashboard tab content rendering
  const renderTabContent = () => {
    switch(tabValue) {
      case 0: // Dashboard
        return renderDashboardTab();
      case 1: // Departments
        return renderDepartmentsTab();
      case 2: // Users
        return renderUsersTab();
      case 3: // Tasks
        return renderTasksTab();
      case 4: // Province Performance
        return renderProvincePerformanceTab();
      default:
        return renderDashboardTab();
    }
  };
  
  // Keep your existing mainContent definition, but update it to use renderTabContent
  const mainContent = (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {loading ? (
        <Box sx={{ p: 3 }}>
          <Box mb={3}>
            <Skeleton
              variant="text"
              width={200}
              height={40}
              animation="wave"
              sx={{ '& .MuiSkeleton-wave': { animationDuration: '3s' } }}
            />
            <Skeleton
              variant="text"
              width={250}
              height={20}
              animation="wave"
              sx={{ '& .MuiSkeleton-wave': { animationDuration: '3s' } }}
            />
          </Box>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={200}
            animation="wave"
            sx={{ '& .MuiSkeleton-wave': { animationDuration: '3s' } }}
          />
        </Box>
      ) : error ? (
        <Typography sx={{ color: '#f44336', textAlign: 'center', mt: 4 }}>{error}</Typography>
      ) : (
        <>
          {/* Header Section */}
          <Box mb={4}>
            <Typography variant="h4" fontWeight="bold" color="#fff" mb={1}>
              Tasks Overview
            </Typography>
            <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
              Monitor task progress across all departments and users
            </Typography>
          </Box>
          
          {/* Tab Paper */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              backgroundImage: 'none',
              backgroundSize: 'cover',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              boxShadow: 'none',
              overflow: 'hidden',
              mb: 3,
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : false}
              sx={{
                minHeight: 48,
                '& .MuiTab-root': {
                  minHeight: 48,
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 'normal',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    color: '#fff',
                    fontWeight: 'medium',
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#fff'
                }
              }}
            >
              <Tab icon={<DashboardIcon sx={{ fontSize: '1.1rem' }} />} label="Dashboard" iconPosition="start" />
              <Tab icon={<BusinessIcon sx={{ fontSize: '1.1rem' }} />} label="Departments" iconPosition="start" />
              <Tab icon={<GroupIcon sx={{ fontSize: '1.1rem' }} />} label="Top Performers" iconPosition="start" />
              <Tab icon={<AssessmentIcon sx={{ fontSize: '1.1rem' }} />} label="Tasks" iconPosition="start" />
              <Tab icon={<DonutLargeIcon sx={{ fontSize: '1.1rem' }} />} label="Province Performance" iconPosition="start" />
            </Tabs>
            
            {/* Render the tab content */}
            {renderTabContent()}
          </Paper>
          
          {/* ... keep existing dialogs and components ... */}
        </>
      )}
    </Container>
  );
  
  // Helper function to get color based on role
  function getRoleColor(role?: string) {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'rgba(156, 39, 176, 0.8)'; // Purple
      case 'leadership':
        return 'rgba(3, 169, 244, 0.8)'; // Light Blue
      default:
        return 'rgba(33, 150, 243, 0.8)'; // Blue
    }
  }
  
  // Helper function to get color based on completion rate
  function getCompletionRateColor(rate: number) {
    if (rate >= 75) return '#4CAF50'; // Green
    if (rate >= 50) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

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
          onToggleTopWidgets={handleToggleTopWidgets}
          topWidgetsVisible={topWidgetsVisible}
        />
      }
      mainContent={mainContent}
      sidebarOpen={sidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default TasksOverview;