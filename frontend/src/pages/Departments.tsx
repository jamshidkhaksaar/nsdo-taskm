import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Grid,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  CircularProgress,
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
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Sidebar from '../components/Sidebar';
import DepartmentList from '../components/departments/DepartmentList';
import DepartmentSummary from '../components/departments/DepartmentSummary';
import TasksSection from '../components/departments/TasksSection';
import Footer from '../components/Footer';
import { Task } from '../types/task';
import { DepartmentService } from '../services/department';
import { TaskService } from '../services/task';
import { RootState } from '../store';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import { CreateTaskDialog } from '../components/tasks/CreateTaskDialog';
import { TaskStatus } from '../types/task';

const DRAWER_WIDTH = 240;

const Departments: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(3);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // State for data
  const [departments, setDepartments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for task dialog
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  // Fetch departments and tasks
  useEffect(() => {
    fetchData();
  }, [selectedDepartment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch departments
      const departmentsResponse = await DepartmentService.getDepartments();
      setDepartments(departmentsResponse);

      // If a department is selected, fetch its tasks
      if (selectedDepartment) {
        const tasksResponse = await TaskService.getDepartmentTasks(selectedDepartment);
        setTasks(tasksResponse);
        
        // Fetch top performers for the selected department
        const performersResponse = await DepartmentService.getDepartmentPerformers(selectedDepartment);
        setTopPerformers(performersResponse);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Handle logout logic here
    navigate('/login');
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNotificationClick = () => {
    setNotifications(0);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
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
  };

  // Filter tasks based on selected department
  const departmentTasks = tasks.filter(task => {
    if (!selectedDepartment) return false;
    return task.department === selectedDepartment;
  });

  const upcomingTasks = departmentTasks.filter(task => 
    task.status === 'pending' && new Date(task.due_date) > new Date()
  );
  
  const ongoingTasks = departmentTasks.filter(task => 
    task.status === 'in_progress' || 
    (task.status === 'pending' && new Date(task.due_date) <= new Date())
  );
  
  const completedTasks = departmentTasks.filter(task => 
    task.status === 'completed'
  );

  const mainContent = (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <img src="/loading-animation.gif" alt="Loading..." style={{ width: '50px', height: '50px' }} />
        </Box>
      ) : error ? (
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
                <Box p={2} pb={1.5} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold" color="#fff">
                    Departments
                  </Typography>
                  <Chip 
                    label={departments.length}
                    sx={{ 
                      background: 'rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontWeight: 'bold',
                    }} 
                  />
                </Box>
                <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
                <Box>
              <DepartmentList
                departments={departments}
                selectedDepartment={selectedDepartment}
                onSelectDepartment={setSelectedDepartment}
              />
            </Box>
              </Paper>
          </Grid>
            
            {/* Right Column - Department Details */}
            <Grid item xs={12} md={8} lg={9}>
              {selectedDepartment && departments.length > 0 ? (
                <>
                  {/* Department Overview Card */}
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
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h5" fontWeight="bold" color="#fff">
                            {departments.find(d => d.id === selectedDepartment)?.name || 'Department'}
                          </Typography>
                          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" mt={0.5}>
                            {departments.find(d => d.id === selectedDepartment)?.description || 'No description available'}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleCreateTask}
                          sx={{
                            backgroundColor: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'primary.dark',
                            },
                            textTransform: 'none',
                            borderRadius: 8,
                            px: 3,
                            py: 1,
                          }}
                        >
                          Assign Task
                        </Button>
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
                                  {departmentTasks.length}
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
                                  {completedTasks.length}
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
                                  {departments.find(d => d.id === selectedDepartment)?.members_count || 0}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                      
                      {/* Top Performers Section */}
                      {topPerformers.length > 0 && (
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
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                      height: '100%',
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
          <Tooltip title="Create New Task" placement="left">
            <Fab 
              color="primary" 
              aria-label="add"
              onClick={handleCreateTask}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
          
          {/* Create Task Dialog */}
          <CreateTaskDialog
            open={createTaskDialogOpen}
            onClose={() => setCreateTaskDialogOpen(false)}
            onTaskCreated={handleTaskCreated}
            dialogType="assign"
            initialStatus={TaskStatus.PENDING}
          />
        </>
      )}
    </Container>
  );

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
        />
      }
      mainContent={mainContent}
      sidebarOpen={sidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default Departments;
