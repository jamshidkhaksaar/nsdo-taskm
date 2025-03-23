import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField,
  Container,
  Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import apiTester from '../../utils/apiTester';
import Sidebar from '../../components/Sidebar';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { standardBackgroundStyle } from '../../utils/backgroundStyles';

const ApiTesterPage: React.FC = () => {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const DRAWER_WIDTH = 240;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const runAllTests = async () => {
    setLoading(true);
    try {
      const results = await apiTester.runAllTests();
      setResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAuthTest = async () => {
    setLoading(true);
    try {
      await apiTester.testAuthentication(username, password);
      setResults(apiTester.getResults());
    } catch (error) {
      console.error('Error running auth test:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDepartmentsTest = async () => {
    setLoading(true);
    try {
      await apiTester.testGetDepartments();
      setResults(apiTester.getResults());
    } catch (error) {
      console.error('Error running departments test:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDepartmentPerformanceTest = async () => {
    setLoading(true);
    try {
      await apiTester.testDepartmentPerformance();
      setResults(apiTester.getResults());
    } catch (error) {
      console.error('Error running department performance test:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTasksTest = async () => {
    setLoading(true);
    try {
      await apiTester.testGetTasks();
      setResults(apiTester.getResults());
    } catch (error) {
      console.error('Error running tasks test:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAdminDashboardTest = async () => {
    setLoading(true);
    try {
      await apiTester.testAdminDashboard();
      setResults(apiTester.getResults());
    } catch (error) {
      console.error('Error running admin dashboard test:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusChip = (success: boolean) => {
    return success ? (
      <Chip 
        icon={<CheckCircleIcon />} 
        label="Success" 
        color="success" 
        variant="outlined" 
        size="small" 
      />
    ) : (
      <Chip 
        icon={<ErrorIcon />} 
        label="Failed" 
        color="error" 
        variant="outlined" 
        size="small" 
      />
    );
  };

  const renderResultItem = (key: string, result: any) => {
    if (!result) return null;
    
    return (
      <Accordion key={key} sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Typography variant="subtitle1">{key.charAt(0).toUpperCase() + key.slice(1)}</Typography>
            {renderStatusChip(result.success)}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {Object.entries(result).map(([k, v]) => {
              if (k === 'data') return null;
              return (
                <ListItem key={k}>
                  <ListItemText 
                    primary={`${k.charAt(0).toUpperCase() + k.slice(1)}`} 
                    secondary={v !== null && v !== undefined ? v.toString() : 'null'} 
                  />
                </ListItem>
              );
            })}
          </List>
          
          {result.data && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Response Data:</Typography>
              <Box 
                component="pre" 
                sx={{ 
                  bgcolor: 'rgba(0, 0, 0, 0.1)', 
                  p: 2, 
                  borderRadius: 1, 
                  overflow: 'auto',
                  maxHeight: '300px',
                  fontSize: '0.75rem'
                }}
              >
                {JSON.stringify(result.data, null, 2)}
              </Box>
            </>
          )}
        </AccordionDetails>
      </Accordion>
    );
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
              API Tester
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
              Test your API endpoints with real data
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ height: '100%', bgcolor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Test Configuration
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Authentication Credentials
                      </Typography>
                      <TextField
                        label="Username"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        sx={{ 
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                          '& .MuiInputBase-input': {
                            color: 'white',
                          }
                        }}
                      />
                      <TextField
                        label="Password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ 
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                          '& .MuiInputBase-input': {
                            color: 'white',
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth
                        startIcon={<PlayArrowIcon />}
                        onClick={runAllTests}
                        disabled={loading}
                        sx={{ 
                          py: 1.5,
                          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1976D2 30%, #00B0FF 90%)',
                          }
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Run All Tests'}
                      </Button>
                      
                      <Divider sx={{ my: 1 }}>
                        <Typography variant="body2" color="text.secondary">Or Test Individual Endpoints</Typography>
                      </Divider>
                      
                      <Button 
                        variant="outlined" 
                        onClick={runAuthTest}
                        disabled={loading}
                      >
                        Test Authentication
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={runDepartmentsTest}
                        disabled={loading}
                      >
                        Test Departments
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={runDepartmentPerformanceTest}
                        disabled={loading}
                      >
                        Test Department Performance
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={runTasksTest}
                        disabled={loading}
                      >
                        Test Tasks
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={runAdminDashboardTest}
                        disabled={loading}
                      >
                        Test Admin Dashboard
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ height: '100%', bgcolor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Test Results
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <CircularProgress />
                      </Box>
                    ) : Object.keys(results).length === 0 ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <AlertTitle>No Tests Run Yet</AlertTitle>
                        Click one of the test buttons to start testing your API endpoints with real data.
                      </Alert>
                    ) : (
                      <Box>
                        {Object.entries(results).map(([key, result]) => renderResultItem(key, result))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Alert severity="info">
                <AlertTitle>Testing with Real Data</AlertTitle>
                This page allows you to test your API endpoints with real data. Make sure your backend server is running and properly configured.
                For more information, check the API_TESTING_GUIDE.md file.
              </Alert>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default ApiTesterPage;