import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Sidebar from '../components/Sidebar';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import { getProvinces, createProvince, updateProvince, deleteProvince, getDepartmentsByProvince, assignDepartmentToProvince } from '../services/provinceService/index'; // Corrected import path
import { TaskStatus } from '../types/task'; // Import TaskStatus
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
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [provinceDialogOpen, setProvinceDialogOpen] = useState(false);
  const [editProvince, setEditProvince] = useState<Province | null>(null);
  const [provinceForm, setProvinceForm] = useState({ name: '', description: '' });
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [departmentToAssign, setDepartmentToAssign] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Add state for sidebar
  const DRAWER_WIDTH = 240; // Define drawer width
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    setLoading(true);
    const data = await getProvinces();
    // Ensure provinces is always an array
    setProvinces(Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []));
    setLoading(false);
  };

  const handleSelectProvince = async (province: Province) => {
    setSelectedProvince(province);
    setLoading(true);
    const data = await getDepartmentsByProvince(province.id);
    setDepartments(data);
    setLoading(false);
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
    if (editProvince) {
      await updateProvince(editProvince.id, provinceForm);
    } else {
      await createProvince(provinceForm);
    }
    await fetchProvinces();
    handleCloseProvinceDialog();
  };

  const handleDeleteProvince = async (provinceId: string) => {
    await deleteProvince(provinceId);
    await fetchProvinces();
    setSelectedProvince(null);
    setDepartments([]);
  };

  const handleOpenAssignDialog = () => setAssignDialogOpen(true);
  const handleCloseAssignDialog = () => setAssignDialogOpen(false);

  const handleAssignDepartment = async () => {
    if (selectedProvince && departmentToAssign) {
      await assignDepartmentToProvince(selectedProvince.id, departmentToAssign);
      const data = await getDepartmentsByProvince(selectedProvince.id);
      setDepartments(data);
    }
    setDepartmentToAssign('');
    handleCloseAssignDialog();
  };

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleLogout = () => {
    // Handle logout logic here
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
          onLogout={handleLogout} // Add dummy logout handler
          drawerWidth={DRAWER_WIDTH}
        />
      }
      topBar={
        <DashboardTopBar
          username="Admin" // Placeholder username
          notificationCount={0} // Placeholder count
          onToggleSidebar={handleToggleSidebar}
          onNotificationClick={() => console.log('Notification clicked')} // Dummy handler
          onLogout={handleLogout} // Dummy handler
          onProfileClick={() => navigate('/profile')} // Dummy handler
          onSettingsClick={() => navigate('/settings')} // Dummy handler
          onHelpClick={() => console.log('Help clicked')} // Dummy handler
          onToggleTopWidgets={() => {}} // Dummy handler
          topWidgetsVisible={true} // Placeholder value
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
            {/* Province List */}
            <Grid item xs={12} md={4} lg={3}>
              <Paper sx={{ p: 2, mb: 2, background: 'rgba(255,255,255,0.08)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" color="#fff">Provinces</Typography>
                  <IconButton color="primary" onClick={() => handleOpenProvinceDialog()}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {Array.isArray(provinces) && provinces.map(province => (
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
              </Paper>
            </Grid>
            {/* Province Details */}
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
                </Paper>
              ) : (
                <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.08)', textAlign: 'center' }}>
                  <Typography variant="h6" color="#fff">
                    Select a province to view details
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
          {/* Province Create/Edit Dialog */}
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
          {/* Assign Department Dialog */}
          <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog}>
            <DialogTitle>Assign Department to Province</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Department ID"
                type="text"
                fullWidth
                value={departmentToAssign}
                onChange={e => setDepartmentToAssign(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAssignDialog}>Cancel</Button>
              <Button onClick={handleAssignDepartment} variant="contained">
                Assign
              </Button>
            </DialogActions>
          </Dialog>
          {/* Create Task Dialog */}
          <CreateTaskDialog
            open={createTaskDialogOpen}
            onClose={() => setCreateTaskDialogOpen(false)}
            onTaskCreated={() => {
              if (selectedProvince) handleSelectProvince(selectedProvince);
            }}
            dialogType="assign"
            initialStatus={TaskStatus.PENDING} // Use enum
          />
        </Container>
      }
    />
  );
};

export default ProvinceAdmin;