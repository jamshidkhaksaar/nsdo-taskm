import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  People as PeopleIcon,
} from '@mui/icons-material';
import { RootState } from '@/store';
import { Department, Task, TaskType } from '@/types/index';
import { DepartmentService } from '@/services/department';
import DepartmentList from '@/components/departments/DepartmentList';
import DepartmentDetail from '@/components/departments/DepartmentDetail';
import CreateTaskDialog from '@/components/tasks/CreateTaskDialog';
import Sidebar from '@/components/Sidebar';
import ModernDashboardLayout from '@/components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';

const DRAWER_WIDTH = 240;

const Departments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);

  // Add back queryClient definition
  const queryClient = useQueryClient();

  // Fetch departments
  const departmentsQuery = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: DepartmentService.getDepartments,
  });

  // Helper function to determine which departments the user can view tasks for
  const getAccessibleDepartmentIds = useMemo(() => {
    if (!user || !departmentsQuery.data) return [];
    
    const userRole = user.role; // role is already a string in AuthUser
    
    // Admin and leadership can view tasks for all departments
    if (userRole === 'admin' || userRole === 'leadership') {
      return departmentsQuery.data.map(dept => dept.id);
    }
    
    // Regular users can only view tasks for departments they belong to
    const userDepartmentIds: string[] = [];
    
    // AuthUser only has single department (not departments array)
    if (user.department && user.department.id) {
      userDepartmentIds.push(user.department.id);
    }
    
    return userDepartmentIds;
  }, [user, departmentsQuery.data]);

  // Dynamically create queries for tasks for accessible departments only
  const departmentTaskQueries = useQueries<Array<{ data: Task[] }>>({
    queries: (departmentsQuery.data ?? [])
      .filter(department => getAccessibleDepartmentIds.includes(department.id))
      .map(department => ({
        queryKey: ['departmentTasks', department.id],
        queryFn: () => DepartmentService.getDepartmentTasks(department.id),
        enabled: !!departmentsQuery.data && getAccessibleDepartmentIds.includes(department.id),
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
  const departmentsData = useMemo(() => departmentsQuery.data || [], [departmentsQuery.data]);
  
  // Calculate task counts per department (Memoized)
  const taskCountsByDepartment: { [key: string]: number } = useMemo(() => {
    const counts: { [key: string]: number } = {};
    (departmentsQuery.data ?? []).forEach((dept, index) => {
      const queryResult = departmentTaskQueries[index];
      counts[dept.id] = (queryResult?.isSuccess && Array.isArray(queryResult.data)) ? queryResult.data.length : 0;
    });
    return counts;
  }, [departmentsQuery.data, departmentTaskQueries]);

  const departmentsWithCounts = useMemo(() => {
    return departmentsData.map(dept => ({
      ...dept,
      tasksCount: taskCountsByDepartment[dept.id] || 0,
    }));
  }, [departmentsData, taskCountsByDepartment]);

  const handleLogout = () => {
    navigate('/login');
  };

  const handleToggleTopWidgets = useCallback(() => {
    setTopWidgetsVisible(prev => !prev);
  }, []);

  const handleCreateTask = () => {
    if (selectedDepartment) {
      setCreateTaskDialogOpen(true);
    } else {
      alert("Please select a department first.");
    }
  };

  const handleTaskCreated = () => {
    setCreateTaskDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['departmentTasks', selectedDepartment] });
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
          {error instanceof Error ? error.message : 'An unknown error occurred loading departments.'}
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
                onAddTaskClick={handleCreateTask}
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
        initialType={TaskType.DEPARTMENT}
        initialAssignedDepartmentIds={selectedDepartment ? [selectedDepartment] : []}
      />
    </Container>
  );

  return (
    <ModernDashboardLayout
      sidebar={<Sidebar open={true} onToggleDrawer={() => {}} onLogout={handleLogout} drawerWidth={DRAWER_WIDTH} />}
      topBar={<DashboardTopBar 
                username={user?.username ?? 'User'} 
                notificationCount={notifications} 
                onToggleSidebar={() => {}} 
                onNotificationClick={() => setNotifications(0)} 
                onProfileClick={() => navigate('/profile')} 
                onSettingsClick={() => navigate('/settings')} 
                onHelpClick={() => console.log('Help clicked')} 
                onLogout={handleLogout} 
                onToggleTopWidgets={handleToggleTopWidgets} 
                topWidgetsVisible={topWidgetsVisible}
              />}
      mainContent={mainContent}
      sidebarOpen={true}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default Departments;
