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
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Container
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HelpIcon from '@mui/icons-material/Help';
import axios from '../../utils/axios';
import { CONFIG } from '../../utils/config';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

// Define endpoint groups for testing
const API_ENDPOINTS = {
  core: [
    { name: 'Health Check', endpoint: '/api/health', method: 'GET', requiresAuth: false },
    { name: 'Authentication', endpoint: '/api/auth/login', method: 'POST', requiresAuth: false, payload: { username: 'admin', password: 'admin123' } }
  ],
  tasks: [
    { name: 'Get All Tasks', endpoint: '/api/tasks', method: 'GET', requiresAuth: true },
    { name: 'Task Statistics', endpoint: '/api/tasks/user/:userId/statistics', method: 'GET', requiresAuth: true, dynamicParams: true }
  ],
  departments: [
    { name: 'Get All Departments', endpoint: '/api/departments', method: 'GET', requiresAuth: true },
    { name: 'Department Performance', endpoint: '/api/departments/:id/performance', method: 'GET', requiresAuth: true, dynamicParams: true }
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

// Status types
type StatusType = 'success' | 'error' | 'warning' | 'pending' | 'unknown';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // Initialize results structure
  useEffect(() => {
    const initialResults: Record<string, GroupResult> = {};
    Object.keys(API_ENDPOINTS).forEach(groupKey => {
      initialResults[groupKey] = {
        name: groupKey.charAt(0).toUpperCase() + groupKey.slice(1),
        status: 'pending',
        endpoints: API_ENDPOINTS[groupKey as keyof typeof API_ENDPOINTS].map(endpoint => ({
          name: endpoint.name,
          endpoint: endpoint.endpoint,
          status: 'pending',
          responseTime: 0,
          message: 'Not checked yet',
          lastChecked: new Date()
        })),
        successRate: 0
      };
    });
    setResults(initialResults);
  }, []);

  // Function to check a single endpoint
  const checkEndpoint = async (
    groupKey: string, 
    endpointInfo: any, 
    index: number
  ): Promise<EndpointResult> => {
    const startTime = performance.now();
    let status: StatusType = 'unknown';
    let statusCode = 0;
    let message = '';
    
    try {
      // Replace dynamic parameters if needed
      let url = endpointInfo.endpoint;
      if (endpointInfo.dynamicParams) {
        if (url.includes(':userId') && userId) {
          url = url.replace(':userId', userId);
        } else if (url.includes(':userId')) {
          throw new Error('User ID required but not available');
        }
        
        if (url.includes(':id') && departmentId) {
          url = url.replace(':id', departmentId);
        } else if (url.includes(':id')) {
          throw new Error('Department ID required but not available');
        }
      }
      
      // Set auth header if required
      const headers: Record<string, string> = {};
      if (endpointInfo.requiresAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (endpointInfo.requiresAuth && !token) {
        throw new Error('Authentication required but no token available');
      }
      
      // Make the request with a timeout
      let response;
      const requestConfig = { 
        headers,
        timeout: 10000 // 10 second timeout to prevent hanging requests
      };
      
      if (endpointInfo.method === 'GET') {
        response = await axios.get(url, requestConfig);
      } else if (endpointInfo.method === 'POST') {
        response = await axios.post(url, endpointInfo.payload || {}, requestConfig);
      } else {
        throw new Error(`Unsupported method: ${endpointInfo.method}`);
      }
      
      statusCode = response.status;
      
      // Check for authentication response to extract token
      if (url.includes('/auth/login') && response.data) {
        console.log('Auth response:', response.data);
        // Try different token formats based on the API response structure
        let newToken = null;
        if (response.data.accessToken) {
          newToken = response.data.accessToken;
        } else if (response.data.access) {
          newToken = response.data.access;
        } else if (response.data.token) {
          newToken = response.data.token;
        } else if (typeof response.data === 'object' && response.data !== null) {
          // Look for any property that might contain the token
          const possibleTokenProps = ['access_token', 'jwt', 'auth_token', 'id_token'];
          for (const prop of possibleTokenProps) {
            if (response.data[prop]) {
              newToken = response.data[prop];
              break;
            }
          }
        }
        
        if (newToken) {
          console.log('Token found:', newToken.substring(0, 10) + '...');
          setToken(newToken);
          message = 'Authentication successful, token received';
          status = 'success';
        } else {
          console.warn('No token found in response:', response.data);
          message = 'Authentication successful, but no token found in response';
          status = 'warning';
        }
      } else {
        message = 'Request successful';
        status = 'success';
      }
      
      // Check for user ID in response data for future requests
      if (response.data && response.data.user && response.data.user.id) {
        setUserId(response.data.user.id);
      }
      
      // Check for department ID if available
      if (url.includes('/departments') && response.data && response.data.length > 0) {
        setDepartmentId(response.data[0].id);
      }
      
      // Check database status if this endpoint is used for that
      if (endpointInfo.checkDatabaseStatus) {
        if (response.data && response.data.database) {
          setDatabaseStatus(response.data.database.connected ? 'success' : 'error');
          setDatabaseMessage(response.data.database.message || 'Database connection checked');
        } else {
          // Assume database is OK if health endpoint returns 200
          setDatabaseStatus('success');
          setDatabaseMessage('Database appears to be connected (inferred from health check)');
        }
      }
      
      // Check for admin health endpoint to get detailed system info
      if (url.includes('/admin/health') && response.data) {
        setSystemHealth(response.data);
      }
    } catch (error: any) {
      status = 'error';
      console.error(`Error checking endpoint ${endpointInfo.name}:`, error);
      if (error.response) {
        statusCode = error.response.status;
        message = `Error ${statusCode}: ${error.response.data?.message || 'Unknown error'}`;
        
        // Special case for 401 when token might be expired
        if (statusCode === 401 && token) {
          message = 'Authentication failed: Token may be expired';
        }
      } else if (error.request) {
        message = 'No response received from server';
      } else {
        message = error.message || 'Unknown error occurred';
      }
    }
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    // Update the results
    const updatedResults = { ...results };
    updatedResults[groupKey].endpoints[index] = {
      name: endpointInfo.name,
      endpoint: endpointInfo.endpoint,
      status,
      statusCode,
      responseTime,
      message,
      lastChecked: new Date()
    };
    
    // Calculate success rate for the group
    const groupEndpoints = updatedResults[groupKey].endpoints;
    const successCount = groupEndpoints.filter(e => e.status === 'success').length;
    updatedResults[groupKey].successRate = (successCount / groupEndpoints.length) * 100;
    
    // Determine group status
    if (successCount === groupEndpoints.length) {
      updatedResults[groupKey].status = 'success';
    } else if (successCount === 0) {
      updatedResults[groupKey].status = 'error';
    } else {
      updatedResults[groupKey].status = 'warning';
    }
    
    setResults(updatedResults);
    
    return updatedResults[groupKey].endpoints[index];
  };

  // Function to check all endpoints
  const checkAllEndpoints = async () => {
    setLoading(true);
    setLastRefresh(new Date());
    
    // Reset token if we're doing a full check
    setToken(null);
    
    // Set a default department ID for testing
    // For real API testing, we'll try to get this from the API response
    setDepartmentId(null);
    
    // Initialize all endpoints as pending
    const initialResults: Record<string, GroupResult> = {};
    Object.keys(API_ENDPOINTS).forEach(groupKey => {
      initialResults[groupKey] = {
        name: groupKey.charAt(0).toUpperCase() + groupKey.slice(1),
        status: 'pending',
        endpoints: API_ENDPOINTS[groupKey as keyof typeof API_ENDPOINTS].map(endpoint => ({
          name: endpoint.name,
          endpoint: endpoint.endpoint,
          status: 'pending',
          responseTime: 0,
          message: 'Checking...',
          lastChecked: new Date()
        })),
        successRate: 0
      };
    });
    setResults(initialResults);
    
    // Check endpoints in sequence, starting with core endpoints
    try {
      // First check core endpoints to get authentication
      for (let i = 0; i < API_ENDPOINTS.core.length; i++) {
        await checkEndpoint('core', API_ENDPOINTS.core[i], i);
      }
      
      // Check departments endpoint to get a department ID for testing
      if (!departmentId) {
        try {
          const deptEndpoint = API_ENDPOINTS.departments[0];
          const deptResult = await checkEndpoint('departments', deptEndpoint, 0);
          
          // If we still don't have a department ID, use a fallback
          if (!departmentId) {
            console.warn('No department ID found in API response, using fallback ID "1"');
            setDepartmentId('1');
          }
        } catch (error) {
          console.error('Error fetching departments:', error);
          // Use fallback ID
          setDepartmentId('1');
        }
      }
      
      // Then check other endpoint groups
      const otherGroups = Object.keys(API_ENDPOINTS).filter(group => group !== 'core' && group !== 'departments');
      for (const group of otherGroups) {
        const endpoints = API_ENDPOINTS[group as keyof typeof API_ENDPOINTS];
        for (let i = 0; i < endpoints.length; i++) {
          await checkEndpoint(group, endpoints[i], i);
        }
      }
      
      // Check remaining department endpoints
      for (let i = 1; i < API_ENDPOINTS.departments.length; i++) {
        await checkEndpoint('departments', API_ENDPOINTS.departments[i], i);
      }
      
      // If health check succeeded but database status is still unknown, assume it's connected
      if (results.core?.status === 'success' && databaseStatus === 'unknown') {
        setDatabaseStatus('success');
        setDatabaseMessage('Database appears to be connected (inferred from successful API calls)');
      }
      
      // Calculate overall status
      calculateOverallStatus();
    } catch (error) {
      console.error('Error checking endpoints:', error);
      
      // If we have any errors but database status is still unknown, mark as error
      if (databaseStatus === 'unknown') {
        setDatabaseStatus('error');
        setDatabaseMessage('Could not determine database status due to API errors');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate the overall system status
  const calculateOverallStatus = () => {
    const groupStatuses = Object.values(results).map(group => group.status);
    
    if (groupStatuses.every(status => status === 'success')) {
      setOverallStatus('success');
    } else if (groupStatuses.some(status => status === 'error')) {
      setOverallStatus('error');
    } else if (groupStatuses.some(status => status === 'warning')) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('unknown');
    }
  };

  // Run the checks when component mounts
  useEffect(() => {
    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      if (Object.keys(results).length > 0) {
        checkAllEndpoints();
      }
    }, 500);
    
    return () => clearTimeout(timer);
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

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a237e 0%, #121212 100%)',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      color: 'white'
    }}>
      <Sidebar 
        open={sidebarOpen} 
        onToggleDrawer={handleToggleSidebar} 
        onLogout={handleLogout}
        drawerWidth={DRAWER_WIDTH}
      />
      <Box sx={{ 
        flexGrow: 1, 
        p: 3, 
        ml: { xs: 0, md: '240px' },
        transition: 'margin-left 0.3s ease-in-out',
        overflow: 'auto',
        pt: { xs: 8, md: 10 }
      }}>
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
                            <Typography variant="body2">{systemHealth.system.node.version}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 2 }}>Platform:</Typography>
                            <Typography variant="body2">{systemHealth.system.node.platform} ({systemHealth.system.node.arch})</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 2 }}>Uptime:</Typography>
                            <Typography variant="body2">{Math.floor(systemHealth.system.uptime / 60)} minutes</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 2 }}>Environment:</Typography>
                            <Chip 
                              label={systemHealth.environment.nodeEnv} 
                              size="small" 
                              color={systemHealth.environment.nodeEnv === 'production' ? 'success' : 'warning'} 
                              variant="outlined" 
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 2 }}>Port:</Typography>
                            <Typography variant="body2">{systemHealth.environment.port}</Typography>
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
                            <Typography variant="body2">{systemHealth.system.memory.used} MB</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={(systemHealth.system.memory.used / systemHealth.system.memory.total) * 100} 
                            color="primary"
                            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255, 255, 255, 0.1)' }}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 1 }}>Heap Total:</Typography>
                            <Typography variant="body2">{systemHealth.system.memory.total} MB</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 1 }}>RSS:</Typography>
                            <Typography variant="body2">{systemHealth.system.memory.rss} MB</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mb: 1 }}>External:</Typography>
                            <Typography variant="body2">{systemHealth.system.memory.external} MB</Typography>
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
                                {systemHealth.database.tables.users}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Users
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Card variant="outlined" sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                              <Typography variant="h3" color="primary">
                                {systemHealth.database.tables.departments}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Departments
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Card variant="outlined" sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                              <Typography variant="h3" color="primary">
                                {systemHealth.database.tables.tasks}
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
                              {systemHealth.api.endpoints.map((endpoint, index) => (
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
        <Footer open={sidebarOpen} drawerWidth={DRAWER_WIDTH} />
      </Box>
    </Box>
  );
};

export default ApiHealthDashboard; 