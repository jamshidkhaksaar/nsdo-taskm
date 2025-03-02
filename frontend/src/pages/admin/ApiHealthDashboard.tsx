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
    { name: 'Department Performance', endpoint: '/api/departments/:id/performance', method: 'GET', requiresAuth: true, dynamicParams: true, optional: true, fallbackMessage: 'Department ID required for this endpoint' }
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
          if (endpointInfo.optional) {
            status = 'warning';
            message = endpointInfo.fallbackMessage || 'User ID required but not available';
            const endTime = performance.now();
            return {
              name: endpointInfo.name,
              endpoint: endpointInfo.endpoint,
              status,
              statusCode: 0,
              responseTime: endTime - startTime,
              message,
              lastChecked: new Date()
            };
          } else {
            throw new Error('User ID required but not available');
          }
        }
        
        if (url.includes(':id') && departmentId) {
          url = url.replace(':id', departmentId);
        } else if (url.includes(':id')) {
          if (endpointInfo.optional) {
            status = 'warning';
            message = endpointInfo.fallbackMessage || 'Department ID required but not available';
            const endTime = performance.now();
            return {
              name: endpointInfo.name,
              endpoint: endpointInfo.endpoint,
              status,
              statusCode: 0,
              responseTime: endTime - startTime,
              message,
              lastChecked: new Date()
            };
          } else {
            throw new Error('Department ID required but not available');
          }
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
          
          // Store token in localStorage for future use
          localStorage.setItem('token', newToken);
          localStorage.setItem('access_token', newToken);
          
          // Try to extract user ID from the response
          let extractedUserId = null;
          
          // Check various possible locations for the user ID
          if (response.data.user && response.data.user.id) {
            extractedUserId = response.data.user.id;
          } else if (response.data.id) {
            extractedUserId = response.data.id;
          } else if (response.data.userId) {
            extractedUserId = response.data.userId;
          } else if (response.data.sub) {
            extractedUserId = response.data.sub;
          }
          
          if (extractedUserId) {
            console.log('User ID found:', extractedUserId);
            setUserId(extractedUserId);
            localStorage.setItem('userId', extractedUserId);
          } else {
            // Fallback: Try to get user ID from localStorage if it exists
            const storedUserId = localStorage.getItem('userId');
            if (storedUserId) {
              console.log('Using stored user ID:', storedUserId);
              setUserId(storedUserId);
            }
          }
          
          // For demo purposes, set a default department ID if not available
          if (!departmentId) {
            const defaultDeptId = '1';
            console.log('Setting default department ID:', defaultDeptId);
            setDepartmentId(defaultDeptId);
            localStorage.setItem('departmentId', defaultDeptId);
          }
        }
      }
      
      // Check for database status if needed
      if (endpointInfo.checkDatabaseStatus && response.data) {
        if (response.data.database && typeof response.data.database.connected === 'boolean') {
          setDatabaseStatus(response.data.database.connected ? 'success' : 'error');
          setDatabaseMessage(
            response.data.database.connected 
              ? `Connected to ${response.data.database.name || 'database'}`
              : 'Database connection failed'
          );
        }
        
        // Store system health data if available
        if (response.data.status && response.data.timestamp) {
          setSystemHealth(response.data as SystemHealth);
        }
      }
      
      status = 'success';
      message = `Status ${statusCode} OK`;
    } catch (error: any) {
      console.error(`Error checking endpoint ${endpointInfo.name}:`, error);
      
      if (error.response) {
        statusCode = error.response.status;
        
        if (statusCode === 404 && endpointInfo.optional) {
          status = 'warning';
          message = endpointInfo.fallbackMessage || `Endpoint not found (404): ${endpointInfo.endpoint}`;
        } else if (statusCode === 500 && endpointInfo.optional) {
          status = 'warning';
          message = endpointInfo.fallbackMessage || `Server error (500): ${endpointInfo.endpoint}`;
        } else if (statusCode === 401 || statusCode === 403) {
          status = 'error';
          message = `Authentication error (${statusCode}): ${error.message || 'No details available'}`;
        } else {
          status = 'error';
          message = `HTTP error ${statusCode}: ${error.message || 'No details available'}`;
        }
      } else if (error.request) {
        status = 'error';
        message = `No response received: ${error.message || 'Request timed out'}`;
      } else if (error.message && error.message.includes('User ID required')) {
        if (endpointInfo.optional) {
          status = 'warning';
          message = endpointInfo.fallbackMessage || error.message;
        } else {
          status = 'error';
          message = error.message;
        }
      } else if (error.message && error.message.includes('Department ID required')) {
        if (endpointInfo.optional) {
          status = 'warning';
          message = endpointInfo.fallbackMessage || error.message;
        } else {
          status = 'error';
          message = error.message;
        }
      } else {
        status = 'error';
        message = `Error: ${error.message || 'Unknown error'}`;
      }
    }
    
    const endTime = performance.now();
    
    return {
      name: endpointInfo.name,
      endpoint: endpointInfo.endpoint,
      status,
      statusCode,
      responseTime: endTime - startTime,
      message,
      lastChecked: new Date()
    };
  };

  // Function to check all endpoints
  const checkAllEndpoints = async () => {
    setLoading(true);
    
    // Reset token and department ID
    const storedToken = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (storedToken) {
      console.log('Using stored token');
      setToken(storedToken);
    } else {
      setToken(null);
    }
    
    // Try to get user ID from localStorage
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      console.log('Using stored user ID:', storedUserId);
      setUserId(storedUserId);
    } else {
      setUserId(null);
    }
    
    // Try to get department ID from localStorage or set a default
    const storedDepartmentId = localStorage.getItem('departmentId');
    if (storedDepartmentId) {
      console.log('Using stored department ID:', storedDepartmentId);
      setDepartmentId(storedDepartmentId);
    } else {
      // Set a default department ID for testing
      const defaultDeptId = '1';
      console.log('Setting default department ID:', defaultDeptId);
      setDepartmentId(defaultDeptId);
      localStorage.setItem('departmentId', defaultDeptId);
    }
    
    // Initialize results structure
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
    
    // Check core endpoints first to get authentication
    for (let index = 0; index < API_ENDPOINTS.core.length; index++) {
      const endpoint = API_ENDPOINTS.core[index];
      const result = await checkEndpoint('core', endpoint, index);
      
      // Update the results
      setResults(prev => {
        const updated = { ...prev };
        updated.core.endpoints[index] = result;
        
        // Calculate success rate for the group
        const groupEndpoints = updated.core.endpoints;
        const successCount = groupEndpoints.filter(e => e.status === 'success').length;
        updated.core.successRate = (successCount / groupEndpoints.length) * 100;
        
        // Determine group status
        if (successCount === groupEndpoints.length) {
          updated.core.status = 'success';
        } else if (successCount === 0) {
          updated.core.status = 'error';
        } else {
          updated.core.status = 'warning';
        }
        
        return updated;
      });
    }
    
    // If we don't have a token after checking core endpoints, show a warning
    if (!token) {
      console.warn('No token available after checking core endpoints');
    }
    
    // Check remaining endpoint groups
    const remainingGroups = Object.keys(API_ENDPOINTS).filter(group => group !== 'core');
    
    for (let groupIndex = 0; groupIndex < remainingGroups.length; groupIndex++) {
      const groupKey = remainingGroups[groupIndex];
      const endpoints = API_ENDPOINTS[groupKey as keyof typeof API_ENDPOINTS];
      
      for (let index = 0; index < endpoints.length; index++) {
        const endpoint = endpoints[index];
        const result = await checkEndpoint(groupKey, endpoint, index);
        
        // Update the results
        setResults(prev => {
          const updated = { ...prev };
          updated[groupKey].endpoints[index] = result;
          
          // Calculate success rate for the group
          const groupEndpoints = updated[groupKey].endpoints;
          const successCount = groupEndpoints.filter(e => e.status === 'success').length;
          const warningCount = groupEndpoints.filter(e => e.status === 'warning').length;
          updated[groupKey].successRate = ((successCount + (warningCount * 0.5)) / groupEndpoints.length) * 100;
          
          // Determine group status
          if (successCount === groupEndpoints.length) {
            updated[groupKey].status = 'success';
          } else if (successCount === 0 && warningCount === 0) {
            updated[groupKey].status = 'error';
          } else {
            updated[groupKey].status = 'warning';
          }
          
          return updated;
        });
      }
    }
    
    // Calculate overall status
    const allEndpoints = Object.values(results).flatMap(group => group.endpoints);
    const successCount = allEndpoints.filter(e => e.status === 'success').length;
    const warningCount = allEndpoints.filter(e => e.status === 'warning').length;
    const errorCount = allEndpoints.filter(e => e.status === 'error').length;
    
    if (errorCount === 0 && warningCount === 0) {
      setOverallStatus('success');
    } else if (successCount === 0 && warningCount === 0) {
      setOverallStatus('error');
    } else {
      setOverallStatus('warning');
    }
    
    setLastRefresh(new Date());
    setLoading(false);
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
      ...standardBackgroundStyle,
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