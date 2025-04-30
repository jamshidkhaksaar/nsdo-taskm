import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import RoleManagement from './RoleManagement';
import PermissionManagement from './PermissionManagement';
import SystemSetup from './SystemSetup';

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

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3, height: '100%' }}>
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
      </Paper>
    </Box>
  );
};

export default RBACManagement; 