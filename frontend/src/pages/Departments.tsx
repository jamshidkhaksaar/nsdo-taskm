import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useQueries } from 'react-query';
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
      },
      onSuccess: (data) => {
        if (!selectedDepartment && data && data.length > 0) {
          setSelectedDepartment(data[0].id);
        }
      }
    }
  );

  // --- React Query Hook for Department Task Counts ---
  const departmentCountQueries = useQueries(
    departmentsData.map(dept => ({
      queryKey: ['departmentTaskCounts', dept.id],
      queryFn: () => TaskService.getTaskCountsByStatusForDepartment(dept.id),
      staleTime: 5 * 60 * 1000, // Cache counts for 5 minutes
      enabled: !!dept.id, // Only run query if department ID exists
      onError: (err: any) => {
        console.error(`Failed to load task counts for department ${dept.id}:`, err);
      },
    }))
  );

  // Check if any count query is still loading
  const isLoadingCounts = departmentCountQueries.some(query => query.isLoading);

  // Combine department data with task counts
  const departmentsWithCounts = departmentsData.map((dept, index) => {
    const countQuery = departmentCountQueries[index];
    const counts = countQuery.data;
    // Sum up counts for all statuses (or default to 0)
    const totalTasks = counts 
      ? (counts.pending || 0) + (counts.in_progress || 0) + (counts.completed || 0) + (counts.cancelled || 0)
      : 0; // Default to 0 if counts are loading or failed
    return {
      ...dept,
      tasksCount: totalTasks, // Add the calculated total count
      statusCounts: counts // Keep individual status counts if needed later
    };
  });

  // Combined loading state (departments OR counts)
  const isLoading = isLoadingDepartments || isLoadingCounts;
  // Prioritize department fetch error
  const combinedError = fetchDepartmentsError;

  // Fetch top performers when selected department changes
  const { 
    data: performersData, 
    isLoading: isLoadingPerformers 
  } = useQuery(
    ['departmentPerformers', selectedDepartment],
    () => DepartmentService.getDepartmentPerformers(selectedDepartment!),
    {
      enabled: !!selectedDepartment, // Only run when selectedDepartment is truthy
      staleTime: 5 * 60 * 1000,
      onError: (err) => console.error(`Error fetching performers for ${selectedDepartment}:`, err),
      onSuccess: (data) => setTopPerformers(data || []) // Update local state on success
    }
  );

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
      ) : combinedError ? (
        <Alert severity="error" sx={{ m: 3 }}>
          {combinedError.message || 'An unknown error occurred loading departments.'}
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
