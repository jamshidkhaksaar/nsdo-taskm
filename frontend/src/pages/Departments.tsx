import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Sidebar from '../components/Sidebar';
import DepartmentList from '../components/departments/DepartmentList';
import TasksSection from '../components/departments/TasksSection';
import { Task, TaskStatus, Department } from '@/types/index';
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
  const [departments, setDepartments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for task dialog
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  // --- React Query Hook for Departments ---
  const { 
    data: departmentsData = [], 
    isLoading: isLoadingDepartments, 
    error: fetchDepartmentsError 
  } = useQuery<Department[], Error>(
    'departments', 
    DepartmentService.getDepartments, 
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      onError: (err) => {
        console.error('Failed to load departments:', err);
        // Potentially set a local error state if needed beyond the query error
      },
      onSuccess: (data) => {
        // Select first department by default if none is selected and data is available
        if (!selectedDepartment && data && data.length > 0) {
          setSelectedDepartment(data[0].id);
        }
      }
    }
  );

  // Combined loading state and error handling (adjust if other queries are added)
  const isLoading = isLoadingDepartments;
  const combinedError = fetchDepartmentsError;

  // Fetch departments and ALL tasks initially and when selectedDepartment changes (for performers)
  const fetchData = useCallback(async () => {
    // console.log(`Fetching data. Selected Department: ${selectedDepartment}`); // Debug log
    setLoading(true); // Indicate loading starts
    try {
      // Fetch departments and all visible tasks concurrently
      const [departmentsResponse, tasksResponse] = await Promise.all([
        DepartmentService.getDepartments(),
        TaskService.getVisibleTasks('all', { include_all: true }) // Fetch all visible tasks
      ]);

      // Set tasks state with all fetched tasks
      setTasks(tasksResponse || []);

      // Process departments (task count will be updated in useEffect below)
      const processedDepartments = departmentsResponse.map((dept: any) => ({
        ...dept,
        tasksCount: 0, // Initialize count, will be calculated later
      }));
      setDepartments(processedDepartments);

      // If a department is selected, fetch its top performers
      if (selectedDepartment) {
        // console.log(`Fetching performers for ${selectedDepartment}`); // Debug log
        const performersResponse = await DepartmentService.getDepartmentPerformers(selectedDepartment);
        setTopPerformers(performersResponse || []);
      } else {
        setTopPerformers([]); // Clear performers if no department selected
      }

      setError(null); // Clear any previous error
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
      setTasks([]); // Clear data on error
      setDepartments([]);
      setTopPerformers([]);
    } finally {
      setLoading(false); // Indicate loading finished
      // console.log("Fetching data finished."); // Debug log
    }
  }, [selectedDepartment]); // Dependency on selectedDepartment for fetching performers

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Use fetchData in dependency array

  // Recalculate department task counts whenever tasks or initial departments list changes
  useEffect(() => {
    if (tasks.length > 0 && departments.length > 0) {
      console.log("Recalculating department task counts...");
      console.log("Tasks data:", tasks.map(t => ({ id: t.id, title: t.title, assignedToDepartmentIds: t.assignedToDepartmentIds })) );
      
      const departmentsWithCount = departments.map(dept => {
        const count = tasks.filter(task => 
          task.assignedToDepartmentIds && task.assignedToDepartmentIds.includes(dept.id)
        ).length;
        
        console.log(`Department ${dept.name} (${dept.id}) count: ${count}`);
        return { ...dept, tasksCount: count };
      });

      // Only update state if counts actually changed to prevent infinite loops
      if (JSON.stringify(departments.map(d => d.tasksCount)) !== JSON.stringify(departmentsWithCount.map(d => d.tasksCount))) {
        console.log("Updating department counts state.");
        setDepartments(departmentsWithCount);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]); // Rerun when tasks list updates, ignore departments in deps to avoid loop based on its own update

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

  // Filter tasks based on selected department (CLIENT-SIDE FILTERING)
  const departmentTasks = tasks.filter(task => {
    if (!selectedDepartment) { 
      return false;
    }
    return task.assignedToDepartmentIds && task.assignedToDepartmentIds.includes(selectedDepartment);
  });
  console.log(`Selected Dept: ${selectedDepartment}, Filtered Tasks Count: ${departmentTasks.length}`); // Debug log

  // Calculate upcoming, ongoing, completed based on the correctly filtered departmentTasks
  const upcomingTasks = departmentTasks.filter(task => 
    task.status === 'pending' && task.dueDate && new Date(task.dueDate) > new Date()
  );
  
  const ongoingTasks = departmentTasks.filter(task => 
    task.status === 'in_progress' || 
    (task.status === 'pending' && task.dueDate && new Date(task.dueDate) <= new Date())
  );
  
  const completedTasks = departmentTasks.filter(task => 
    task.status === 'completed'
  );

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
      ) : combinedError ? (
        <Alert severity="error" sx={{ m: 3 }}>
          {combinedError.message || 'An unknown error occurred loading departments.'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Left Column - Department List */}
          <Grid item xs={12} md={4} lg={3}>
            <DepartmentList
              departments={departments}
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
