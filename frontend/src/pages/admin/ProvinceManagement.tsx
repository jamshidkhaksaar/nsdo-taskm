import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Box, 
    Button, 
    Typography, 
    CircularProgress, 
    Alert, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    IconButton, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogTitle, 
    TextField, 
    List, 
    ListItem, 
    ListItemIcon, 
    ListItemText, 
    Checkbox, 
    FormGroup, 
    FormControlLabel 
} from '@mui/material';
import { Edit, Delete, Add, Assignment } from '@mui/icons-material';
import * as provinceService from '../../services/provinceService'; // Assuming service functions are exported
import { Department, Province, CreateProvinceDto, UpdateProvinceDto } from '@/types/index';
import { DepartmentService } from '../../services/department'; // Import DepartmentService
import Sidebar from '../../components/Sidebar';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { getGlassmorphismStyles } from '@/utils/glassmorphismStyles';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useNavigate } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';

// --- Department Assignment Dialog Component ---
interface DepartmentAssignmentDialogProps {
    open: boolean;
    onClose: () => void;
    province: Province | null;
}

const DepartmentAssignmentDialog: React.FC<DepartmentAssignmentDialogProps> = ({ open, onClose, province }) => {
    const queryClient = useQueryClient();
    const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
    const [assignmentError, setAssignmentError] = useState<string | null>(null);

    // Fetch all departments
    const { data: allDepartments, isLoading: isLoadingAllDepts, error: errorAllDepts } = 
        useQuery<Department[], Error>({
            queryKey: ['allAdminDepartments'],
            queryFn: DepartmentService.getDepartments,
            enabled: open,
            staleTime: 5 * 60 * 1000,
        });

    // Fetch departments currently assigned to the selected province
    const { data: assignedDepartments, isLoading: isLoadingAssignedDepts, error: errorAssignedDepts } = 
        useQuery<Department[], Error>({
            queryKey: ['assignedDepartments', province?.id],
            queryFn: () => province ? provinceService.getAdminDepartmentsForProvince(province.id) : Promise.resolve([]),
            enabled: open && !!province,
            staleTime: 1 * 60 * 1000, // Shorter stale time for potentially frequent updates
        });

    // Effect to update checkboxes when assignedDepartments data changes
    useEffect(() => {
        if (assignedDepartments) {
            setSelectedDepartmentIds(assignedDepartments.map(dept => String(dept.id)));
        }
    }, [assignedDepartments]);

    // Mutation for assigning departments
    const assignMutation = useMutation({
        mutationFn: (data: { provinceId: string; departmentIds: string[] }) => 
            provinceService.assignDepartmentsToProvince(data.provinceId, { departmentIds: data.departmentIds }), 
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignedDepartments', province?.id] });
            queryClient.invalidateQueries({ queryKey: ['adminProvinces'] }); // Invalidate main list if needed
            onClose(); // Close dialog on success
        },
        onError: (err: any) => {
            console.error("Error assigning departments:", err);
            setAssignmentError(err.response?.data?.message || err.message || 'Failed to assign departments');
        }
    });

    const handleToggle = (departmentId: string | number) => () => {
        const idStr = String(departmentId);
        const currentIndex = selectedDepartmentIds.indexOf(idStr);
        const newChecked = [...selectedDepartmentIds];

        if (currentIndex === -1) {
            newChecked.push(idStr);
        } else {
            newChecked.splice(currentIndex, 1);
        }
        setSelectedDepartmentIds(newChecked);
    };

    const handleSaveAssignments = () => {
        if (province) {
            setAssignmentError(null);
            // Pass data directly to mutate
            assignMutation.mutate({ provinceId: province.id, departmentIds: selectedDepartmentIds });
        }
    };

    // Use isPending instead of isLoading for mutations in v5
    const isLoading = isLoadingAllDepts || isLoadingAssignedDepts || assignMutation.isPending;
    const errorMsg = errorAllDepts?.message || errorAssignedDepts?.message || assignmentError;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Assign Departments to {province?.name || 'Province'}</DialogTitle>
            <DialogContent dividers>
                {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
                {isLoading && !errorMsg && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
                {!isLoading && !errorMsg && allDepartments && (
                    <List dense sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        {allDepartments.length === 0 && <ListItem><ListItemText primary="No departments available." /></ListItem>}
                        {allDepartments.map((department) => {
                            const labelId = `checkbox-list-label-${department.id}`;
                            return (
                                <ListItem
                                    key={department.id}
                                    disablePadding
                                >
                                    <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                                        <Checkbox
                                            edge="start"
                                            checked={selectedDepartmentIds.indexOf(String(department.id)) !== -1}
                                            tabIndex={-1}
                                            disableRipple
                                            inputProps={{ 'aria-labelledby': labelId }}
                                            onChange={handleToggle(department.id)}
                                        />
                                    </ListItemIcon>
                                    <ListItemText id={labelId} primary={department.name} />
                                </ListItem>
                            );
                        })}
                    </List>
                )}
                 {!isLoading && !errorMsg && !allDepartments && !errorAllDepts && (
                    <Typography>Loading departments...</Typography> // Fallback state
                 )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleSaveAssignments} 
                    disabled={isLoading}
                    variant="contained"
                >
                    {/* Use isPending for mutation loading state */}
                    {assignMutation.isPending ? <CircularProgress size={24} /> : 'Save Assignments'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
// --- End Department Assignment Dialog ---

const DRAWER_WIDTH = 240;

const ProvinceManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
    const [formData, setFormData] = useState<CreateProvinceDto | UpdateProvinceDto>({ name: '', description: '' });
    const [dialogError, setDialogError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState(0);
    const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);

    // State for Department Assignment Dialog
    const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
    const [provinceForAssignment, setProvinceForAssignment] = useState<Province | null>(null);

    // Fetch Provinces using React Query
    const { data: provinces, isLoading, error, refetch } = useQuery<Province[], Error>({
        queryKey: ['adminProvinces'],
        queryFn: provinceService.getAdminProvinces,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    // Mutations for CRUD operations
    const createMutation = useMutation({
        mutationFn: provinceService.createAdminProvince,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminProvinces'] });
            handleCloseDialog();
        },
        onError: (err: any) => {
            console.error("Error creating province:", err);
            setDialogError(err.response?.data?.message || err.message || 'Failed to create province');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, dto: UpdateProvinceDto }) => provinceService.updateAdminProvince(data.id, data.dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminProvinces'] });
            handleCloseDialog();
        },
         onError: (err: any) => {
            console.error("Error updating province:", err);
            setDialogError(err.response?.data?.message || err.message || 'Failed to update province');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: provinceService.deleteAdminProvince,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminProvinces'] });
            // Optionally show a success notification
        },
         onError: (err: any) => {
            console.error("Error deleting province:", err);
            // Optionally show an error notification
            alert(err.response?.data?.message || err.message || 'Failed to delete province');
        }
    });

    // Dialog Handlers
    const handleOpenCreateDialog = () => {
        setIsEditMode(false);
        setSelectedProvince(null);
        setFormData({ name: '', description: '' });
        setDialogError(null);
        setOpenDialog(true);
    };

    const handleOpenEditDialog = (province: Province) => {
        setIsEditMode(true);
        setSelectedProvince(province);
        setFormData({ name: province.name, description: province.description || '' });
        setDialogError(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedProvince(null);
        setFormData({ name: '', description: '' });
        setDialogError(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this province?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = () => {
        setDialogError(null); // Clear previous errors
        if (!formData.name) {
            setDialogError("Province name is required.");
            return;
        }

        if (isEditMode && selectedProvince) {
            updateMutation.mutate({ id: selectedProvince.id, dto: formData as UpdateProvinceDto });
        } else {
            createMutation.mutate(formData as CreateProvinceDto);
        }
    };

    // Handlers for Assignment Dialog
    const handleOpenAssignmentDialog = (province: Province) => {
        setProvinceForAssignment(province);
        setAssignmentDialogOpen(true);
    };

    const handleCloseAssignmentDialog = () => {
        setAssignmentDialogOpen(false);
        setProvinceForAssignment(null);
    };

    const handleLogout = () => {
        navigate('/login');
    };

    const handleToggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const handleToggleTopWidgets = () => {
        setTopWidgetsVisible(prev => !prev);
    };

    if (isLoading) return <CircularProgress />;
    if (error) return <Alert severity="error">Error fetching provinces: {error.message}</Alert>;

    const mainContent = (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>Province Management</Typography>
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleOpenCreateDialog} 
                sx={{ mb: 2, color: '#fff' }}
            >
                Create Province
            </Button>
            <TableContainer component={Paper} sx={{ ...getGlassmorphismStyles().card }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Description</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {provinces?.map((province) => (
                            <TableRow key={province.id}>
                                <TableCell sx={{ color: '#fff' }}>{province.name}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{province.description || '-'}</TableCell>
                                <TableCell>
                                    <Tooltip title="Edit Province" arrow>
                                        <IconButton onClick={() => handleOpenEditDialog(province)} color="primary" aria-label="edit province">
                                            <Edit />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Province" arrow>
                                        <IconButton onClick={() => handleDelete(String(province.id))} color="error" aria-label="delete province">
                                            <Delete />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Assign Departments" arrow>
                                        <IconButton onClick={() => handleOpenAssignmentDialog(province)} color="secondary" aria-label="assign departments">
                                            <Assignment />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {provinces?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ color: '#fff' }}>No provinces found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} PaperProps={{ sx: { ...getGlassmorphismStyles().card } }}>
                <DialogTitle sx={{ color: '#fff' }}>{isEditMode ? 'Edit Province' : 'Create Province'}</DialogTitle>
                <DialogContent>
                    {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        name="name"
                        label="Province Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formData.name}
                        onChange={handleFormChange}
                        required
                        InputLabelProps={{ style: { color: '#fff' } }}
                        InputProps={{ style: { color: '#fff' } }}
                    />
                    <TextField
                        margin="dense"
                        name="description"
                        label="Description (Optional)"
                        type="text"
                        fullWidth
                        variant="standard"
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={handleFormChange}
                        InputLabelProps={{ style: { color: '#fff' } }}
                        InputProps={{ style: { color: '#fff' } }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {createMutation.isPending || updateMutation.isPending ? <CircularProgress size={24} /> : (isEditMode ? 'Save Changes' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Department Assignment Dialog */}
            <DepartmentAssignmentDialog
                open={assignmentDialogOpen}
                onClose={handleCloseAssignmentDialog}
                province={provinceForAssignment}
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
                    username={user?.username || 'Admin'}
                    notificationCount={notifications}
                    onToggleSidebar={handleToggleSidebar}
                    onNotificationClick={() => setNotifications(0)}
                    onLogout={handleLogout}
                    onProfileClick={() => navigate('/profile')}
                    onSettingsClick={() => navigate('/admin/settings')}
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

export default ProvinceManagement; 