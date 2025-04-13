import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchProvinces } from '../store/slices/provinceSlice';
import { fetchDepartments } from '../store/slices/departmentSlice';
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
  Chip,
} from '@mui/material';
import Sidebar from '../components/Sidebar';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import { CreateTaskDialog } from '../components/tasks/CreateTaskDialog';
import { TaskStatus } from '../types/task';

const DRAWER_WIDTH = 240;

const ProvincesPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { provinces, loading: loadingProvinces, error: provinceError } = useSelector((state: RootState) => state.provinces);
  const { departments } = useSelector((state: RootState) => state.departments);

  const [selectedProvince, setSelectedProvince] = useState<any | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    dispatch(fetchProvinces());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleSelectProvince = (province: any) => {
    setSelectedProvince(province);
    setSelectedDepartments([]); // Reset selected departments when changing province
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    // Implement logout logic
    navigate('/login');
  };

  const handleToggleDepartment = (departmentId: string) => {
    setSelectedDepartments(prev => {
      if (prev.includes(departmentId)) {
        return prev.filter(id => id !== departmentId);
      } else {
        return [...prev, departmentId];
      }
    });
  };

  const handleAssignTask = () => {
    if (selectedDepartments.length === 0) {
      alert('Please select at least one department');
      return;
    }
    setCreateTaskDialogOpen(true);
  };

  // Filter departments by selected province
  const provinceDepartments = departments.filter(
    dept => selectedProvince && dept.provinceId === selectedProvince.id
  );

  const sidebarElement = (
    <Sidebar
      open={isSidebarOpen}
      onToggleDrawer={handleToggleSidebar}
      drawerWidth={DRAWER_WIDTH}
      onLogout={handleLogout}
    />
  );

  const topBarElement = (
    <DashboardTopBar
      username={user?.username || 'User'}
      notificationCount={notifications}
      onToggleSidebar={handleToggleSidebar}
      onNotificationClick={() => console.log('Notifications clicked')}
      onLogout={handleLogout}
      onProfileClick={() => navigate('/profile')}
      onSettingsClick={() => navigate('/settings')}
      onHelpClick={() => console.log('Help clicked')}
      onToggleTopWidgets={() => {}}
      topWidgetsVisible={true}
      rightSidebarVisible={false}
      onToggleRightSidebar={() => {}}
      onToggleQuickNotes={() => {}}
      showQuickNotes={false}
    />
  );

  const mainContentElement = (
    <Container maxWidth="xl" sx={{ py: 3, display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Province List Panel */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4} lg={3}>
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
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.16)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.24)',
                        }
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      }
                    }}
                  >
                    <ListItemText 
                      primary={province.name} 
                      secondary={province.description} 
                      sx={{
                        '.MuiListItemText-primary': { color: '#fff' },
                        '.MuiListItemText-secondary': { color: 'rgba(255, 255, 255, 0.7)' }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8} lg={9}>
          {selectedProvince ? (
            <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.08)' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" color="#fff">
                  {selectedProvince.name}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={handleAssignTask}
                  disabled={selectedDepartments.length === 0}
                  sx={{ 
                    backgroundColor: 'primary.main', 
                    color: '#fff',
                    '&:hover': { backgroundColor: 'primary.dark' },
                    '&.Mui-disabled': { backgroundColor: 'rgba(255, 255, 255, 0.12)', color: 'rgba(255, 255, 255, 0.3)' }
                  }}
                >
                  Assign Task to Selected Departments
                </Button>
              </Box>
              
              {selectedProvince.description && (
                <Typography color="rgba(255, 255, 255, 0.7)" mb={3}>
                  {selectedProvince.description}
                </Typography>
              )}
              
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="h6" color="#fff" mb={2}>
                Departments in {selectedProvince.name}
              </Typography>
              
              {provinceDepartments.length === 0 ? (
                <Typography color="rgba(255, 255, 255, 0.7)">
                  No departments found for this province.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {provinceDepartments.map(dept => (
                    <Grid item xs={12} sm={6} md={4} key={dept.id}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          backgroundColor: selectedDepartments.includes(dept.id) 
                            ? 'rgba(25, 118, 210, 0.16)' 
                            : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'background-color 0.3s',
                          '&:hover': {
                            backgroundColor: selectedDepartments.includes(dept.id)
                              ? 'rgba(25, 118, 210, 0.24)'
                              : 'rgba(255, 255, 255, 0.08)'
                          }
                        }}
                        onClick={() => handleToggleDepartment(dept.id)}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography color="#fff" fontWeight={500}>
                            {dept.name}
                          </Typography>
                          {selectedDepartments.includes(dept.id) && (
                            <Chip 
                              label="Selected" 
                              size="small" 
                              color="primary"
                              sx={{ height: 24 }}
                            />
                          )}
                        </Box>
                        {dept.description && (
                          <Typography color="rgba(255, 255, 255, 0.7)" variant="body2" mt={1}>
                            {dept.description}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          ) : (
            <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.08)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="rgba(255, 255, 255, 0.7)" variant="h6">
                Select a province to view its departments
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onClose={() => setCreateTaskDialogOpen(false)}
        onTaskCreated={() => {
          setCreateTaskDialogOpen(false);
          setSelectedDepartments([]);
        }}
        dialogType="assign"
        initialStatus={TaskStatus.PENDING}
        preSelectedDepartmentIds={selectedDepartments}
        preSelectedProvince={selectedProvince?.id || null}
      />
    </Container>
  );

  return (
    <ModernDashboardLayout
      sidebar={sidebarElement}
      topBar={topBarElement}
      mainContent={mainContentElement}
      sidebarOpen={isSidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default ProvincesPage;
