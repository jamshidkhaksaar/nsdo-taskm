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
} from '@mui/material';
import {
} from '@mui/icons-material';
import { Task, TaskStatus, User, Department } from '@/types/index';
import { RootState } from '@/store';
import { TaskService } from '@/services/task';
import { UserService } from '@/services/user';
import { DepartmentService } from '@/services/department';
import Sidebar from '@/components/Sidebar';
import ModernDashboardLayout from '@/components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';

// Define DashboardSummary interface
interface DashboardSummary {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksDueToday: number;
  activeUsers: number;
  totalUsers: number;
  totalDepartments: number;
}

const TasksOverview: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(0);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);

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
  const error = usersError || departmentsError || allTasksError;

  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  useEffect(() => {
    if (!isLoading && !error && fetchedUsers && fetchedDepartments && allTasksData) {
      const totalTasks = allTasksData.length;
      const pendingTasks = allTasksData.filter(t => t.status === TaskStatus.PENDING).length;
      const inProgressTasks = allTasksData.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
      const completedTasks = allTasksData.filter(t => t.status === TaskStatus.COMPLETED).length;
      const overdueTasks = allTasksData.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length;
      const today = new Date().toISOString().split('T')[0];
      const tasksDueToday = allTasksData.filter(t => t.dueDate?.startsWith(today) && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length;

      setSummaryData({
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        tasksDueToday,
        activeUsers: fetchedUsers.filter(u => u.isActive).length,
        totalUsers: fetchedUsers.length,
        totalDepartments: fetchedDepartments.length,
      });
    }
  }, [isLoading, error, allTasksData, fetchedUsers, fetchedDepartments]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleToggleTopWidgets = useCallback(() => {
    setTopWidgetsVisible(prev => !prev);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton variant="rectangular" height={400} />;
    }
    if (error) {
      return <Alert severity="error">Error loading overview data: {error instanceof Error ? error.message : 'Unknown error'}</Alert>;
    }
    return (
      <Box p={2}>
        <Typography variant="h4">Tasks Overview</Typography>
        {summaryData && (
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography>Total Tasks: {summaryData.totalTasks}</Typography>
            <Typography>Pending: {summaryData.pendingTasks}</Typography>
            <Typography>In Progress: {summaryData.inProgressTasks}</Typography>
            <Typography>Completed: {summaryData.completedTasks}</Typography>
            <Typography>Overdue: {summaryData.overdueTasks}</Typography>
            <Typography>Due Today: {summaryData.tasksDueToday}</Typography>
            <Typography>Active Users: {summaryData.activeUsers} / {summaryData.totalUsers}</Typography>
            <Typography>Departments: {summaryData.totalDepartments}</Typography>
          </Paper>
        )}
      </Box>
    );
  };

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
      mainContent={renderContent()}
      sidebarOpen={sidebarOpen}
      drawerWidth={240}
    />
  );
};

export default TasksOverview;