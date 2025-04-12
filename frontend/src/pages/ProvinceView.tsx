import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchProvinces } from '../store/slices/provinceSlice';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider,
  Button,
} from '@mui/material';
import Sidebar from '../components/Sidebar'; // Assuming standard sidebar
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';

// Local or imported Province type
interface Province {
  id: string;
  name: string;
  description?: string;
}

const ProvinceView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { provinces, loading: loadingProvinces, error: provinceError } = useSelector((state: RootState) => state.provinces);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const DRAWER_WIDTH = 240;

  useEffect(() => {
    dispatch(fetchProvinces());
  }, [dispatch]);

  const handleSelectProvince = (province: Province) => {
    setSelectedProvince(province);
    // TODO: Fetch tasks for this province
    console.log("Selected Province:", province.id);
  };

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleLogout = () => {
    // Replace with actual logout logic if needed
    navigate('/login');
  };

  return (
    <ModernDashboardLayout
      sidebarOpen={isSidebarOpen}
      drawerWidth={DRAWER_WIDTH}
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
          notificationCount={0} // Placeholder
          onToggleSidebar={handleToggleSidebar}
          onNotificationClick={() => console.log('Notification clicked')} 
          onLogout={handleLogout} 
          onProfileClick={() => navigate('/profile')} 
          onSettingsClick={() => navigate('/settings')} 
          onHelpClick={() => console.log('Help clicked')} 
          onToggleTopWidgets={() => {}} 
          topWidgetsVisible={false} // Assume no top widgets here
        />
      }
      mainContent={
        <Container maxWidth="xl" sx={{ py: 3, display: 'flex', height: 'calc(100vh - 64px)' }}> {/* Adjust height based on topbar */} 
          {/* Province List Panel */}
          <Grid item xs={12} md={4} lg={3} sx={{ height: '100%', overflowY: 'auto' }}>
            <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.08)', height: '100%' }}>
              <Typography variant="h6" color="#fff" gutterBottom>Provinces</Typography>
              <Divider sx={{ mb: 2 }} />
              {loadingProvinces ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
              ) : provinceError ? (
                <Typography color="error">Error: {provinceError}</Typography>
              ) : (
                <List dense>
                  {(provinces || []).map(province => (
                    <ListItem
                      button
                      key={province.id}
                      selected={selectedProvince?.id === province.id}
                      onClick={() => handleSelectProvince(province)}
                    >
                      <ListItemText primary={province.name} sx={{ color: '#fff' }} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Task Display Panel */}
          <Grid item xs={12} md={8} lg={9} sx={{ height: '100%', overflowY: 'auto', pl: 3 }}>
            <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.08)', minHeight: '100%' }}>
              {selectedProvince ? (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" color="#fff">
                      Tasks for {selectedProvince.name}
                    </Typography>
                    <Button variant="contained" /* onClick={handleOpenAssignTaskDialog} */ >
                      Assign Task to Province
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {/* TODO: Add Task fetching and display logic here (Tabs/Columns for status) */}
                  <Typography color="rgba(255, 255, 255, 0.7)">
                    Task display area for {selectedProvince.name}. (Implementation pending)
                  </Typography>
                </Box>
              ) : (
                <Typography color="rgba(255, 255, 255, 0.7)">
                  Select a province from the list to view its tasks.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Container>
      }
    />
  );
};

export default ProvinceView; 