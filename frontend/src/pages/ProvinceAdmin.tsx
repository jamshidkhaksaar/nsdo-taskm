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
  Card,
  CardContent,
  Button,
  Paper,
  Divider,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Sidebar from '../components/Sidebar';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import { getDepartmentsByProvince, createProvince, updateProvince, deleteProvince, assignDepartmentToProvince } from '../services/provinceService/index';
import { DepartmentService } from '../services/department';
import { TaskStatus } from '../types/task';
import { CreateTaskDialog } from '../components/tasks/CreateTaskDialog';

interface Province {
  id: string;
  name: string;
  description?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

const ProvinceAdmin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { provinces, loading, error } = useSelector((state: RootState) => state.provinces);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [provinceDialogOpen, setProvinceDialogOpen] = useState(false);
  const [editProvince, setEditProvince] = useState<Province | null>(null);
  const [provinceForm, setProvinceForm] = useState({ name: '', description: '' });
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [departmentToAssign, setDepartmentToAssign] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const DRAWER_WIDTH = 240;
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProvinces());
  }, [dispatch]);

  const handleSelectProvince = async (province: Province) => {
    setSelectedProvince(province);
    setLoadingDepartments(true);
    try {
      const data = await getDepartmentsByProvince(province.id);
      setDepartments(data || []);
    } catch (fetchError) {
      console.error("Error fetching departments for province:", fetchError);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleOpenProvinceDialog = (province?: Province) => {
    setEditProvince(province || null);
    setProvinceForm({
      name: province?.name || '',
      description: province?.description || '',
    });
    setProvinceDialogOpen(true);
  };

  const handleCloseProvinceDialog = () => {
    setProvinceDialogOpen(false);
    setEditProvince(null);
    setProvinceForm({ name: '', description: '' });
  };

  const handleProvinceFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProvinceForm({ ...provinceForm, [e.target.name]: e.target.value });
  };

  const handleSaveProvince = async () => {
    try {
      if (editProvince) {
        await updateProvince(editProvince.id, provinceForm);
      } else {
        await createProvince(provinceForm);
      }
      dispatch(fetchProvinces());
      handleCloseProvinceDialog();
    } catch (saveError) {
      console.error("Error saving province:", saveError);
    }
  };

  const handleDeleteProvince = async (provinceId: string) => {
    try {
      await deleteProvince(provinceId);
      dispatch(fetchProvinces());
      if (selectedProvince?.id === provinceId) {
        setSelectedProvince(null);
        setDepartments([]);
      }
    } catch (deleteError) {
      console.error("Error deleting province:", deleteError);
    }
  };

  const handleOpenAssignDialog = async () => {
    setLoadingDepartments(true);
    try {
      const fetchedDepartments = await DepartmentService.getDepartments();
      const assignedDepartmentIds = new Set(departments.map(d => d.id));
      setAllDepartments(fetchedDepartments.filter(d => !assignedDepartmentIds.has(d.id)));
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setAllDepartments([]);
    } finally {
      setLoadingDepartments(false);
      setAssignDialogOpen(true);
    }
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setDepartmentToAssign('');
    setAllDepartments([]);
  };

  const handleAssignDepartment = async () => {
    if (selectedProvince && departmentToAssign) {
      try {
        await assignDepartmentToProvince(selectedProvince.id, departmentToAssign);
        handleSelectProvince(selectedProvince);
      } catch(assignError) {
        console.error("Error assigning department:", assignError);
      }
    }
    handleCloseAssignDialog();
  };

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleLogout = () => {
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
          username="Admin"
          notificationCount={0}
          onToggleSidebar={handleToggleSidebar}
          onNotificationClick={() => console.log('Notification clicked')}
          onLogout={handleLogout}
          onProfileClick={() => navigate('/profile')}
          onSettingsClick={() => navigate('/settings')}
          onHelpClick={() => console.log('Help clicked')}
          onToggleTopWidgets={() => {}}
          topWidgetsVisible={true}
        />
      }
      mainContent={
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight="bold" color="#fff" mb={1}>
              Province Management
            </Typography>
            <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
              Manage provinces, assign departments, and assign tasks
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} lg={3}>
              <Paper sx={{ p: 2, mb: 2, background: 'rgba(255,255,255,0.08)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" color="#fff">Provinces</Typography>
                  <IconButton color="primary" onClick={() => handleOpenProvinceDialog()}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress />
                  </Box>
                )}
                {error && <Typography color="error">Error: {error}</Typography>}
                {!loading && !error && (
                  <List>
                    {(Array.isArray(provinces) ? provinces : []).map(province => (
                      <ListItem
                        button
                        key={province.id}
                        selected={selectedProvince?.id === province.id}
                        onClick={() => handleSelectProvince(province)}
                        secondaryAction={
                          <>
                            <IconButton edge="end" onClick={() => handleOpenProvinceDialog(province)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton edge="end" onClick={() => handleDeleteProvince(province.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </>
                        }
                      >
                        <ListItemText primary={province.name} secondary={province.description} />
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
                    <Button variant="outlined" onClick={handleOpenAssignDialog}>
                      Assign Department
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" color="rgba(255,255,255,0.7)" mb={2}>
                    Departments in this province:
                  </Typography>
                  {loadingDepartments ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      <List>
                        {departments.map(dept => (
                          <ListItem key={dept.id}>
                            <ListItemText primary={dept.name} secondary={dept.description} />
                            <Button variant="outlined" onClick={() => setCreateTaskDialogOpen(true)}>
                              Assign Task
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                      <Button variant="contained" sx={{ mt: 2 }} onClick={() => setCreateTaskDialogOpen(true)}>
                        Assign Task to Province
                      </Button>
                    </>
                  )}
                </Paper>
              ) : (
                <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.08)' }}>
                  <Typography color="rgba(255, 255, 255, 0.7)">Select a province to view details.</Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
          <Dialog open={provinceDialogOpen} onClose={handleCloseProvinceDialog}>
            <DialogTitle>{editProvince ? 'Edit Province' : 'Create Province'}</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                name="name"
                label="Province Name"
                type="text"
                fullWidth
                value={provinceForm.name}
                onChange={handleProvinceFormChange}
              />
              <TextField
                margin="dense"
                name="description"
                label="Description"
                type="text"
                fullWidth
                value={provinceForm.description}
                onChange={handleProvinceFormChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseProvinceDialog}>Cancel</Button>
              <Button onClick={handleSaveProvince} variant="contained">
                {editProvince ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} fullWidth maxWidth="xs">
            <DialogTitle>Assign Department to {selectedProvince?.name}</DialogTitle>
            <DialogContent>
              {loadingDepartments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
                  <CircularProgress />
                </Box>
              ) : allDepartments.length === 0 ? (
                <Typography sx={{ mt: 2 }}>No available departments to assign.</Typography>
              ) : (
                <FormControl fullWidth margin="dense">
                  <InputLabel id="assign-department-select-label">Select Department</InputLabel>
                  <Select
                    labelId="assign-department-select-label"
                    id="assign-department-select"
                    value={departmentToAssign}
                    label="Select Department"
                    onChange={e => setDepartmentToAssign(e.target.value as string)}
                  >
                    {allDepartments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAssignDialog}>Cancel</Button>
              <Button
                onClick={handleAssignDepartment}
                variant="contained"
                disabled={!departmentToAssign || loadingDepartments || allDepartments.length === 0}
              >
                Assign
              </Button>
            </DialogActions>
          </Dialog>
          <CreateTaskDialog
            open={createTaskDialogOpen}
            onClose={() => setCreateTaskDialogOpen(false)}
            onTaskCreated={() => {
              if (selectedProvince) handleSelectProvince(selectedProvince);
            }}
            dialogType="assign"
            initialStatus={TaskStatus.PENDING}
          />
        </Container>
      }
    />
  );
};

export default ProvinceAdmin;