import React, { useState, useEffect } from 'react';
import { Box, Chip, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import { CONFIG } from '../utils/config';
import axios from 'axios';

// This function is never called when mock data is enabled
const checkConnection = async (): Promise<boolean> => {
  // Safety check - never attempt to connect if mock data is enabled
  if (CONFIG.USE_MOCK_DATA) {
    console.log('[CONNECTION] Mock data is enabled, skipping real connection check');
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Force the baseURL to use port 3001 instead of 8000 if needed
    let apiUrl = CONFIG.API_URL;
    // More robust port replacement to ensure we're using port 3001
    if (apiUrl.includes('localhost:8000')) {
      apiUrl = apiUrl.replace('localhost:8000', 'localhost:3001');
      console.log('[CONNECTION] Forcing API URL to use port 3001:', apiUrl);
    } else if (apiUrl.match(/localhost:\d+/) && !apiUrl.includes('localhost:3001')) {
      // Replace any other port with 3001
      apiUrl = apiUrl.replace(/localhost:\d+/, 'localhost:3001');
      console.log('[CONNECTION] Forcing API URL to use port 3001:', apiUrl);
    }
    
    console.log('[CONNECTION] Checking health at:', `${apiUrl}/api/health`);
    
    // Use XMLHttpRequest instead of fetch to avoid potential interference
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${apiUrl}/api/health`, true);
      xhr.timeout = 5000;
      
      xhr.onload = function() {
        clearTimeout(timeoutId);
        console.log('[CONNECTION] Health check response:', xhr.status);
        resolve(xhr.status >= 200 && xhr.status < 300);
      };
      
      xhr.onerror = function() {
        clearTimeout(timeoutId);
        console.error('[CONNECTION] Health check failed');
        resolve(false);
      };
      
      xhr.ontimeout = function() {
        clearTimeout(timeoutId);
        console.error('[CONNECTION] Health check timed out');
        resolve(false);
      };
      
      xhr.send();
    });
  } catch (error) {
    // Only log in development and not in mock mode
    if (process.env.NODE_ENV === 'development' && !CONFIG.USE_MOCK_DATA) {
      console.error('Connection check failed:', error);
    }
    return false;
  }
};

// Check authentication status
const checkAuthStatus = (): boolean => {
  const token = localStorage.getItem('access_token');
  if (!token) return false;
  
  // Check if axios has the auth header set
  const authHeader = axios.defaults.headers.common['Authorization'];
  if (!authHeader) {
    console.warn('[CONNECTION] Auth token exists but Authorization header not set');
    // Fix the header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return true;
};

interface ConnectionStatusProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ position = 'bottom-right' }) => {
  // Initialize connection state based on mock data setting
  const [isConnected, setIsConnected] = useState<boolean | null>(CONFIG.USE_MOCK_DATA ? false : null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [useMockData, setUseMockData] = useState(CONFIG.USE_MOCK_DATA);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(CONFIG.USE_MOCK_DATA ? new Date() : null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(checkAuthStatus());
  
  // Position styles
  const positionStyles = {
    'top-right': { top: 70, right: 20 },
    'top-left': { top: 70, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
  };
  
  useEffect(() => {
    // Skip all connection checks if mock data is enabled
    if (CONFIG.USE_MOCK_DATA) {
      setIsConnected(false);
      setLastCheckTime(new Date());
      return;
    }
    
    // Only run this code if mock data is disabled
    const checkApiConnection = async () => {
      const connected = await checkConnection();
      setIsConnected(connected);
      setLastCheckTime(new Date());
      
      // Also check authentication status
      setIsAuthenticated(checkAuthStatus());
    };
    
    // Initial check
    checkApiConnection();
    
    // Set up interval to check connection every 30 seconds
    const interval = setInterval(checkApiConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };
  
  const handleSettingsSave = () => {
    // Use the direct methods to ensure proper state updates
    if (useMockData) {
      CONFIG.enableMockData();
    } else {
      CONFIG.disableMockData();
    }
    setSettingsOpen(false);
  };
  
  const handleInfoClose = () => {
    setInfoOpen(false);
  };
  
  // Function to fix authentication issues
  const fixAuthenticationIssues = () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('[CONNECTION] Fixing authentication headers');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
  };
  
  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Tooltip 
          title={
            isConnected === null 
              ? "Checking connection..." 
              : isConnected 
                ? isAuthenticated
                  ? "Connected to API and authenticated"
                  : "Connected to API but not authenticated"
                : useMockData 
                  ? "Using mock data (API not connected)" 
                  : "API connection failed. Please start your backend server."
          }
        >
          <Chip
            icon={
              isConnected === null 
                ? <CloudDoneIcon color="disabled" /> 
                : isConnected 
                  ? isAuthenticated
                    ? <CloudDoneIcon color="success" />
                    : <CloudDoneIcon color="warning" />
                  : <CloudOffIcon color="error" />
            }
            label={
              isConnected === null 
                ? "Checking..." 
                : isConnected 
                  ? isAuthenticated
                    ? "API Connected"
                    : "API Connected (Auth Issue)"
                  : "Using Mock Data"
            }
            color={
              isConnected === null 
                ? "default" 
                : isConnected 
                  ? isAuthenticated
                    ? "success"
                    : "warning"
                  : useMockData ? "warning" : "error"
            }
            variant="outlined"
            size="small"
          />
        </Tooltip>
        
        <Tooltip title="Connection Info">
          <IconButton 
            size="small" 
            onClick={() => setInfoOpen(true)}
            sx={{ padding: '4px' }}
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Connection Settings">
          <IconButton 
            size="small" 
            onClick={() => setSettingsOpen(true)}
            sx={{ padding: '4px' }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={handleSettingsClose}>
        <DialogTitle>API Connection Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure API connection settings for development and testing.
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>Use Mock Data:</Typography>
              <Button 
                variant={useMockData ? "contained" : "outlined"}
                color={useMockData ? "primary" : "inherit"}
                size="small"
                onClick={() => setUseMockData(true)}
              >
                On
              </Button>
              <Button 
                variant={!useMockData ? "contained" : "outlined"}
                color={!useMockData ? "primary" : "inherit"}
                size="small"
                onClick={() => setUseMockData(false)}
              >
                Off
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsClose}>Cancel</Button>
          <Button onClick={handleSettingsSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Info Dialog */}
      <Dialog open={infoOpen} onClose={handleInfoClose}>
        <DialogTitle>Connection Information</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Status:</strong> {
                isConnected === null 
                  ? "Checking connection..." 
                  : isConnected 
                    ? "Connected to API" 
                    : "Not connected to API"
              }
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              <strong>API URL:</strong> {CONFIG.API_URL}
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              <strong>Using Mock Data:</strong> {useMockData ? "Yes" : "No"}
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              <strong>Authentication Status:</strong> {
                isAuthenticated 
                  ? "Authenticated" 
                  : "Not authenticated"
              }
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              <strong>Auth Token:</strong> {
                localStorage.getItem('access_token') 
                  ? "Present" 
                  : "Not found"
              }
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              <strong>Auth Header:</strong> {
                axios.defaults.headers.common['Authorization'] 
                  ? "Set" 
                  : "Not set"
              }
            </Typography>
            
            {lastCheckTime && (
              <Typography variant="body2" gutterBottom>
                <strong>Last Check:</strong> {lastCheckTime.toLocaleTimeString()}
              </Typography>
            )}
            
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              {isConnected 
                ? "The application is connected to the backend API server." 
                : useMockData 
                  ? "The application is using mock data for demonstration purposes. Start your backend server and turn off mock data to use real data." 
                  : "The application cannot connect to the backend API server. Please start your backend server or enable mock data for testing."}
            </Typography>
            
            {!isConnected && !useMockData && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Warning: Mock data is disabled but the API is not connected. Some features may not work.
              </Typography>
            )}
            
            {isConnected && !isAuthenticated && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="error" gutterBottom>
                  Authentication issue detected: You are connected to the API but not properly authenticated.
                </Typography>
                <Button 
                  variant="contained" 
                  color="warning" 
                  size="small" 
                  onClick={fixAuthenticationIssues}
                  sx={{ mt: 1 }}
                >
                  Fix Authentication
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleInfoClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConnectionStatus; 