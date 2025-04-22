import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  Box,
  Container,
  Grid,
  Avatar,
  Typography,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Button,
  Fab,
  Tooltip,
  Paper,
  Chip,
  Divider,
  AvatarGroup,
  Skeleton,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Sidebar from '../components/Sidebar';
import DepartmentList from '../components/departments/DepartmentList';
import TasksSection from '../components/departments/TasksSection';
import { Task, TaskStatus, Department, TaskStatusCountsResponse } from '@/types/index';
import { DepartmentService } from '../services/department';
import { TaskService } from '../services/task';
import { RootState } from '../store';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import CreateTaskDialog from '../components/tasks/CreateTaskDialog';
import DepartmentDetail from '../components/departments/DepartmentDetail';

const DRAWER_WIDTH = 240;

const Departments: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(3);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);

  // State for data
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  
  // State for task dialog
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  // Fetch departments
  const departmentsQuery = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: DepartmentService.getDepartments,
  });

  // Dynamically create queries for tasks for each department
  const departmentTaskQueries = useQueries<Array<{ data: Task[] }>>({
    queries: (departmentsQuery.data ?? []).map(department => ({
      queryKey: ['departmentTasks', department.id],
      queryFn: () => TaskService.getTasksByDepartment(department.id),
      enabled: !!departmentsQuery.data, // Only run if departments are loaded
    })),
  });

  // --- Loading and Error Handling --- 
  const isLoadingDepartments = departmentsQuery.isLoading;
  const departmentsError = departmentsQuery.error;
  // Check if any department task query is loading or has errored
  const isLoadingTasks = departmentTaskQueries.some(query => query.isLoading);
  const tasksError = departmentTaskQueries.find(query => query.isError)?.error;

  const isLoading = isLoadingDepartments || isLoadingTasks;
  const error = departmentsError || tasksError;

  // --- Data Processing (Memoized) ---
  const departmentsData = departmentsQuery.data || [];
  
  // Combine tasks from all successful queries
  const allTasks: Task[] = useMemo(() => 
    departmentTaskQueries
      .filter(query => query.isSuccess && Array.isArray(query.data)) // Filter successful queries with array data
      .flatMap(query => query.data as Task[]) // Flatten the arrays of tasks
  , [departmentTaskQueries]);

  // Calculate task counts per department (Memoized)
  const taskCountsByDepartment: { [key: string]: number } = useMemo(() => {
    const counts: { [key: string]: number } = {};
    (departmentsQuery.data ?? []).forEach((dept, index) => {
      const queryResult = departmentTaskQueries[index];
      counts[dept.id] = (queryResult?.isSuccess && Array.isArray(queryResult.data)) ? queryResult.data.length : 0;
    });
    return counts;
  }, [departmentsQuery.data, departmentTaskQueries]);

  // Calculate task status counts per department (Memoized)
  const taskStatusCountsByDepartment: { [key: string]: { [key in TaskStatus]: number } } = useMemo(() => {
    const counts: { [key: string]: { [key in TaskStatus]: number } } = {};
    (departmentsQuery.data ?? []).forEach((dept, index) => {
      const queryResult = departmentTaskQueries[index];
      counts[dept.id] = { // Initialize counts for the department
        [TaskStatus.PENDING]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.CANCELLED]: 0,
      };
      if (queryResult?.isSuccess && Array.isArray(queryResult.data)) {
        (queryResult.data as Task[]).forEach(task => {
          if (counts[dept.id][task.status] !== undefined) {
            counts[dept.id][task.status]++;
          }
        });
      }
    });
    return counts;
  }, [departmentsQuery.data, departmentTaskQueries]);

  // Fetch top performers when selected department changes
  const topPerformersQuery = useQuery<any[]>({
    queryKey: ['topPerformers', selectedDepartment],
    queryFn: () => selectedDepartment ? DepartmentService.getDepartmentPerformers(selectedDepartment) : Promise.resolve([]),
    enabled: !!selectedDepartment, // Only run if a department is selected
  });

  // Fetch details for the selected department
  const selectedDepartmentDetailsQuery = useQuery<Department>({
    queryKey: ['departmentDetails', selectedDepartment],
    queryFn: () => DepartmentService.getDepartment(selectedDepartment!),
    enabled: !!selectedDepartment,
  });

  // Combine department data with task counts (Memoized)
  const departmentsWithCounts = useMemo(() => {
    return departmentsData.map(dept => ({
      ...dept,
      tasksCount: taskCountsByDepartment[dept.id] || 0,
    }));
  }, [departmentsData, taskCountsByDepartment]);

  const handleLogout = () => {
    // Handle logout logic here
    navigate('/login');
  };

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
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
    if (selectedDepartment) { // Only open if a department is selected
      setCreateTaskDialogOpen(true);
    } else {
      alert("Please select a department first."); // Or provide better user feedback
    }
  };
  
  const handleTaskCreated = () => {
    setCreateTaskDialogOpen(false);
    // Optionally, refetch tasks for the department or invalidate query cache
    // queryClient.invalidateQueries(['departmentTasks', selectedDepartment]);
  };

  const mainContent = (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" color="#fff" mb={1}>
          Department Management
        </Typography>
        <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
          View and manage departments and their associated tasks/users.
        </Typography>
      </Box>

      {isLoading ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4} lg={3}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, bgcolor: 'grey.800' }} />
          </Grid>
          <Grid item xs={12} md={8} lg={9}>
            <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 2, bgcolor: 'grey.800' }} />
          </Grid>
        </Grid>
      ) : error ? (
        <Alert severity="error" sx={{ m: 3 }}>
          {error.message || 'An unknown error occurred loading departments.'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Left Column - Department List */}
          <Grid item xs={12} md={4} lg={3}>
            <DepartmentList
              departments={departmentsWithCounts}
              selectedDepartment={selectedDepartment}
              onSelectDepartment={setSelectedDepartment}
            />
          </Grid>

          {/* Right Column - Department Details */}
          <Grid item xs={12} md={8} lg={9}>
            {selectedDepartment ? (
              <DepartmentDetail 
                departmentId={selectedDepartment} 
                onAddTaskClick={handleCreateTask} // Pass the handler down
              />
            ) : (
              <Paper 
                elevation={0}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  height: 'calc(100vh - 200px)', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  p: 3,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
              >
                <PeopleIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.2)' }} />
                <Typography variant="h6" color="rgba(255, 255, 255, 0.7)" mt={2}>
                  Select a department
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.5)" textAlign="center">
                  Choose a department from the list to view details.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
      
      {/* Re-add Create Task Dialog for Department mode */}
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onClose={() => setCreateTaskDialogOpen(false)}
        onTaskCreated={handleTaskCreated} 
        dialogType="assign"
      />
    </Container>
  );

  return (
    <ModernDashboardLayout
      sidebar={
        <Sidebar
          open={isSidebarOpen}
          onToggleDrawer={handleToggleSidebar}
          onLogout={handleLogout}
          drawerWidth={DRAWER_WIDTH}
        />
      }
      topBar={
        <DashboardTopBar
          username={currentUser?.username || 'User'}
          notificationCount={notifications}
          onToggleSidebar={handleToggleSidebar}
          onNotificationClick={() => console.log('Notification clicked')}
          onLogout={handleLogout}
          onProfileClick={() => navigate('/profile')}
          onSettingsClick={() => navigate('/settings')}
          onHelpClick={() => console.log('Help clicked')}
          onToggleTopWidgets={handleToggleTopWidgets}
          topWidgetsVisible={topWidgetsVisible}
        />
      }
      mainContent={mainContent}
      sidebarOpen={isSidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default Departments;
