import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Divider,
  Tooltip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Container,
  Snackbar
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HelpIcon from '@mui/icons-material/Help';
import axios from '../../utils/axios';
import { refreshAccessToken } from '../../utils/authUtils';
import { ApiHealthService } from '../../services/apiHealthService';
import { StatusType } from '../../services/mockApiHealthService';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { standardBackgroundStyle } from '../../utils/backgroundStyles';

// Define endpoint groups for testing
const API_ENDPOINTS = {
  core: [
    { name: 'Health Check', endpoint: '/api/health', method: 'GET', requiresAuth: false },
    { name: 'Authentication', endpoint: '/api/auth/login', method: 'POST', requiresAuth: false, payload: { username: 'admin', password: 'admin123' } }
  ],
  tasks: [
    { name: 'Get All Tasks', endpoint: '/api/tasks', method: 'GET', requiresAuth: true },
    { name: 'Task Statistics', endpoint: '/api/tasks/user/:userId/statistics', method: 'GET', requiresAuth: true, dynamicParams: true, optional: true, fallbackMessage: 'This endpoint is not implemented in the current backend version' }
  ],
  departments: [
    { name: 'Get All Departments', endpoint: '/api/departments', method: 'GET', requiresAuth: true },
    { name: 'Department Performance', endpoint: '/api/departments/:id/performance', method: 'GET', requiresAuth: true, dynamicParams: true, optional: true, fallbackMessage: 'This endpoint may not be implemented or the department ID does not exist' }
  ],
  admin: [
    { name: 'Admin Dashboard', endpoint: '/api/admin/dashboard', method: 'GET', requiresAuth: true },
    { name: 'Admin Health', endpoint: '/api/admin/health', method: 'GET', requiresAuth: true },
    { name: 'User Management', endpoint: '/api/admin/users', method: 'GET', requiresAuth: true },
    { name: 'System Logs', endpoint: '/api/admin/logs', method: 'GET', requiresAuth: true }
  ],
  database: [
    { name: 'Database Connection', endpoint: '/api/health', method: 'GET', requiresAuth: false, checkDatabaseStatus: true }
  ]
};

// Result interface
interface EndpointResult {
  name: string;
  endpoint: string;
  status: StatusType;
  statusCode?: number;
  responseTime: number;
  message: string;
  lastChecked: Date;
}

// Group result interface
interface GroupResult {
  name: string;
  status: StatusType;
  endpoints: EndpointResult[];
  successRate: number;
}

// System health interface
interface SystemHealth {
  timestamp: string;
  status: string;
  database: {
    connected: boolean;
    tables: {
      users: number;
      departments: number;
      tasks: number;
    }
  };
  system: {
    uptime: number;
    memory: {
      total: number;
      used: number;
      rss: number;
      external: number;
    };
    node: {
      version: string;
      platform: string;
      arch: string;
    }
  };
  api: {
    endpoints: Array<{
      name: string;
      path: string;
      status: string;
    }>;
    errors: any[];
  };
  environment: {
    nodeEnv: string;
    port: number;
    dbType: string;
  }
}

const ApiHealthDashboard: React.FC = () => {
  const theme = useTheme();
  // Used for responsive design, will be used in future updates
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // User info is retrieved from Redux for authentication purposes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const DRAWER_WIDTH = 240;
  const [results, setResults] = useState<Record<string, GroupResult>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [overallStatus, setOverallStatus] = useState<StatusType>('unknown');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [databaseStatus, setDatabaseStatus] = useState<StatusType>('unknown');
  const [databaseMessage, setDatabaseMessage] = useState<string>('Not checked yet');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Function to check a single endpoint
  const checkEndpoint = async (
    groupKey: string, 
    endpointInfo: any, 
    index: number
  ): Promise<EndpointResult> => {
    try {
      // Use the ApiHealthService to check the endpoint
      const result = await ApiHealthService.checkEndpoint(groupKey, endpointInfo);
      
      // Convert the result to the expected format
      return {
        name: result.name,
        endpoint: result.endpoint,
        status: result.status,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        message: result.message,
        lastChecked: result.lastChecked
      };
    } catch (error) {
      console.error(`Error checking endpoint ${endpointInfo.name}:`, error);
      
      // Return an error result
      return {
        name: endpointInfo.name,
        endpoint: endpointInfo.endpoint,
        status: 'error',
        responseTime: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date()
      };
    }
  };

  // Function to check all endpoints
  const checkAllEndpoints = async () => {
    setLoading(true);
    
    try {
      // Use the ApiHealthService to check all endpoints
      const apiResults = await ApiHealthService.checkAllEndpoints(API_ENDPOINTS);
      
      // Update the results state
      setResults(apiResults);
      
      // Update the overall status
      const newOverallStatus = calculateOverallStatus();
      setOverallStatus(newOverallStatus);
      
      // Update the last refresh time
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error checking all endpoints:', error);
      
      // Show an error message
      setSnackbarState({
        open: true,
        message: 'Failed to check endpoints',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate the overall system status
  const calculateOverallStatus = (): StatusType => {
    const groupStatuses = Object.values(results).map(group => group.status);
    
    if (groupStatuses.every(status => status === 'success')) {
      return 'success';
    } else if (groupStatuses.some(status => status === 'error')) {
      return 'error';
    } else if (groupStatuses.some(status => status === 'warning')) {
      return 'warning';
    } else {
      return 'unknown';
    }
  };

  // Run the checks when component mounts
  useEffect(() => {
    // Check for existing token in localStorage
    const storedToken = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (storedToken) {
      console.log('Found existing token in localStorage');
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      
      // Try to get user ID from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          if (userData && userData.id) {
            setUserId(userData.id);
            console.log('Found user ID in localStorage:', userData.id);
          }
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
        }
      }
    }
    
    // Set a default department ID if not already set
    const storedDepartmentId = localStorage.getItem('departmentId');
    if (!storedDepartmentId) {
      const defaultDeptId = '1';
      console.log('Setting default department ID:', defaultDeptId);
      setDepartmentId(defaultDeptId);
      localStorage.setItem('departmentId', defaultDeptId);
    } else {
      setDepartmentId(storedDepartmentId);
    }
    
    // Initialize results structure
    const initialResults: Record<string, GroupResult> = {};
    Object.keys(API_ENDPOINTS).forEach(groupKey => {
      initialResults[groupKey] = {
        name: groupKey.charAt(0).toUpperCase() + groupKey.slice(1),
        status: 'pending' as StatusType,
        endpoints: API_ENDPOINTS[groupKey as keyof typeof API_ENDPOINTS].map(endpoint => ({
          name: endpoint.name,
          endpoint: endpoint.endpoint,
          status: 'pending' as StatusType,
          responseTime: 0,
          message: 'Not checked yet',
          lastChecked: new Date()
        })),
        successRate: 0
      };
    });
    setResults(initialResults);
    
    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      checkAllEndpoints();
    }, 500);
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to render status icon
  const renderStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
      case 'error':
        return <ErrorIcon sx={{ color: theme.palette.error.main }} />;
      case 'warning':
        return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
      case 'pending':
        return <CircularProgress size={20} />;
      default:
        return <HelpIcon sx={{ color: theme.palette.grey[500] }} />;
    }
  };

  // Helper function to render status chip
  const renderStatusChip = (status: StatusType) => {
    const statusConfig = {
      success: { color: 'success', label: 'Operational' },
      error: { color: 'error', label: 'Failed' },
      warning: { color: 'warning', label: 'Partial Issues' },
      pending: { color: 'default', label: 'Checking...' },
      unknown: { color: 'default', label: 'Unknown' }
    };
    
    const config = statusConfig[status];
    
    return (
      <Chip 
        icon={renderStatusIcon(status)} 
        label={config.label}
        color={config.color as any}
        variant="outlined"
        size="small"
      />
    );
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const mainContent = (
    <Container maxWidth="xl">
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2, 
          bgcolor: 'rgba(255, 255, 255, 0.05)', 
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
          API Health Dashboard
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
          Monitor the health and status of all system components and API endpoints
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<RefreshIcon />} 
            onClick={checkAllEndpoints}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #00B0FF 90%)',
              }
            }}
          >
            Refresh Data
          </Button>
        </Box>
        
        {lastRefresh && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Last checked: {lastRefresh.toLocaleString()}
          </Typography>
        )}
        
        {/* Overall System Status */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                Overall System Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {renderStatusIcon(overallStatus)}
                <Typography variant="h6">
                  {overallStatus === 'success' ? 'All Systems Operational' : 
                   overallStatus === 'warning' ? 'Partial System Degradation' :
                   overallStatus === 'error' ? 'System Disruption Detected' :
                   'System Status Unknown'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">API Connection:</Typography>
                  {renderStatusChip(results.core?.status || 'unknown')}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Database Connection:</Typography>
                  {renderStatusChip(databaseStatus)}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Authentication:</Typography>
                  {loading ? 
                    renderStatusChip('pending') : 
                    renderStatusChip(token ? 'success' : 'error')}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Database Status */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
          <Typography variant="h5" gutterBottom>
            Database Connection Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {renderStatusIcon(databaseStatus)}
            <Typography variant="body1">
              {databaseMessage}
            </Typography>
          </Box>
          
          {databaseStatus === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>Database Connection Error</AlertTitle>
              Please check your database configuration in the backend .env file and ensure MySQL is running.
            </Alert>
          )}
          
          {databaseStatus === 'success' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <AlertTitle>Database Connected</AlertTitle>
              The application is successfully connected to the MySQL database.
            </Alert>
          )}
        </Paper>
        
        {/* System Health Section */}
        {systemHealth && (
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <Typography variant="h5" gutterBottom>
              Detailed System Health
            </Typography>
            
            <Grid container spacing={3}>
              {/* System Info */}
              <Grid item xs={12} md={6}>
                <Card elevation={1} sx={{ height: '100%', bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 2 }}>Node Version:</Typography>
                        <Typography variant="body2">{systemHealth.system?.node?.version || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 2 }}>Platform:</Typography>
                        <Typography variant="body2">{systemHealth.system?.node?.platform || 'N/A'} ({systemHealth.system?.node?.arch || 'N/A'})</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 2 }}>Uptime:</Typography>
                        <Typography variant="body2">{Math.floor((systemHealth.system?.uptime || 0) / 60)} minutes</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 2 }}>Environment:</Typography>
                        <Chip 
                          label={systemHealth.environment?.nodeEnv || 'unknown'} 
                          size="small" 
                          color={(systemHealth.environment?.nodeEnv === 'production') ? 'success' : 'warning'} 
                          variant="outlined" 
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 2 }}>Port:</Typography>
                        <Typography variant="body2">{systemHealth.environment?.port || 'N/A'}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Memory Usage */}
              <Grid item xs={12} md={6}>
                <Card elevation={1} sx={{ height: '100%', bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Memory Usage
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 1 }}>Heap Used:</Typography>
                        <Typography variant="body2">{systemHealth.system?.memory?.used || 0} MB</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={((systemHealth.system?.memory?.used || 0) / (systemHealth.system?.memory?.total || 1)) * 100} 
                        color="primary"
                        sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255, 255, 255, 0.1)' }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 1 }}>Heap Total:</Typography>
                        <Typography variant="body2">{systemHealth.system?.memory?.total || 0} MB</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 1 }}>RSS:</Typography>
                        <Typography variant="body2">{systemHealth.system?.memory?.rss || 0} MB</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 1 }}>External:</Typography>
                        <Typography variant="body2">{systemHealth.system?.memory?.external || 0} MB</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Database Tables */}
              <Grid item xs={12}>
                <Card elevation={1} sx={{ height: '100%', bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Database Tables
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <Typography variant="h3" color="primary">
                            {systemHealth.database?.tables?.users || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Users
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <Typography variant="h3" color="primary">
                            {systemHealth.database?.tables?.departments || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Departments
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <Typography variant="h3" color="primary">
                            {systemHealth.database?.tables?.tasks || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tasks
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* API Endpoints Status */}
              <Grid item xs={12}>
                <Card elevation={1} sx={{ height: '100%', bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      API Endpoints Status
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <TableContainer sx={{ bgcolor: 'transparent' }}>
                      <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255, 255, 255, 0.1)', color: 'white' } }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Endpoint</TableCell>
                            <TableCell>Path</TableCell>
                            <TableCell align="right">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {systemHealth.api?.endpoints?.map((endpoint, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{endpoint.name}</TableCell>
                              <TableCell>{endpoint.path}</TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={endpoint.status} 
                                  color={endpoint.status === 'operational' ? 'success' : 'error'} 
                                  size="small" 
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}
        
        {/* Endpoint Groups */}
        <Grid container spacing={3}>
          {Object.keys(results).map(groupKey => (
            <Grid item xs={12} md={6} key={groupKey}>
              <Card elevation={3} sx={{ height: '100%', bgcolor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {results[groupKey].name} Endpoints
                    </Typography>
                    {renderStatusChip(results[groupKey].status)}
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 1 }}>
                      Success Rate: {results[groupKey].successRate.toFixed(0)}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={results[groupKey].successRate} 
                      color={
                        results[groupKey].successRate === 100 ? "success" :
                        results[groupKey].successRate > 50 ? "warning" : "error"
                      }
                      sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255, 255, 255, 0.1)' }}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <TableContainer sx={{ bgcolor: 'transparent' }}>
                    <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255, 255, 255, 0.1)', color: 'white' } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Endpoint</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell align="right">Response Time</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results[groupKey].endpoints.map((endpoint, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Tooltip title={endpoint.message}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {renderStatusIcon(endpoint.status)}
                                  <Typography variant="body2">
                                    {endpoint.name}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="center">
                              {endpoint.statusCode ? `${endpoint.statusCode}` : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {endpoint.responseTime > 0 ? `${endpoint.responseTime}ms` : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Troubleshooting Section */}
        {overallStatus === 'error' && (
          <Paper elevation={2} sx={{ p: 3, mt: 4, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <Typography variant="h5" gutterBottom>
              Troubleshooting Recommendations
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Connection Issues Detected</AlertTitle>
              Here are some steps to resolve the issues:
            </Alert>
            
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" sx={{ mb: 1 }}>
                Verify that the NestJS backend is running on port 3001
              </Typography>
              <Typography component="li" sx={{ mb: 1 }}>
                Check that MySQL is running and accessible with the credentials in your .env file
              </Typography>
              <Typography component="li" sx={{ mb: 1 }}>
                Ensure CORS is properly configured to allow requests from your frontend
              </Typography>
              <Typography component="li" sx={{ mb: 1 }}>
                Verify that all required environment variables are set correctly
              </Typography>
              <Typography component="li">
                Check the backend logs for any errors or exceptions
              </Typography>
            </Box>
          </Paper>
        )}
      </Paper>
    </Container>
  );

  return (
    <Box sx={{ ...standardBackgroundStyle, minHeight: '100vh' }}>
      <Sidebar 
        open={sidebarOpen} 
        onToggleDrawer={handleToggleSidebar} 
        onLogout={handleLogout}
        drawerWidth={DRAWER_WIDTH}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 0}px)` },
          ml: { sm: `${sidebarOpen ? DRAWER_WIDTH : 0}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {mainContent}
      </Box>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={6000}
        onClose={() => setSnackbarState({ ...snackbarState, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarState({ ...snackbarState, open: false })}
          severity={snackbarState.severity}
          sx={{ width: '100%' }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApiHealthDashboard;