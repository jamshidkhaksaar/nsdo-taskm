import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
import { Task, DepartmentRef } from '../types/task';
import { TaskService } from '../services/task';
import { DepartmentService } from '../services/department';
import DepartmentStats from '../components/tasks-overview/DepartmentStats';
import { UserService } from '../services/user';
import { RootState } from '../store';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import { CreateTaskDialog } from '../components/tasks/CreateTaskDialog';
import { TaskStatus } from '../types/task';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title, TooltipItem } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

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

  // Task statistics
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
    completionRate: 0,
  });

  useEffect(() => {
    // Check if user is manager, general manager or admin
    if (user?.role !== 'manager' && user?.role !== 'general_manager' && user?.role !== 'admin') {
      navigate('/dashboard');
    }
    
    fetchData();
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
      const departmentData = departmentsResponse.map((dept: any) => {
        const deptTasks = tasksResponse.filter((task: Task) => {
          if (typeof task.department === 'string') {
            return task.department === dept.id;
          } else if (task.department && typeof task.department === 'object') {
            return (task.department as DepartmentRef).id === dept.id;
          }
          return false;
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
      const userData = usersResponse.map((u: any) => {
        const userTasks = tasksResponse.filter((task: Task) =>
          (task.assigned_to && task.assigned_to.includes(u.id.toString())) ||
          task.created_by === u.id.toString()
        );
        
        const completedTasks = userTasks.filter((task: Task) => task.status === 'completed').length;
        
        return {
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          role: u.role || 'user',
          taskCount: userTasks.length,
          completedTasks,
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
      const overdue = tasksResponse.filter((task: Task) =>
        (task.status === 'pending' || task.status === 'in_progress') &&
        new Date(task.due_date) < now
      ).length;
      
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
          
          {/* Summary Cards Section */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(to right, rgba(33, 150, 243, 0.2), rgba(33, 150, 243, 0.4))',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                borderRadius: 2,
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Total Tasks
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <DashboardIcon sx={{ color: '#90caf9', fontSize: 36 }} />
                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      {taskStats.total}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(to right, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.4))',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                borderRadius: 2,
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    In Progress
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <DonutLargeIcon sx={{ color: '#ffcc80', fontSize: 36 }} />
                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      {taskStats.in_progress}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
                    <CheckCircleIcon sx={{ color: '#a5d6a7', fontSize: 36 }} />
                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      {taskStats.completed}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(to right, rgba(244, 67, 54, 0.2), rgba(244, 67, 54, 0.4))',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: 2,
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Overdue
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <ErrorOutlineIcon sx={{ color: '#ef9a9a', fontSize: 36 }} />
                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      {taskStats.overdue}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Overall Completion Rate */}
          <Paper 
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              mb: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
          >
            <Box p={3}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" fontWeight="bold" color="#fff" mb={1}>
                    Overall Task Completion Rate
                  </Typography>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" mb={2}>
                    {taskStats.completed} of {taskStats.total} tasks completed
                  </Typography>
                  <Box mt={2} mb={1}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="#fff">
                        Progress
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="#fff">
                        {taskStats.completionRate.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={taskStats.completionRate}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getCompletionRateColor(taskStats.completionRate),
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box height={200} display="flex" flexDirection="column" justifyContent="center">
                    <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.7)" mb={2} textAlign="center">
                      Task Status Distribution
                    </Typography>
                    {statusChartData.map((status, index) => (
                      <Box key={index} mb={1.5}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Box display="flex" alignItems="center">
                            <Box 
                              width={12} 
                              height={12} 
                              borderRadius="50%" 
                              bgcolor={status.color} 
                              mr={1} 
                            />
                            <Typography variant="body2" color="white">
                              {status.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="bold" color="white">
                            {status.value}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(status.value / taskStats.total) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: status.color,
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
          
          {/* Analytics Section */}
          
          {/* Tabs Section */}
          <Paper 
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
          >
            <Box p={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  sx={{
                    '& .MuiTabs-indicator': {
                      backgroundColor: 'primary.main',
                    },
                    '& .MuiTab-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-selected': {
                        color: '#fff',
                      },
                    },
                  }}
                >
                  <Tab icon={<BusinessIcon />} label="Departments" iconPosition="start" />
                  <Tab icon={<GroupIcon />} label="Top Performers" iconPosition="start" />
                </Tabs>
                
                <Button
                  variant="outlined"
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
              
              {/* Departments Tab */}
              {tabValue === 0 && (
                <Grid container spacing={3}>
                  {departmentData.map((dept, index) => (
                    <Grid item xs={12} sm={6} md={4} key={dept.id}>
                      <Card 
                        sx={{ 
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: 2, 
                          height: '100%'
                        }}
                      >
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="h6" color="#fff" fontWeight="medium">
                              {dept.name}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDepartmentView(dept.id)}
                              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>
                          
                          <Box display="flex" justifyContent="space-between" mt={2}>
                            <Box>
                              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                Tasks
                              </Typography>
                              <Typography variant="h5" color="#fff" fontWeight="bold">
                                {dept.taskCount}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                Completed
                              </Typography>
                              <Typography variant="h5" color="#4CAF50" fontWeight="bold">
                                {dept.completedTasks}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box mt={2}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                Completion
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="#fff">
                                {dept.completionRate.toFixed(1)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={dept.completionRate}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getCompletionRateColor(dept.completionRate),
                                },
                              }}
                            />
                          </Box>
                          
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{
                              mt: 3,
                              color: 'white',
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              '&:hover': {
                                borderColor: 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              },
                            }}
                            onClick={() => handleDepartmentView(dept.id)}
                          >
                            View Department
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              {/* Top Performers Tab */}
              {tabValue === 1 && (
                <Grid container spacing={3}>
                  {topPerformers.map((user, index) => (
                    <Grid item xs={12} sm={6} md={4} key={user.id}>
                      <Card 
                        sx={{ 
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: 2, 
                          height: '100%'
                        }}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Avatar
                              src={user.avatar}
                              alt={user.name}
                              sx={{
                                width: 56,
                                height: 56,
                                border: '2px solid rgba(255, 255, 255, 0.2)',
                              }}
                            >
                              {user.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" color="#fff" fontWeight="medium">
                                {user.name}
                              </Typography>
                              <Chip 
                                label={user.role} 
                                size="small"
                                sx={{ 
                                  bgcolor: getRoleColor(user.role),
                                  color: '#fff',
                                  fontSize: '0.7rem',
                                }}
                              />
                            </Box>
                          </Box>
                          
                          <Box display="flex" justifyContent="space-between" mt={2}>
                            <Box>
                              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                Assigned
                              </Typography>
                              <Typography variant="h5" color="#fff" fontWeight="bold">
                                {user.taskCount}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                Completed
                              </Typography>
                              <Typography variant="h5" color="#4CAF50" fontWeight="bold">
                                {user.completedTasks}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box mt={2}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                Completion Rate
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="#fff">
                                {user.completionRate.toFixed(1)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={user.completionRate}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getCompletionRateColor(user.completionRate),
                                },
                              }}
                            />
                          </Box>
                          
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{
                              mt: 3,
                              color: 'white',
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              '&:hover': {
                                borderColor: 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              },
                            }}
                            onClick={() => handleUserView(user.id)}
                          >
                            View Profile
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Paper>
          
          {/* Create Task Dialog */}
          <CreateTaskDialog
            open={createTaskDialogOpen}
            onClose={() => setCreateTaskDialogOpen(false)}
            onTaskCreated={handleTaskCreated}
            dialogType="assign"
            initialStatus={TaskStatus.PENDING}
            dialogMode={selectedDepartment ? 'department' : (selectedUser ? 'user' : undefined)}
            preSelectedDepartment={selectedDepartment || undefined}
          />
          
          {/* Floating Action Button */}
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
      sidebarOpen={sidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default TasksOverview;