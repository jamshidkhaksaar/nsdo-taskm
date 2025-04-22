import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box, Typography, Paper, List, ListItem, ListItemText, Button,
    CircularProgress, Alert, Grid, Divider, Checkbox
} from '@mui/material';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { AppDispatch, RootState } from '../store';
import { Province, Department } from '@/types/index';
import { fetchProvinces } from '../store/slices/provinceSlice';
import { fetchDepartments } from '../store/slices/departmentSlice';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import CreateTaskDialog from '@/components/dialogs/CreateTaskDialog';
import { TaskType } from '@/types/index';
import Sidebar from '../components/Sidebar';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import { useNavigate } from 'react-router-dom';
import { getGlassmorphismStyles } from '@/utils/glassmorphismStyles';
import { MagicCard } from "@/components/magicui/magic-card";

const DRAWER_WIDTH = 240;

const ProvincesPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { provinces, loading: loadingProvinces, error: errorProvinces } = useSelector((state: RootState) => state.provinces);
    const { departments, loading: loadingDepartments, error: errorDepartments } = useSelector((state: RootState) => state.departments);
    const { error: generalError, handleError, clearError } = useErrorHandler();

    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState(0);
    const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);

    useEffect(() => {
        dispatch(fetchProvinces());
        dispatch(fetchDepartments());
    }, [dispatch]);

    const handleProvinceSelect = (province: Province) => {
        setSelectedProvince(province);
        setSelectedDepartments([]); // Clear department selection when province changes
    };

    const handleDepartmentToggle = (departmentId: string) => {
        setSelectedDepartments(prev =>
            prev.includes(departmentId)
                ? prev.filter(id => id !== departmentId)
                : [...prev, departmentId]
        );
    };

    const handleOpenCreateTaskDialog = () => {
        if (!selectedProvince || selectedDepartments.length === 0) {
            handleError('Please select a province and at least one department to assign a task.');
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

    // Filter departments for the selected province
    const departmentsInSelectedProvince = React.useMemo(() => {
        if (!selectedProvince) return [];
        return (departments as Department[]).filter(dept => dept.provinceId && dept.provinceId === selectedProvince.id);
    }, [selectedProvince, departments]);

    const isLoading = loadingProvinces || loadingDepartments;
    const combinedError = errorProvinces || errorDepartments || generalError;

    const mainContent = (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>Provinces</Typography>

            {combinedError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {combinedError}
                </Alert>
            )}

            {isLoading && !combinedError && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            {!isLoading && !combinedError && (
                <Grid container spacing={3}>
                    {/* Province List */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{ ...getGlassmorphismStyles().card, p: 2, color: '#fff' }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Select Province</Typography>
                            <List component="nav" dense>
                                {provinces.map((province) => (
                                    <ListItem
                                        key={province.id}
                                        button
                                        selected={selectedProvince?.id === province.id}
                                        onClick={() => handleProvinceSelect(province)}
                                        sx={{
                                            ...getGlassmorphismStyles().card,
                                            mb: 1,
                                            borderRadius: 1,
                                            '&.Mui-selected': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.25) !important',
                                            },
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={province.name}
                                            sx={{
                                                '.MuiListItemText-primary': { color: '#fff' },
                                                '.MuiListItemText-secondary': { color: 'rgba(255, 255, 255, 0.7)' }
                                            }}
                                        />
                                    </ListItem>
                                ))}
                                {provinces.length === 0 && (
                                    <ListItem>
                                        <ListItemText primary="No provinces found." sx={{ '.MuiListItemText-primary': { color: '#fff' } }} />
                                    </ListItem>
                                )}
                            </List>
                        </Paper>
                    </Grid>

                    {/* Department List for Selected Province */}
                    <Grid item xs={12} md={8}>
                        <Paper elevation={0} sx={{ ...getGlassmorphismStyles().card, p: 2, minHeight: '300px', color: '#fff' }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                                {selectedProvince ? `Departments in ${selectedProvince.name}` : 'Select a Province'}
                            </Typography>
                            {selectedProvince && (
                                <>
                                    <List dense>
                                        {departmentsInSelectedProvince.length > 0 ? (
                                            departmentsInSelectedProvince.map((dept) => (
                                                <ListItem
                                                    key={dept.id}
                                                    secondaryAction={
                                                        <Checkbox
                                                            edge="end"
                                                            onChange={() => handleDepartmentToggle(dept.id)}
                                                            checked={selectedDepartments.includes(dept.id)}
                                                            inputProps={{ 'aria-labelledby': `checkbox-list-label-${dept.id}` }}
                                                            sx={{ color: '#fff' }}
                                                        />
                                                    }
                                                    disablePadding
                                                >
                                                    <ListItemText id={`checkbox-list-label-${dept.id}`} primary={dept.name} sx={{ '.MuiListItemText-primary': { color: '#fff' } }} />
                                                </ListItem>
                                            ))
                                        ) : (
                                            <ListItem>
                                                <ListItemText primary={`No departments found associated with ${selectedProvince.name}.`} sx={{ '.MuiListItemText-primary': { color: '#fff' } }} />
                                            </ListItem>
                                        )}
                                    </List>
                                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddTaskIcon />}
                                            onClick={handleOpenCreateTaskDialog}
                                            disabled={selectedDepartments.length === 0}
                                            sx={{ color: '#fff' }}
                                        >
                                            Assign Task to Selected Department(s)
                                        </Button>
                                    </Box>
                                </>)
                            }
                            {!selectedProvince && (
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Please select a province from the list to view its departments.</Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            <CreateTaskDialog
                open={createTaskDialogOpen}
                onClose={handleCloseCreateTaskDialog}
                onTaskCreated={handleTaskCreated}
                initialType={TaskType.PROVINCE_DEPARTMENT}
                dialogType="assign"
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