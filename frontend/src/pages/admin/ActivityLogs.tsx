import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  IconButton,
  Tooltip
} from '@mui/material';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import { ActivityLogsService } from '../../services/activityLogs';
import { ActivityLog } from '../../types';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import RefreshIcon from '@mui/icons-material/Refresh';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { RootState } from '../../store';

const DRAWER_WIDTH = 240;

const ActivityLogs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const calculatedTotalPages = Math.ceil(totalLogs / limit);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ActivityLogsService.getLogs({ page, limit });
        setActivityLogs(response.logs || response.data);
        setTotalLogs(response.total);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch activity logs');
        console.error('Failed to fetch activity logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, limit]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleToggleTopWidgets = useCallback(() => {
    setTopWidgetsVisible(prev => !prev);
  }, []);

  const pageContent = (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          System Activity Logs
        </Typography>
        <Box>
          <Tooltip title="Filter logs">
            <IconButton> <FilterListIcon /> </IconButton>
          </Tooltip>
          <Tooltip title="Sort logs">
            <IconButton> <SortIcon /> </IconButton>
          </Tooltip>
          <Tooltip title="Refresh logs">
            <IconButton onClick={() => setPage(1)}> <RefreshIcon /> </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && (
        <Paper sx={{ mb: 2 }}>
          <TableContainer>
            <Table stickyHeader aria-label="activity log table">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activityLogs.map((log) => (
                  <TableRow hover key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{log.username || log.user?.username || 'System'}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.details}</TableCell>
                    <TableCell>{log.ipAddress || log.ip}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Pagination
            count={calculatedTotalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            sx={{ p: 2, display: 'flex', justifyContent: 'center' }}
          />
        </Paper>
      )}
    </Box>
  );

  return (
    <ModernDashboardLayout 
      mainContent={pageContent} 
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
          onNotificationClick={() => setNotifications(0)}
          onLogout={handleLogout}
          onProfileClick={() => navigate('/profile')}
          onSettingsClick={() => navigate('/settings')}
          onHelpClick={() => console.log('Help clicked')}
          onToggleTopWidgets={handleToggleTopWidgets}
          topWidgetsVisible={topWidgetsVisible}
        />
      }
      sidebarOpen={isSidebarOpen} 
      drawerWidth={DRAWER_WIDTH} 
    />
  );
};

export default ActivityLogs;