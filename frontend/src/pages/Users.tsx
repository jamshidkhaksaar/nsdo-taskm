import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from 'react-query';
import {
  Box,
  Container,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  Avatar,
  Tooltip,
  Fab,
  LinearProgress,
  Skeleton,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import Sidebar from '../components/Sidebar';
import UserList from '../components/users/UserList';
import TasksSection from '../components/departments/TasksSection';
import { Task, TaskStatus, TaskType } from '../types/index';
import { User } from '../types/user';
import { UserService } from '../services/user';
import { TaskService } from '../services/task';
import { RootState } from '../store';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import CreateTaskDialog from '../components/tasks/CreateTaskDialog';


const DRAWER_WIDTH = 240;

const Users: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(3);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for task dialog
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);

  // START: Add state for user selection for task assignment
  const [selectedUserIdsForTask, setSelectedUserIdsForTask] = useState<string[]>([]);
  // END: Add state

  // START: Handler for UserList checkbox changes
  const handleSelectedUsersChange = (ids: string[]) => {
    setSelectedUserIdsForTask(ids);
  };
  // END: Handler

  // --- React Query Hooks ---
  const { data: users = [], isLoading: isLoadingUsers, error: fetchUsersError } = 
    useQuery<User[], Error>('users', UserService.getUsers, {
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        onError: (err) => {
            console.error('Failed to load users:', err);
            setError(`Failed to load users: ${err.message}`); // Set local error state
        },
        onSuccess: (data) => {
            // Select first user by default if none is selected and data is available
            if (!selectedUser && data && data.length > 0) {
                setSelectedUser(data[0].id);
            }
        }
    });

  // Fetch all tasks - adjust if only specific user tasks are needed
  const { data: tasks = [], isLoading: isLoadingTasks, error: fetchTasksError } = 
    useQuery<Task[], Error>(
      'allTasksForUsersPage', 
      () => TaskService.getTasks(), // Wrap service call in arrow function
      { 
        staleTime: 2 * 60 * 1000, 
        onError: (err) => {
            console.error('Failed to load tasks:', err);
            setError(`Failed to load tasks: ${err.message}`);
        },
    });

  // Combined loading state and error handling
  const isLoading = isLoadingUsers || isLoadingTasks;
  // Ensure combinedError is always an Error object or null/undefined for consistent access
  const combinedError = fetchUsersError || fetchTasksError || (error ? new Error(error) : null);

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

  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleCreateTask = () => {
      // This handler is now for the multi-user assignment button
      if (selectedUserIdsForTask.length > 0) {
          setCreateTaskDialogOpen(true);
      } else {
          alert("Please select at least one user to assign a task.");
      }
  };
  
  const handleTaskCreated = () => {
    // Invalidate the query fetching all tasks for this page
    queryClient.invalidateQueries('allTasksForUsersPage'); 
    
    // ALSO invalidate the query used by the Dashboard
    queryClient.invalidateQueries('dashboardTasks'); // Assuming this is the key used in Dashboard.tsx
    
    setSelectedUserIdsForTask([]); // Reset selection
    setCreateTaskDialogOpen(false); // Close dialog
  };

  // Update calculations to use data from useQuery
  const selectedUserData = selectedUser 
    ? users.find((u: User) => u.id === selectedUser) // Use 'users' from useQuery
    : users.length > 0 
      ? users[0] 
      : null;

  // Update task filtering logic based on central Task type
  const userTasks = selectedUser 
    ? tasks.filter(task => // Use 'tasks' from useQuery
        // Check assignedToUsers relation (array of User objects)
        task.assignedToUsers?.some(assignee => String(assignee.id) === String(selectedUser)) || 
        // Check createdById
        String(task.createdById) === String(selectedUser)
      ) 
    : [];

  const userCompletedTasks = userTasks.filter(task => task.status === 'completed');
  const userOngoingTasks = userTasks.filter(task => task.status === 'in_progress');
  const userPendingTasks = userTasks.filter(task => task.status === 'pending');

  // Create user summary data
  const userSummaryData = selectedUserData ? {
    username: (selectedUserData as any).username,
    first_name: (selectedUserData as any).first_name,
    last_name: (selectedUserData as any).last_name,
    email: (selectedUserData as any).email,
    role: (selectedUserData as any).role || 'User',
    avatar: (selectedUserData as any).avatar,
    totalTasks: userTasks.length,
    completedTasks: userCompletedTasks.length,
    ongoingTasks: userOngoingTasks.length,
    completionRate: userTasks.length > 0 
      ? Math.round((userCompletedTasks.length / userTasks.length) * 100) 
      : 0
  } : null;

  // Filter users based on search query (client-side example)
  const filteredUsers = users.filter(u => // Use 'users' from useQuery
      (u.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.last_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mainContent = (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {isLoading ? (
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
      ) : combinedError ? (
        <Alert severity="error" sx={{ m: 3 }}>{combinedError.message || 'An unknown error occurred.'}</Alert>
      ) : (
        <>
          {/* Header Section */}
          <Box mb={4}>
            <Typography variant="h4" fontWeight="bold" color="#fff" mb={1}>
              User Management
            </Typography>
            <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
              Manage users and assign tasks to specific team members
            </Typography>
           
          </Box>
          
          {/* START: Add Assign Task Button */}    
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained"
              startIcon={<AssignmentIcon />}
              disabled={selectedUserIdsForTask.length === 0}
              onClick={handleCreateTask} // Reuse handler, now context is multi-user
            >
              Assign Task to Selected ({selectedUserIdsForTask.length})
            </Button>
          </Box>
          {/* END: Add Assign Task Button */}    

          <Grid container spacing={3}>
            {/* Left Column - User List */}
            <Grid item xs={12} md={4} lg={3}>
              <Paper 
                elevation={0}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  height: '100%',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
              >
                <UserList 
                  users={filteredUsers} 
                  selectedUser={selectedUser}
                  onSelectUser={handleSelectUser}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  selectedUserIds={selectedUserIdsForTask}
                  onSelectedUsersChange={handleSelectedUsersChange}
                />
              </Paper>
            </Grid>
            
            {/* Right Column - User Details and Tasks */}
            <Grid item xs={12} md={8} lg={9}>
              {selectedUserData ? (
                <>
                  {/* User Profile Card */}
                  <Paper 
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      mb: 3,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <Box p={3}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box display="flex" gap={3}>
                          <Avatar
                            src={userSummaryData?.avatar}
                            alt={userSummaryData?.username}
                            sx={{
                              width: 100,
                              height: 100,
                              border: '3px solid rgba(255, 255, 255, 0.2)',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                            }}
                          >
                            {userSummaryData?.first_name ? userSummaryData.first_name.charAt(0) : userSummaryData?.username.charAt(0)}
                          </Avatar>
                          
                          <Box>
                            <Typography variant="h4" fontWeight="bold" color="#fff" mb={0.5}>
                              {userSummaryData?.first_name && userSummaryData?.last_name 
                                ? `${userSummaryData.first_name} ${userSummaryData.last_name}` 
                                : userSummaryData?.username}
                            </Typography>
                            
                            <Chip 
                              icon={<VerifiedUserIcon />} 
                              label={userSummaryData?.role} 
                              size="small"
                              sx={{ 
                                bgcolor: getRoleColor(userSummaryData?.role),
                                color: '#fff',
                                mb: 2,
                                fontWeight: 'medium',
                                '& .MuiChip-icon': { 
                                  color: '#fff' 
                                }
                              }}
                            />
                            
                            <Box display="flex" flexDirection="column" gap={1}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <EmailIcon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                  {userSummaryData?.email}
                                </Typography>
                              </Box>
                              
                              <Box display="flex" alignItems="center" gap={1}>
                                <AssignmentIcon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                  {userSummaryData?.totalTasks} Tasks assigned
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                      
                      <Grid container spacing={2}>
                        {/* Stats Cards */}
                        <Grid item xs={12} md={8}>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Card sx={{ 
                                background: 'linear-gradient(to right, rgba(25, 118, 210, 0.2), rgba(25, 118, 210, 0.4))',
                                border: '1px solid rgba(25, 118, 210, 0.3)',
                                borderRadius: 2,
                                height: '100%'
                              }}>
                                <CardContent>
                                  <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Total Tasks
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                                    <AssignmentIcon sx={{ color: '#90caf9', fontSize: 36 }} />
                                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                      {userSummaryData?.totalTasks || 0}
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={4}>
                              <Card sx={{ 
                                background: 'linear-gradient(to right, rgba(245, 124, 0, 0.2), rgba(245, 124, 0, 0.4))',
                                border: '1px solid rgba(245, 124, 0, 0.3)',
                                borderRadius: 2, 
                                height: '100%'
                              }}>
                                <CardContent>
                                  <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    In Progress
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                                    <WorkIcon sx={{ color: '#ffcc80', fontSize: 36 }} />
                                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                      {userSummaryData?.ongoingTasks || 0}
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={4}>
                              <Card sx={{ 
                                background: 'linear-gradient(to right, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.4))',
                                border: '1px solid rgba(76, 175, 80, 0.3)',
                                borderRadius: 2, 
                                height: '100%'
                              }}>
                                <CardContent>
                                  <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Completed
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                                    <WorkIcon sx={{ color: '#a5d6a7', fontSize: 36 }} />
                                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                      {userSummaryData?.completedTasks || 0}
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          </Grid>
                        </Grid>
                        
                        {/* Completion Rate */}
                        <Grid item xs={12} md={4}>
                          <Card sx={{ 
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: 2, 
                            height: '100%'
                          }}>
                            <CardContent>
                              <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Completion Rate
                              </Typography>
                              <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" mt={1}>
                                <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                                  {userSummaryData?.completionRate || 0}%
                                </Typography>
                                <Box width="100%" mt={1}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={userSummaryData?.completionRate || 0}
                                    sx={{
                                      height: 10,
                                      borderRadius: 5,
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: getCompletionRateColor(userSummaryData?.completionRate || 0),
                                      },
                                    }}
                                  />
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                  
                  {/* Tasks Overview */}
                  <Paper 
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <Box p={3}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="bold" color="#fff">
                          Assigned Tasks
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={handleCreateTask}
                          sx={{
                            color: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            '&:hover': {
                              borderColor: 'white',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          New Task
                        </Button>
                      </Box>
                      
                      <TasksSection 
                        currentUserId={selectedUser ? parseInt(selectedUser) : 0}
                        currentDepartmentId={0}
                        viewMode="user"
                        upcomingTasks={userPendingTasks}
                        ongoingTasks={userOngoingTasks}
                        completedTasks={userCompletedTasks}
                        onAddTask={handleCreateTask}
                        showAddButton={true}
                      />
                    </Box>
                  </Paper>
                </>
              ) : (
                <Paper 
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    height: '50vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <Typography variant="h5" color="#fff" textAlign="center" mb={2}>
                    Select a user to view details
                  </Typography>
                  <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" textAlign="center" maxWidth="450px" mb={4}>
                    Choose a user from the list to view details, metrics, and assigned tasks
                  </Typography>
                  <PersonIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.2)' }} />
                </Paper>
              )}
            </Grid>
          </Grid>
          
          {/* Floating Action Button */}
          
          {/* Create Task Dialog (now handles multi-user assignment) */}
          <CreateTaskDialog
            open={createTaskDialogOpen}
            onClose={() => setCreateTaskDialogOpen(false)}
            onTaskCreated={handleTaskCreated}
            dialogType="assign"
            initialAssignedUserIds={selectedUserIdsForTask}
            initialType={TaskType.USER}
          />
        </>
      )}
    </Container>
  );

  // Helper function to get color based on role
  function getRoleColor(role?: string) {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'rgba(156, 39, 176, 0.8)'; // Purple
      case 'general_manager':
        return 'rgba(3, 169, 244, 0.8)'; // Light Blue
      case 'manager':
        return 'rgba(0, 150, 136, 0.8)'; // Teal
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

export default Users;
