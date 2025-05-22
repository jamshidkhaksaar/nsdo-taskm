import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  Button
} from '@mui/material';
import RoleManagement from './RoleManagement';
import PermissionManagement from './PermissionManagement';
import SystemSetup from './SystemSetup';
import ModernDashboardLayout from '@/components/dashboard/ModernDashboardLayout';
import Sidebar from '@/components/Sidebar';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';

// Tab Panel Component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rbac-tabpanel-${index}`}
      aria-labelledby={`rbac-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RBACManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [error] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebarOpenState');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Sidebar toggle handler
  const handleDrawerToggle = () => {
    setSidebarOpen(prev => {
        const newState = !prev;
        localStorage.setItem('sidebarOpenState', JSON.stringify(newState));
        return newState;
    });
  };
  
  // Logout handler (needed for TopBar)
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Define Layout Elements
  const sidebarElement = <Sidebar 
                            open={sidebarOpen} 
                            onToggleDrawer={handleDrawerToggle}
                            onLogout={handleLogout}
                          />;
  const topBarElement = <DashboardTopBar 
                            onToggleSidebar={handleDrawerToggle}
                            username={user?.username || 'User'}
                            notificationCount={0}
                            onNotificationClick={() => {}}
                            onLogout={handleLogout}
                            onProfileClick={() => navigate('/profile')}
                            onSettingsClick={() => navigate('/settings')}
                            onHelpClick={() => {}}
                            onToggleTopWidgets={() => {}}
                            topWidgetsVisible={true}
                            showQuickNotesButton={false}
                          />;
  
  // --- Define Main Content ---
  const mainContentElement = (
    <Box sx={{ p: 3 }}> 
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#fff' }}>
        RBAC Management
      </Typography>
      <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
        Manage roles and permissions for system access control
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ 
        borderRadius: '10px', 
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ 
              '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .Mui-selected': { color: '#fff' },
              '& .MuiTabs-indicator': { backgroundColor: '#2196f3' }
            }}
          >
            <Tab label="Roles" />
            <Tab label="Permissions" />
            <Tab label="System Setup" />
            <Tab label="Workflow Visualizer" />
          </Tabs>
        </Box>

        {/* Roles Tab */}
        <TabPanel value={tabValue} index={0}>
          <RoleManagement />
        </TabPanel>

        {/* Permissions Tab */}
        <TabPanel value={tabValue} index={1}>
          <PermissionManagement />
        </TabPanel>

        {/* System Setup Tab */}
        <TabPanel value={tabValue} index={2}>
          <SystemSetup />
        </TabPanel>

        {/* Workflow Visualizer Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Workflow Permissions Visualizer
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
            Visualize and manage permissions by connecting roles to workflow steps.
            This tool provides a graphical interface for the selected workflow.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/admin/rbac/workflow-visualizer/task-creation')}
            sx={{ 
              backgroundColor: '#2196f3', 
              '&:hover': { backgroundColor: '#1976d2' },
              color: '#fff' 
            }}
          >
            Open Task Creation Workflow Visualizer
          </Button>
        </TabPanel>
      </Paper>
    </Box>
  );
  // --- End Main Content Definition ---

  // --- Main Return using ModernDashboardLayout ---
  return (
    <ModernDashboardLayout
      sidebar={sidebarElement}
      topBar={topBarElement}
      mainContent={mainContentElement}
      sidebarOpen={sidebarOpen}
      drawerWidth={240} // Assuming default drawer width
      // Add quick notes panel if needed later
    />
  );
};

export default RBACManagement; 