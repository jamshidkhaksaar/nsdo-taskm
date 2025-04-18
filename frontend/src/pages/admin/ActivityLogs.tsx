import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  useTheme,
  Button,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { ActivityLogsService } from '../../services/activityLogs';
import { ActivityLog } from '../../services/mockActivityLogsService';

const DRAWER_WIDTH = 240;

// Add these interfaces before the component definition
interface FormattedActivityLog {
  id: string;
  user: string;
  user_id?: string;
  action: string;
  target: string;
  target_id?: string;
  details: string;
  timestamp: Date;
  ip_address: string;
  status: 'success' | 'warning' | 'error';
}

interface ActivityLogResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ActivityLogs: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  
  const [logs, setLogs] = useState<FormattedActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<FormattedActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, statusFilter, actionFilter, targetFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await ActivityLogsService.getLogs({
        page: page,
        limit: rowsPerPage,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        target: targetFilter !== 'all' ? targetFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      
      // Ensure that logs have the correct format
      const formattedLogs = response.logs.map((log: ActivityLog) => ({
        ...log,
        // Make sure user is a string, not an object
        user: typeof log.user === 'object' && log.user !== null 
          ? ((log.user as any).username || 'Unknown User') 
          : log.user || 'Unknown User',
        timestamp: new Date(log.timestamp)
      }));

      setLogs(formattedLogs);
      setFilteredLogs(formattedLogs);
      setTotalRows(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch activity logs', error);
      setError('Failed to load activity logs. Please try again later.');
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleToggleTopWidgets = () => {
    setTopWidgetsVisible(prev => !prev);
  };

  const handleLogout = () => {
    // Handle logout logic here
    navigate('/login');
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      default:
        return '#4caf50';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login':
        return '#2196f3';
      case 'logout':
        return '#9e9e9e';
      case 'create':
        return '#4caf50';
      case 'update':
        return '#ff9800';
      case 'delete':
        return '#f44336';
      case 'view':
        return '#9c27b0';
      default:
        return '#2196f3';
    }
  };

  const handleSearch = () => {
    fetchLogs();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const mainContent = (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#fff' }}>
        Activity Logs
      </Typography>
      <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
        Monitor and track user activities across the system
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ 
        mb: 4, 
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: 'none',
      }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196f3',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2196f3',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="action-filter-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Action</InputLabel>
                <Select
                  labelId="action-filter-label"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  label="Action"
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2196f3',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="all">All Actions</MenuItem>
                  <MenuItem value="login">Login</MenuItem>
                  <MenuItem value="logout">Logout</MenuItem>
                  <MenuItem value="create">Create</MenuItem>
                  <MenuItem value="update">Update</MenuItem>
                  <MenuItem value="delete">Delete</MenuItem>
                  <MenuItem value="view">View</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="target-filter-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Target</InputLabel>
                <Select
                  labelId="target-filter-label"
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value)}
                  label="Target"
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2196f3',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="all">All Targets</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="department">Department</MenuItem>
                  <MenuItem value="task">Task</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="file">File</MenuItem>
                  <MenuItem value="project">Project</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Tooltip title="Refresh activity logs">
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                sx={{
                  color: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                Refresh
              </Button>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ 
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: 'none',
      }}>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress sx={{ color: '#2196f3' }} />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>User</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Action</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Target</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Details</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Timestamp</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>IP Address</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((log) => (
                        <TableRow key={log.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
                          <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{log.user}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <Chip 
                              label={log.action} 
                              size="small" 
                              sx={{ 
                                backgroundColor: `${getActionColor(log.action)}20`,
                                color: getActionColor(log.action),
                                fontWeight: 500,
                              }} 
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{log.target}</TableCell>
                          <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{log.details}</TableCell>
                          <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{formatDate(log.timestamp.toISOString())}</TableCell>
                          <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{log.ip_address}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <Chip 
                              label={log.status} 
                              size="small" 
                              sx={{ 
                                backgroundColor: `${getStatusColor(log.status)}20`,
                                color: getStatusColor(log.status),
                                fontWeight: 500,
                              }} 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalRows}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ 
                  color: '#fff',
                  '& .MuiSvgIcon-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
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
          username={user?.username || 'Admin'}
          notificationCount={notifications}
          onToggleSidebar={handleToggleSidebar}
          onNotificationClick={() => console.log('Notification clicked')}
          onLogout={handleLogout}
          onProfileClick={() => navigate('/profile')}
          onSettingsClick={() => navigate('/admin/settings')}
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

export default ActivityLogs;