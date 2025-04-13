import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
import { Province, CreateProvinceDto, UpdateProvinceDto, Department } from '../../types'; // Assuming types are defined
import { DepartmentService } from '../../services/department'; // Import DepartmentService

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
        useQuery<Department[], Error>('allAdminDepartments', DepartmentService.getAllAdminDepartments, {
            enabled: open, // Only fetch when dialog is open
            staleTime: 5 * 60 * 1000,
        });

    // Fetch departments currently assigned to the selected province
    const { data: assignedDepartments, isLoading: isLoadingAssignedDepts, error: errorAssignedDepts } = 
        useQuery<Department[], Error>(['assignedDepartments', province?.id], 
            () => province ? provinceService.getAdminDepartmentsForProvince(province.id) : Promise.resolve([]),
            {
                enabled: open && !!province,
                staleTime: 1 * 60 * 1000, // Shorter stale time for potentially frequent updates
                onSuccess: (data) => {
                    // Set initial checkbox state based on currently assigned departments
                    setSelectedDepartmentIds(data.map(dept => dept.id));
                }
            }
        );

    // Mutation for assigning departments
    const assignMutation = useMutation((data: { provinceId: string; departmentIds: string[] }) => 
        provinceService.assignDepartmentsToProvince(data.provinceId, { departmentIds: data.departmentIds }), 
    {
        onSuccess: () => {
            queryClient.invalidateQueries(['assignedDepartments', province?.id]);
            queryClient.invalidateQueries('adminProvinces'); // Invalidate main list if needed
            onClose(); // Close dialog on success
        },
        onError: (err: any) => {
            console.error("Error assigning departments:", err);
            setAssignmentError(err.response?.data?.message || err.message || 'Failed to assign departments');
        }
    });

    const handleToggle = (departmentId: string) => () => {
        const currentIndex = selectedDepartmentIds.indexOf(departmentId);
        const newChecked = [...selectedDepartmentIds];

        if (currentIndex === -1) {
            newChecked.push(departmentId);
        } else {
            newChecked.splice(currentIndex, 1);
        }
        setSelectedDepartmentIds(newChecked);
    };

    const handleSaveAssignments = () => {
        if (province) {
            setAssignmentError(null);
            assignMutation.mutate({ provinceId: province.id, departmentIds: selectedDepartmentIds });
        }
    };

    const isLoading = isLoadingAllDepts || isLoadingAssignedDepts || assignMutation.isLoading;
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
                                            checked={selectedDepartmentIds.indexOf(department.id) !== -1}
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
                    {assignMutation.isLoading ? <CircularProgress size={24} /> : 'Save Assignments'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
// --- End Department Assignment Dialog ---

const ProvinceManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
    const [formData, setFormData] = useState<CreateProvinceDto | UpdateProvinceDto>({ name: '', description: '' });
    const [dialogError, setDialogError] = useState<string | null>(null);

    // State for Department Assignment Dialog
    const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
    const [provinceForAssignment, setProvinceForAssignment] = useState<Province | null>(null);

    // Fetch Provinces using React Query
    const { data: provinces, isLoading, error, refetch } = useQuery<Province[], Error>('adminProvinces', provinceService.getAdminProvinces, {
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    // Mutations for CRUD operations
    const createMutation = useMutation(provinceService.createAdminProvince, {
        onSuccess: () => {
            queryClient.invalidateQueries('adminProvinces');
            handleCloseDialog();
        },
        onError: (err: any) => {
            console.error("Error creating province:", err);
            setDialogError(err.response?.data?.message || err.message || 'Failed to create province');
        }
    });

    const updateMutation = useMutation((data: { id: string, dto: UpdateProvinceDto }) => provinceService.updateAdminProvince(data.id, data.dto), {
        onSuccess: () => {
            queryClient.invalidateQueries('adminProvinces');
            handleCloseDialog();
        },
         onError: (err: any) => {
            console.error("Error updating province:", err);
            setDialogError(err.response?.data?.message || err.message || 'Failed to update province');
        }
    });

    const deleteMutation = useMutation(provinceService.deleteAdminProvince, {
        onSuccess: () => {
            queryClient.invalidateQueries('adminProvinces');
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

    if (isLoading) return <CircularProgress />;
    if (error) return <Alert severity="error">Error fetching provinces: {error.message}</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Province Management</Typography>
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleOpenCreateDialog} 
                sx={{ mb: 2 }}
            >
                Create Province
            </Button>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {provinces?.map((province) => (
                            <TableRow key={province.id}>
                                <TableCell>{province.name}</TableCell>
                                <TableCell>{province.description || '-'}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleOpenEditDialog(province)} color="primary" aria-label="edit province">
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(province.id)} color="error" aria-label="delete province">
                                        <Delete />
                                    </IconButton>
                                    {/* Button to open department assignment dialog */}
                                    <IconButton onClick={() => handleOpenAssignmentDialog(province)} color="secondary" aria-label="assign departments">
                                        <Assignment />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {provinces?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center">No provinces found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{isEditMode ? 'Edit Province' : 'Create Province'}</DialogTitle>
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
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={createMutation.isLoading || updateMutation.isLoading}
                    >
                        {createMutation.isLoading || updateMutation.isLoading ? <CircularProgress size={24} /> : (isEditMode ? 'Save Changes' : 'Create')}
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
};

export default ProvinceManagement; 