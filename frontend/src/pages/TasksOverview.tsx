import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Skeleton,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Container,
  Button,
} from '@mui/material';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import { Task, TaskStatus, User, Department } from '@/types/index';
import { RootState } from '@/store';
import { TaskService } from '@/services/task';
import { UserService } from '@/services/user';
import { DepartmentService } from '@/services/department';
import Sidebar from '@/components/Sidebar';
import ModernDashboardLayout from '@/components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';
import api from '../utils/axios';
import { format } from 'date-fns';

// Define interfaces for the expected data structure from the backend
interface OverallCountsDto {
  totalTasks: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  delegated: number;
  overdue: number;
  dueToday: number;
  activeUsers: number;
  totalDepartments: number;
}

// Add DepartmentStatsDto interface matching backend
interface DepartmentStatsDto {
  departmentId: string;
  departmentName: string;
  counts: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    total: number;
  };
}

// Add UserTaskStatsDto interface matching backend
interface UserTaskStatsDto {
  userId: string;
  username: string;
  counts: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    totalAssigned: number;
  };
}

// Add ProvinceStatsDto interface matching backend
interface ProvinceStatsDto {
  provinceId: string;
  provinceName: string;
  counts: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    total: number;
  };
}

interface TaskOverviewStatsDto {
  overallCounts: OverallCountsDto;
  departmentStats: DepartmentStatsDto[];
  userStats: UserTaskStatsDto[];
  provinceStats: ProvinceStatsDto[];
  overdueTasks: Task[];
}

const REQUIRED_PERMISSION = "page:view:tasks_overview";

const TasksOverview: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, token } = useSelector((state: RootState) => state.auth);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpenState');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [notifications, setNotifications] = useState(0);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);
  const [stats, setStats] = useState<TaskOverviewStatsDto | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const { data: fetchedUsers = [], isLoading: isLoadingUsers, error: usersError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: UserService.getUsers,
  });

  const { data: fetchedDepartments = [], isLoading: isLoadingDepartments, error: departmentsError } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: DepartmentService.getDepartments,
  });

  const { data: allTasksData = [], isLoading: isLoadingAllTasks, error: allTasksError } = useQuery<Task[]>({
    queryKey: ['allTasksForOverview'],
    queryFn: () => TaskService.getTasks({}),
  });

  const isLoading = isLoadingUsers || isLoadingDepartments || isLoadingAllTasks;
  const errorCombined = usersError || departmentsError || allTasksError;

  useEffect(() => {
    if (!currentUser || !token) {
      navigate('/login');
      return;
    }

    let userPermissions: string[] = [];
    if (currentUser.role && typeof currentUser.role === 'object' && Array.isArray(currentUser.role.permissions)) {
        userPermissions = currentUser.role.permissions.map(p => p.name);
    }
    
    if (userPermissions.includes(REQUIRED_PERMISSION)) {
      setHasAccess(true);
    } else {
      console.warn(`User ${currentUser.username} (Role: ${typeof currentUser.role === 'object' ? currentUser.role.name : currentUser.role}) does not have permission: ${REQUIRED_PERMISSION}`);
      setHasAccess(false);
    }
  }, [currentUser, token, navigate]);

  useEffect(() => {
    if (hasAccess !== true) return;

    const fetchOverviewStats = async () => {
      setLoadingStats(true);
      setStatsError(null);
      try {
        const response = await api.get<TaskOverviewStatsDto>('/admin/dashboard/tasks-overview');
        setStats(response.data);
      } catch (err: any) {
        console.error("Error fetching task overview stats:", err);
        setStatsError(err.response?.data?.message || err.message || 'Failed to fetch overview statistics.');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchOverviewStats();
  }, [hasAccess]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarOpenState', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const handleLogout = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleToggleTopWidgets = useCallback(() => {
    setTopWidgetsVisible(prev => !prev);
  }, []);

  const formatAssignees = (task: Task): string => {
    let assignees: string[] = [];
    if (task.assignedToUsers && task.assignedToUsers.length > 0) {
      assignees.push(...task.assignedToUsers.map(u => u.username));
    }
    if (task.assignedToDepartments && task.assignedToDepartments.length > 0) {
      assignees.push(...task.assignedToDepartments.map(d => `${d.name} (Dept)`));
    }
    return assignees.length > 0 ? assignees.join(', ') : 'Unassigned';
  };

  const renderActualContent = () => {
    if (loadingStats) {
      return <Box sx={{ p: 3, textAlign: 'center'}}><CircularProgress /></Box>;
    }
    if (statsError) {
      return <Alert severity="error" sx={{ m: 3 }}>{statsError}</Alert>;
    }
    if (!stats) {
        return <Typography sx={{p: 3, color: 'text.secondary'}}>No statistics available.</Typography>;
    }
    
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
          Tasks Overview Dashboard
        </Typography>

        {stats && (
          <Box>
            {/* Section A: Overall Summary Cards */}
            <Typography variant="h5" gutterBottom sx={{ color: '#eee', mt: 2, mb: 2 }}>
              Overall Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6">Total Tasks</Typography>
                    <Typography variant="h4">{stats.overallCounts.totalTasks}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6">Pending</Typography>
                    <Typography variant="h4">{stats.overallCounts.pending}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6">In Progress</Typography>
                    <Typography variant="h4">{stats.overallCounts.inProgress}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6">Completed</Typography>
                    <Typography variant="h4">{stats.overallCounts.completed}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'orange' }}>Overdue</Typography>
                    <Typography variant="h4" sx={{ color: 'orange' }}>{stats.overallCounts.overdue}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6">Due Today</Typography>
                    <Typography variant="h4">{stats.overallCounts.dueToday}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6">Active Users</Typography>
                    <Typography variant="h4">{stats.overallCounts.activeUsers}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6">Departments</Typography>
                    <Typography variant="h4">{stats.overallCounts.totalDepartments}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Section B: Department Performance Table */}
            <Typography variant="h5" gutterBottom sx={{ color: '#eee', mt: 4, mb: 2 }}>
              Department Performance
            </Typography>
            {stats.departmentStats && stats.departmentStats.length > 0 ? (
              <TableContainer component={Paper} sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                <Table aria-label="department performance table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#ccc', fontWeight: 'bold' }}>Department</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>Pending</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>In Progress</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>Completed</TableCell>
                      <TableCell align="right" sx={{ color: 'orange', fontWeight: 'bold' }}>Overdue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.departmentStats.map((dept) => (
                      <TableRow key={dept.departmentId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" scope="row" sx={{ color: '#fff' }}>
                          {dept.departmentName}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{dept.counts.total}</TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{dept.counts.pending}</TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{dept.counts.inProgress}</TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{dept.counts.completed}</TableCell>
                        <TableCell align="right" sx={{ color: dept.counts.overdue > 0 ? 'orange' : '#fff' }}>{dept.counts.overdue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No department task data available.</Alert>
            )}
            
            {/* Section C: User Performance Table */}
            <Typography variant="h5" gutterBottom sx={{ color: '#eee', mt: 4, mb: 2 }}>
              User Performance
            </Typography>
            {stats.userStats && stats.userStats.length > 0 ? (
              <TableContainer component={Paper} sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                <Table aria-label="user performance table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#ccc', fontWeight: 'bold' }}>User</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>Total Assigned</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>Pending</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>In Progress</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>Completed</TableCell>
                      <TableCell align="right" sx={{ color: 'orange', fontWeight: 'bold' }}>Overdue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.userStats.map((userStat) => (
                      <TableRow key={userStat.userId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" scope="row" sx={{ color: '#fff' }}>
                          {userStat.username}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{userStat.counts.totalAssigned}</TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{userStat.counts.pending}</TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{userStat.counts.inProgress}</TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{userStat.counts.completed}</TableCell>
                        <TableCell align="right" sx={{ color: userStat.counts.overdue > 0 ? 'orange' : '#fff' }}>{userStat.counts.overdue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No user task data available.</Alert>
            )}

            {/* Section D: Province Performance Table */}
            <Typography variant="h5" gutterBottom sx={{ color: '#eee', mt: 4, mb: 2 }}>
              Province Performance
            </Typography>
            {stats.provinceStats && stats.provinceStats.length > 0 ? (
              <TableContainer component={Paper} sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                <Table aria-label="province performance table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#ccc', fontWeight: 'bold' }}>Province</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>Total Tasks</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>Pending</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>In Progress</TableCell>
                      <TableCell align="right" sx={{ color: '#ccc', fontWeight: 'bold' }}>Completed</TableCell>
                      <TableCell align="right" sx={{ color: 'orange', fontWeight: 'bold' }}>Overdue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.provinceStats.map((provStat) => (
                      <TableRow key={provStat.provinceId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" scope="row" sx={{ color: '#fff' }}>
                          {provStat.provinceName}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{provStat.counts.total}</TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{provStat.counts.pending}</TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{provStat.counts.inProgress}</TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>{provStat.counts.completed}</TableCell>
                        <TableCell align="right" sx={{ color: provStat.counts.overdue > 0 ? 'orange' : '#fff' }}>{provStat.counts.overdue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No province task data available.</Alert>
            )}

            {/* Section E: Overdue Tasks List */}
            <Typography variant="h5" gutterBottom sx={{ color: '#eee', mt: 4, mb: 2 }}>
              Overdue Tasks (Oldest First)
            </Typography>
            {stats.overdueTasks && stats.overdueTasks.length > 0 ? (
              <TableContainer component={Paper} sx={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                <Table aria-label="overdue tasks table" size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#ccc', fontWeight: 'bold' }}>Title</TableCell>
                      <TableCell sx={{ color: '#ccc', fontWeight: 'bold' }}>Due Date</TableCell>
                      <TableCell sx={{ color: '#ccc', fontWeight: 'bold' }}>Assignee(s)/Dept(s)</TableCell>
                      <TableCell sx={{ color: '#ccc', fontWeight: 'bold' }}>Created By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.overdueTasks.map((task) => (
                      <TableRow key={task.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" scope="row" sx={{ color: '#fff' }}>
                          {task.title}
                        </TableCell>
                        <TableCell sx={{ color: 'orange' }}>
                          {task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>{formatAssignees(task)}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{task.createdBy?.username ?? 'Unknown'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No overdue tasks found.</Alert>
            )}

          </Box>
        )}
      </Box>
    );
  };

  if (hasAccess === null) {
    return (
      <ModernDashboardLayout
        sidebar={<Sidebar open={sidebarOpen} onToggleDrawer={handleToggleSidebar} onLogout={handleLogout} drawerWidth={240} />}
        topBar={<DashboardTopBar 
                  username={currentUser?.username ?? 'User'} 
                  notificationCount={notifications}
                  onToggleSidebar={handleToggleSidebar}
                  onNotificationClick={() => setNotifications(0)}
                  onProfileClick={() => navigate('/profile')}
                  onSettingsClick={() => navigate('/settings')}
                  onHelpClick={() => console.log('Help clicked')}
                  onLogout={handleLogout}
                  onToggleTopWidgets={handleToggleTopWidgets}
                  topWidgetsVisible={topWidgetsVisible}
                />}
        mainContent={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
          </Box>
        }
        sidebarOpen={sidebarOpen}
        drawerWidth={240}
      />
    );
  }

  if (hasAccess === false) {
    return (
      <ModernDashboardLayout
        sidebar={<Sidebar open={sidebarOpen} onToggleDrawer={handleToggleSidebar} onLogout={handleLogout} drawerWidth={240} />}
        topBar={<DashboardTopBar 
                  username={currentUser?.username ?? 'User'} 
                  notificationCount={notifications}
                  onToggleSidebar={handleToggleSidebar}
                  onNotificationClick={() => setNotifications(0)}
                  onProfileClick={() => navigate('/profile')}
                  onSettingsClick={() => navigate('/settings')}
                  onHelpClick={() => console.log('Help clicked')}
                  onLogout={handleLogout}
                  onToggleTopWidgets={handleToggleTopWidgets}
                  topWidgetsVisible={topWidgetsVisible}
                />}
        mainContent={
          <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
            <GppBadOutlinedIcon sx={{ fontSize: 80, color: 'error.main' }} />
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'error.main' }}>
              Access Denied
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              You do not have the required permission ({REQUIRED_PERMISSION}) to view this page.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ mt: 3 }}>
              Go to Dashboard
            </Button>
          </Container>
        }
        sidebarOpen={sidebarOpen}
        drawerWidth={240}
      />
    );
  }

  return (
    <ModernDashboardLayout
      sidebar={<Sidebar open={sidebarOpen} onToggleDrawer={handleToggleSidebar} onLogout={handleLogout} drawerWidth={240} />}
      topBar={<DashboardTopBar 
                username={currentUser?.username ?? 'User'} 
                notificationCount={notifications}
                onToggleSidebar={handleToggleSidebar}
                onNotificationClick={() => setNotifications(0)}
                onProfileClick={() => navigate('/profile')}
                onSettingsClick={() => navigate('/settings')}
                onHelpClick={() => console.log('Help clicked')}
                onLogout={handleLogout}
                onToggleTopWidgets={handleToggleTopWidgets}
                topWidgetsVisible={topWidgetsVisible}
              />}
      mainContent={renderActualContent()}
      sidebarOpen={sidebarOpen}
      drawerWidth={240}
    />
  );
};

export default TasksOverview;