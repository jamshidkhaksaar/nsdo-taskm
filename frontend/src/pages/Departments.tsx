import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Sidebar from '../components/Sidebar';
import DepartmentList from '../components/departments/DepartmentList';
import TasksSection from '../components/departments/TasksSection';
import { Task, TaskStatus } from '../types/task';
import { DepartmentService } from '../services/department';
import { TaskService } from '../services/task';
import { RootState } from '../store';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import { CreateTaskDialog } from '../components/tasks/CreateTaskDialog';


const DRAWER_WIDTH = 240;

const Departments: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
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
      // console.log("Recalculating department task counts..."); // Debug log
      const departmentsWithCount = departments.map(dept => {
        const count = tasks.filter(task => {
          if (!task.department) return false;
          const deptId = typeof task.department === 'object' && task.department !== null ? task.department.id : task.department;
          return deptId === dept.id;
        }).length;
        // console.log(`Department ${dept.name} (${dept.id}) count: ${count}`); // Debug log
        return { ...dept, tasksCount: count };
      });

      // Only update state if counts actually changed to prevent infinite loops
      if (JSON.stringify(departments.map(d => d.tasksCount)) !== JSON.stringify(departmentsWithCount.map(d => d.tasksCount))) {
        // console.log("Updating department counts state."); // Debug log
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
    setCreateTaskDialogOpen(true);
  };
  
  const handleTaskCreated = () => {
    // console.log("Task created, refetching data..."); // Debug log
    fetchData(); // Refetch all data
  };

  // Filter tasks based on selected department (CLIENT-SIDE FILTERING)
  const departmentTasks = tasks.filter(task => {
    // Ensure selectedDepartment exists and the task has a departmentId
    if (!selectedDepartment || !task.departmentId) { 
      return false;
    }
    // Compare the task's departmentId with the selected department ID
    return task.departmentId === selectedDepartment;
  });
  console.log(`Selected Dept: ${selectedDepartment}, Filtered Tasks Count: ${departmentTasks.length}`); // Debug log

  // Calculate upcoming, ongoing, completed based on the correctly filtered departmentTasks
  const upcomingTasks = departmentTasks.filter(task => 
    task.status === 'pending' && new Date(task.dueDate) > new Date()
  );
  
  const ongoingTasks = departmentTasks.filter(task => 
    task.status === 'in_progress' || 
    (task.status === 'pending' && new Date(task.dueDate) <= new Date())
  );
  
  const completedTasks = departmentTasks.filter(task => 
    task.status === 'completed'
  );

  const mainContent = (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {error ? (
        <Typography sx={{ color: '#f44336', textAlign: 'center', mt: 4 }}>{error}</Typography>
      ) : (
        <>
          {/* Header Section */}
          <Box mb={4}>
            <Typography variant="h4" fontWeight="bold" color="#fff" mb={1}>
              Department Management
            </Typography>
            <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
              Manage departments and assign tasks to specific teams
            </Typography>
          </Box>
           
          
          {/* Content Section */}
        <Grid container spacing={3}>
            {/* Left Column - Departments */}
            <Grid item xs={12} md={4} lg={3}>
              <DepartmentList
                departments={departments}
                selectedDepartment={selectedDepartment}
                onSelectDepartment={setSelectedDepartment}
              />
            </Grid>
            
            {/* Right Column - Department Details */}
            <Grid item xs={12} md={8} lg={9}>
              {loading && !selectedDepartment ? ( // Show loading indicator when initially loading or no department selected yet
                <Paper /* ... skeleton/placeholder styles ... */ >
                   <Typography>Loading departments...</Typography>
                </Paper>
              ) : selectedDepartment && departments.length > 0 ? (
                <>
                  {/* Department Overview Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      mb: 3
                    }}
                  >
                    <Box p={3}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h5" fontWeight="bold" color="#fff">
                            {departments.find(d => d.id === selectedDepartment)?.name || 'Department'}
                          </Typography>
                          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" mt={0.5}>
                            {departments.find(d => d.id === selectedDepartment)?.description || 'No description available'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Grid container spacing={2} mt={1}>
                        <Grid item xs={12} sm={4}>
                          <Card sx={{ 
                            background: 'linear-gradient(to right, rgba(25, 118, 210, 0.2), rgba(25, 118, 210, 0.4))',
                            border: '1px solid rgba(25, 118, 210, 0.3)',
                            borderRadius: 2,
                            height: '100%'
                          }}>
                            <CardContent>
                              <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Tasks
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={1}>
                                <AssignmentIcon sx={{ color: '#90caf9', fontSize: 36 }} />
                                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                  {loading ? <Skeleton width={40} /> : departmentTasks.length}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
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
                                  {loading ? <Skeleton width={40} /> : completedTasks.length}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Card sx={{ 
                            background: 'linear-gradient(to right, rgba(245, 124, 0, 0.2), rgba(245, 124, 0, 0.4))',
                            border: '1px solid rgba(245, 124, 0, 0.3)',
                            borderRadius: 2, 
                            height: '100%'
                          }}>
                            <CardContent>
                              <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Members
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={1}>
                                <PeopleIcon sx={{ color: '#ffcc80', fontSize: 36 }} />
                                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                  {loading ? <Skeleton width={40} /> : (departments.find(d => d.id === selectedDepartment)?.members_count || 0)}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                      
                      {/* Top Performers Section */}
                      {loading ? <Skeleton height={100} /> : topPerformers.length > 0 && (
                        <Box mt={3}>
                          <Typography variant="h6" fontWeight="bold" color="#fff" mb={2}>
                            Top Performers
                          </Typography>
                          <Grid container spacing={2}>
                            {topPerformers.slice(0, 3).map((performer) => (
                              <Grid item xs={12} sm={4} key={performer.id}>
                                <Paper 
                                  elevation={0}
                                  sx={{
                                    p: 2,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(5px)',
                                    borderRadius: 2,
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                  }}
                                >
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar 
                                      src={performer.avatar} 
                                      alt={performer.name} 
                                      sx={{ 
                                        width: 56, 
                                        height: 56,
                                        border: '2px solid rgba(255, 255, 255, 0.2)',
                                      }} 
                                    />
                                    <Box>
                                      <Typography variant="subtitle1" color="#fff" fontWeight="medium">
                                        {`${performer.first_name} ${performer.last_name}`}
                                      </Typography>
                                      <Box display="flex" alignItems="center" gap={0.5}>
                                        <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                                          {performer.completed_tasks} tasks
                                        </Typography>
                                        <Typography variant="caption" color="#4caf50" fontWeight="bold">
                                          {performer.completion_rate}%
                </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
              )}
            </Box>
                  </Paper>
                  
                  {/* Tasks Section */}
                  <Paper 
                    elevation={0}
              sx={{
                      borderRadius: 2,
                      overflow: 'auto',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                      maxHeight: '400px',
                    }}
                  >
                    <Box p={3}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="bold" color="#fff">
                          Tasks Overview
                        </Typography>
                        <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.8rem' } }}>
                          {Array.isArray(topPerformers) && topPerformers.map((performer) => (
                            <Tooltip title={`${performer.first_name} ${performer.last_name}`} key={performer.id}>
                              <Avatar alt={`${performer.first_name} ${performer.last_name}`} src={performer.avatar}>
                                {performer.first_name.charAt(0)}
                              </Avatar>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                      </Box>
              <TasksSection
                currentUserId={user?.id ? Number(user.id) : 0}
                currentDepartmentId={selectedDepartment ? Number(selectedDepartment) : 0}
                viewMode="department"
                upcomingTasks={upcomingTasks}
                ongoingTasks={ongoingTasks}
                completedTasks={completedTasks}
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
                    Select a department to view details
                  </Typography>
                  <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" textAlign="center" maxWidth="450px" mb={4}>
                    Choose a department from the list to view tasks, members, and performance metrics
                  </Typography>
                  <PeopleIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.2)' }} />
                </Paper>
              )}
            </Grid>
          </Grid>
          
          {/* Add Task Floating Action Button */}
          
          {/* Create Task Dialog */}
          <CreateTaskDialog
            open={createTaskDialogOpen}
            onClose={() => setCreateTaskDialogOpen(false)}
            onTaskCreated={handleTaskCreated}
            dialogType="assign"
            initialStatus={TaskStatus.PENDING}
            dialogMode="department"
            preSelectedDepartment={selectedDepartment || undefined}
            departmentsList={departments} 
          />
        </>
      )}
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
          username={user?.username || 'User'}
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
