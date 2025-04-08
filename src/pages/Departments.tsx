import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, useMediaQuery, useTheme, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, Paper, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { AppDispatch, RootState } from '../../frontend/src/store';
import { logout } from '../../frontend/src/store/slices/authSlice';
import axios from '../../frontend/src/utils/axios';

interface Department {
    id: string;
    name: string;
    description?: string;
}

const Departments: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
    const [departmentName, setDepartmentName] = useState('');
    const [departmentDescription, setDepartmentDescription] = useState('');

    const fetchDepartments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/departments');
            setDepartments(response.data || []);
        } catch (err) {
            console.error('Error fetching departments:', err);
            setError('Failed to load departments.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const handleOpenDialog = (dept: Department | null = null) => {
        if (dept) {
            setIsEditing(true);
            setCurrentDepartment(dept);
            setDepartmentName(dept.name);
            setDepartmentDescription(dept.description || '');
        } else {
            setIsEditing(false);
            setCurrentDepartment(null);
            setDepartmentName('');
            setDepartmentDescription('');
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    const handleSaveDepartment = async () => {
        const departmentData = { name: departmentName, description: departmentDescription };
        try {
            if (isEditing && currentDepartment) {
                await axios.put(`/api/departments/${currentDepartment.id}`, departmentData);
            } else {
                await axios.post('/api/departments', departmentData);
            }
            handleCloseDialog();
            fetchDepartments();
        } catch (err) {
            console.error('Error saving department:', err);
            setError('Failed to save department.');
        }
    };

    const handleDeleteDepartment = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            try {
                await axios.delete(`/api/departments/${id}`);
                fetchDepartments();
            } catch (err) {
                console.error('Error deleting department:', err);
                setError('Failed to delete department.');
            }
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>Departments</Typography>
            <Button variant="contained" onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
                Add Department
            </Button>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <CircularProgress />
            ) : (
                <Paper elevation={1} sx={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <List>
                        {departments.map((dept) => (
                            <ListItem key={dept.id} divider>
                                <ListItemText
                                    primary={dept.name}
                                    secondary={dept.description}
                                    primaryTypographyProps={{ color: 'white' }}
                                    secondaryTypographyProps={{ color: '#ccc' }}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" aria-label="edit" onClick={() => handleOpenDialog(dept)} sx={{ color: 'white', mr: 1 }}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteDepartment(dept.id)} sx={{ color: '#ff8a80' }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                        {departments.length === 0 && (
                            <ListItem>
                                <ListItemText primary="No departments found." sx={{ color: '#ccc' }} />
                            </ListItem>
                        )}
                    </List>
                </Paper>
            )}

            <Dialog open={dialogOpen} onClose={handleCloseDialog} PaperProps={{ sx: { background: '#333', color: 'white' } }}>
                <DialogTitle>{isEditing ? 'Edit Department' : 'Add Department'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Department Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={departmentName}
                        onChange={(e) => setDepartmentName(e.target.value)}
                        InputLabelProps={{ style: { color: '#ccc' } }}
                        InputProps={{ style: { color: 'white' } }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="description"
                        label="Description (Optional)"
                        type="text"
                        fullWidth
                        multiline
                        rows={3}
                        variant="standard"
                        value={departmentDescription}
                        onChange={(e) => setDepartmentDescription(e.target.value)}
                        InputLabelProps={{ style: { color: '#ccc' } }}
                        InputProps={{ style: { color: 'white' } }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} sx={{ color: '#ccc' }}>Cancel</Button>
                    <Button onClick={handleSaveDepartment} variant="contained">{isEditing ? 'Save Changes' : 'Add'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Departments;