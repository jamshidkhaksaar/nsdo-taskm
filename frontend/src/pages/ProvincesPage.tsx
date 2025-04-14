import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box, Typography, Paper, List, ListItem, ListItemText, Button,
    CircularProgress, Alert, Grid, Divider, Checkbox, IconButton
} from '@mui/material';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { AppDispatch, RootState } from '../store';
import { Province } from '../types/province';
import { Department } from '../types/department';
import { fetchProvinces } from '../store/slices/provinceSlice'; // Assuming province slice exists
import { fetchDepartments } from '../store/slices/departmentSlice'; // Fetch all departments
import { useErrorHandler } from '@/hooks/useErrorHandler';
import CreateTaskDialog from '@/components/dialogs/CreateTaskDialog';
import { TaskType } from '@/types';

const ProvincesPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { provinces, loading: loadingProvinces, error: errorProvinces } = useSelector((state: RootState) => state.provinces);
    const { departments, loading: loadingDepartments, error: errorDepartments } = useSelector((state: RootState) => state.departments);
    const { error: generalError, handleError, clearError } = useErrorHandler();

    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

    // Fetch initial data
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
        // Optionally add feedback or clear selection
        setSelectedDepartments([]);
        console.log('Task assigned to province departments.');
    };

    // Filter departments for the selected province
    const departmentsInSelectedProvince = React.useMemo(() => {
        if (!selectedProvince) return [];
        // Ensure departments have provinceId linked
        return departments.filter(dept => dept.provinceId === selectedProvince.id);
    }, [selectedProvince, departments]);

    const isLoading = loadingProvinces || loadingDepartments;
    const combinedError = errorProvinces || errorDepartments || generalError;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Provinces</Typography>

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
                        <Paper elevation={1} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Select Province</Typography>
                            <List component="nav" dense>
                                {provinces.map((province) => (
                                    <ListItem
                                        button
                                        key={province.id}
                                        selected={selectedProvince?.id === province.id}
                                        onClick={() => handleProvinceSelect(province)}
                                    >
                                        <ListItemText primary={province.name} />
                                    </ListItem>
                                ))}
                                {provinces.length === 0 && (
                                    <ListItem>
                                        <ListItemText primary="No provinces found." />
                                    </ListItem>
                                )}
                            </List>
                        </Paper>
                    </Grid>

                    {/* Department List for Selected Province */}
                    <Grid item xs={12} md={8}>
                        <Paper elevation={1} sx={{ p: 2, minHeight: '300px' }}>
                            <Typography variant="h6" gutterBottom>
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
                                                        />
                                                    }
                                                    disablePadding
                                                >
                                                    <ListItemText id={`checkbox-list-label-${dept.id}`} primary={dept.name} />
                                                </ListItem>
                                            ))
                                        ) : (
                                            <ListItem>
                                                <ListItemText primary={`No departments found associated with ${selectedProvince.name}.`} />
                                            </ListItem>
                                        )}
                                    </List>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddTaskIcon />}
                                            onClick={handleOpenCreateTaskDialog}
                                            disabled={selectedDepartments.length === 0}
                                        >
                                            Assign Task to Selected Department(s)
                                        </Button>
                                    </Box>
                                </>)
                            }
                            {!selectedProvince && (
                                <Typography variant="body2" color="text.secondary">Please select a province from the list to view its departments.</Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            <CreateTaskDialog
                open={createTaskDialogOpen}
                onClose={handleCloseCreateTaskDialog}
                onTaskCreated={handleTaskCreated}
                // Pre-fill context for Province-Department assignment
                initialType={TaskType.PROVINCE_DEPARTMENT}
                // Pass selected province and departments for pre-filling if dialog supports it
                // initialProvinceId={selectedProvince?.id}
                // initialDepartmentIds={selectedDepartments}
                dialogType="assign"
            />

        </Box>
    );
};

export default ProvincesPage; 