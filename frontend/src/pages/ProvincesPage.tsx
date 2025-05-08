import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
    Box, Typography, Alert, Grid, Tabs, Tab
} from '@mui/material';
import { RootState } from '../store';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import CreateTaskDialog from '@/components/tasks/CreateTaskDialog';
import { TaskType } from '@/types/index';
import Sidebar from '../components/Sidebar';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import { useNavigate } from 'react-router-dom';
import ProvinceSelector from '@/components/provinces/ProvinceSelector';
import DepartmentSelector from '@/components/provinces/DepartmentSelector';
import ProvincePerformance from '@/components/provinces/ProvincePerformance';

const DRAWER_WIDTH = 240;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`province-tabpanel-${index}`}
      aria-labelledby={`province-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `province-tab-${index}`,
    'aria-controls': `province-tabpanel-${index}`,
  };
};

const ProvincesPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { error: generalError, handleError, clearError } = useErrorHandler();

    const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState(0);
    const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
    };

    const handleProvinceSelect = (provinceIds: string[] | string) => {
        setSelectedProvinces(Array.isArray(provinceIds) ? provinceIds : [provinceIds]);
        setSelectedDepartments([]); // Clear department selection when province changes
    };

    const handleDepartmentSelect = (departmentIds: string[]) => {
        setSelectedDepartments(departmentIds);
    };

    const handleOpenCreateTaskDialog = () => {
        if (selectedProvinces.length === 0 || selectedDepartments.length === 0) {
            handleError('Please select at least one province and one department to assign a task.');
            return;
        }
        clearError();
        setCreateTaskDialogOpen(true);
    };

    const handleCloseCreateTaskDialog = () => {
        setCreateTaskDialogOpen(false);
    };

    const handleTaskCreated = () => {
        setSelectedDepartments([]);
        // Optionally, show a notification or feedback
    };

    const handleLogout = () => {
        navigate('/login');
    };

    const handleToggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const handleToggleTopWidgets = useCallback(() => {
        setTopWidgetsVisible(prev => !prev);
    }, []);

    const showPerformanceTab = user?.role === 'ADMIN' || user?.role === 'LEADERSHIP';

    const mainContent = (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff', px: 3, pt: 3 }}>Provinces</Typography>

            {generalError && (
                <Alert severity="error" sx={{ mx: 3, mb: 2 }}>
                    {generalError}
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    textColor="inherit"
                    sx={{ 
                        '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
                        '& .Mui-selected': { color: '#fff' },
                        '& .MuiTabs-indicator': { backgroundColor: '#fff' }
                    }}
                >
                    <Tab label="Task Assignment" {...a11yProps(0)} />
                    {showPerformanceTab && <Tab label="Performance Statistics" {...a11yProps(1)} />}
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    {/* Province Selection */}
                    <Grid item xs={12} md={4}>
                        <ProvinceSelector
                            multiple={true}
                            onChange={handleProvinceSelect}
                            selectedProvinces={selectedProvinces}
                            title="Select Provinces"
                        />
                    </Grid>

                    {/* Department Selection */}
                    <Grid item xs={12} md={8}>
                        <DepartmentSelector
                            provinceIds={selectedProvinces}
                            onChange={handleDepartmentSelect}
                            selectedDepartments={selectedDepartments}
                            title="Select Departments"
                            showAssignButton={true}
                            onAssignClick={handleOpenCreateTaskDialog}
                        />
                    </Grid>
                </Grid>
            </TabPanel>

            {showPerformanceTab && (
                <TabPanel value={tabValue} index={1}>
                    <ProvincePerformance />
                </TabPanel>
            )}

            <CreateTaskDialog
                open={createTaskDialogOpen}
                onClose={handleCloseCreateTaskDialog}
                onTaskCreated={handleTaskCreated}
                initialType={TaskType.PROVINCE_DEPARTMENT}
                dialogType="assign"
                initialAssignedDepartmentIds={selectedDepartments}
            />
        </Box>
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
                    username={user?.username || 'User'}
                    notificationCount={notifications}
                    onToggleSidebar={handleToggleSidebar}
                    onNotificationClick={() => setNotifications(0)}
                    onLogout={handleLogout}
                    onProfileClick={() => navigate('/profile')}
                    onSettingsClick={() => navigate('/settings')}
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

export default ProvincesPage; 