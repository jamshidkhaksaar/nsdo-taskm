import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Box,
  Avatar,
  AvatarGroup,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Container,
  useTheme,
  Divider,
  Tabs,
  Tab,
  Fade,
  SelectChangeEvent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';
import { DepartmentService } from '../../services/department';
import { Department } from '../../types/department';
import { User } from '../../types/user';
import { Province } from '../../types/province';
import * as provinceService from '../../services/provinceService';

interface AdminDepartment {
  id: string;
  name: string;
  description: string;
  head: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  } | null;
  head_name?: string;
  members_count: number;
  active_projects: number;
  completion_rate: number;
  members?: {
    id: string;
    name: string;
    avatar?: string;
  }[];
}

interface DepartmentFormData {
  name: string;
  description: string;
  head: string;
  provinceId: string | null;
}

interface EditMode {
  isEdit: boolean;
  departmentId: string | null;
}

const DRAWER_WIDTH = 240;

const DepartmentManagement: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
    head: '',
    provinceId: null,
  });
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>({
    isEdit: false,
    departmentId: null
  });
  const [tabValue, setTabValue] = useState(0);
  const glassStyles = getGlassmorphismStyles(theme);
  
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);
  const [availableProvinces, setAvailableProvinces] = useState<Province[]>([]);

  const dialogPaperProps = {
    sx: {
      ...glassStyles.form,
      minWidth: '500px',
      borderRadius: '16px',
      '& .MuiDialogTitle-root': {
        padding: '16px 24px',
        color: 'white',
      },
      '& .MuiDialogContent-root': {
        padding: '24px',
      },
      '& .MuiDialogActions-root': {
        padding: '16px 24px',
      },
    }
  };

  const { data: departments = [], isLoading: isLoadingDepartments, error: fetchDepartmentsError } = 
    useQuery<Department[], Error>('departments', DepartmentService.getDepartments, {
      staleTime: 5 * 60 * 1000,
    });

  const { data: provincesData = [], isLoading: isLoadingProvinces } = 
    useQuery<Province[], Error>('adminProvincesForSelect', provinceService.getAdminProvinces, {
      staleTime: 10 * 60 * 1000,
      onSuccess: (data) => setAvailableProvinces(data)
    });

  const createDepartmentMutation = useMutation(DepartmentService.createDepartment, {
    onSuccess: () => {
      queryClient.invalidateQueries('departments');
      handleCloseDialog();
      alert('Department created successfully!');
    },
    onError: (err: any) => {
      console.error("Error creating department:", err);
      setError(err.response?.data?.message || err.message || 'Failed to create department');
    }
  });

  const updateDepartmentMutation = useMutation(
    (data: { id: string, dto: Partial<Department> }) => DepartmentService.updateDepartment(data.id, data.dto),
    {
      onSuccess: (updatedDept) => {
        queryClient.invalidateQueries('departments');
        handleCloseDialog();
        alert('Department updated successfully!');
      },
      onError: (err: any) => {
        console.error("Error updating department:", err);
        setError(err.response?.data?.message || err.message || 'Failed to update department');
      }
    }
  );

  const deleteDepartmentMutation = useMutation(DepartmentService.deleteDepartment, {
    onSuccess: () => {
      queryClient.invalidateQueries('departments');
      alert('Department deleted successfully!');
    },
    onError: (err: any) => {
      console.error("Error deleting department:", err);
      setError(err.response?.data?.message || err.message || 'Failed to delete department');
    }
  });

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };
  
  const handleProvinceChange = (event: SelectChangeEvent<string | null>) => {
    const value = event.target.value;
    setFormData({ 
        ...formData, 
        provinceId: value === '' ? null : value 
    });
  };
  
  const handleHeadChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFormData({ 
        ...formData, 
        head: value
    });
  };

  const handleSaveDepartment = () => {
    setError(null);
    const submissionData: Partial<Department> & { headId?: string | null } = {
        name: formData.name,
        description: formData.description,
        headId: formData.head === '' ? null : formData.head, 
        provinceId: formData.provinceId || null
    };
    
    Object.keys(submissionData).forEach(key => {
       if (submissionData[key as keyof typeof submissionData] === '') { 
          if (key === 'description') { 
          } else if (key !== 'headId' && key !== 'provinceId') {
          } 
       }
    });

    if (editMode.isEdit && editMode.departmentId) {
        console.log("Updating department:", editMode.departmentId, submissionData);
        updateDepartmentMutation.mutate({ id: editMode.departmentId, dto: submissionData as any });
    } else {
        console.log("Creating department:", submissionData);
        if (!submissionData.name) {
            setError("Department Name is required.");
            return;
        }
        createDepartmentMutation.mutate(submissionData as any);
    }
  };

  const handleDeleteDepartment = (deptId: string) => {
    if (window.confirm('Are you sure you want to delete this department and potentially reassign its members/tasks?')) {
        deleteDepartmentMutation.mutate(deptId);
    }
  };

  const handleEditDepartment = (dept: Department) => {
    setEditMode({ isEdit: true, departmentId: dept.id });
    setFormData({
      name: dept.name,
      description: dept.description || '',
      head: dept.head?.id || '',
      provinceId: dept.provinceId || null
    });
    setError(null);
    setOpenDialog(true);
  };

  const handleOpenCreateDialog = () => {
    setEditMode({ isEdit: false, departmentId: null });
    setFormData({ name: '', description: '', head: '', provinceId: null });
    setError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode({ isEdit: false, departmentId: null });
    setFormData({ name: '', description: '', head: '', provinceId: '' });
    setError(null);
  };

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleToggleTopWidgets = useCallback(() => {
    setTopWidgetsVisible(prev => !prev);
  }, []);

  const handleLogout = () => {
    navigate('/login');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getRandomGradient = (id: string) => {
    const hash = id.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const h1 = Math.abs(hash % 360);
    const h2 = (h1 + 40) % 360;
    
    return `linear-gradient(135deg, hsl(${h1}, 70%, 35%) 0%, hsl(${h2}, 80%, 25%) 100%)`;
  };

  const handleOpenAddMemberDialog = () => {
    if (selectedDepartment) {
      setOpenAddMemberDialog(true);
      setSelectedMember('');
    }
  };

  const handleAddMemberToDepartment = async () => {
    if (!selectedDepartment || !selectedMember) return;
    
    try {
      console.log(`Adding user ${selectedMember} to department ${selectedDepartment.id}`);
      await DepartmentService.addMemberToDepartment(selectedDepartment.id, selectedMember);
      
      setOpenAddMemberDialog(false);
      setSelectedMember('');
      
      await queryClient.invalidateQueries('departments');
      
      if (selectedDepartment && selectedDepartment.id) {
        try {
          const updatedDept = await DepartmentService.getDepartment(selectedDepartment.id);
          console.log('Updated department after adding member:', updatedDept);
          setSelectedDepartment(updatedDept);
        } catch (fetchError) {
          console.error('Error fetching updated department:', fetchError);
        }
      }
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Failed to add member to department');
    }
  };

  const handleRemoveMemberFromDepartment = async (userId: string) => {
    if (!selectedDepartment) return;
    
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    try {
      await DepartmentService.removeMemberFromDepartment(selectedDepartment.id, userId);
      alert('Member removed successfully!');
      
      await queryClient.invalidateQueries('departments');
      
      const updatedDept = await DepartmentService.getDepartment(selectedDepartment.id);
      setSelectedDepartment(updatedDept);
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member from department');
    }
  };

  const mainContent = (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          color: '#fff',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          Department Management
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
          Manage departments, assign leaders, and organize team members
        </Typography>
      </Box>

      <Paper sx={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        mb: 4,
        overflow: 'hidden',
      }}>
        <Box sx={{ p: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
            <TextField
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                minWidth: { xs: '100%', md: 300 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Filter departments">
              <IconButton sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sort departments">
              <IconButton sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <SortIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{
                borderRadius: '8px',
                px: 3,
                py: 1,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 4px 10px rgba(33, 150, 243, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #00B0FF 90%)',
                  boxShadow: '0 6px 12px rgba(33, 150, 243, 0.4)',
                },
              }}
            >
              Add Department
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        <Box sx={{ px: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            textColor="inherit"
            sx={{ 
              '& .MuiTab-root': { 
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': { color: '#fff' }
              },
              '& .MuiTabs-indicator': { backgroundColor: theme.palette.primary.main }
            }}
          >
            <Tab label="All Departments" />
          </Tabs>
        </Box>
      </Paper>

      {isLoadingDepartments ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : departments.length === 0 ? (
        <Paper sx={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          p: 6,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <BusinessIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.2)' }} />
          <Typography variant="h6" sx={{ color: '#fff' }}>
            No Departments Found
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: 500, mx: 'auto', mb: 2 }}>
            There are no departments in the system yet. Create your first department to get started.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            sx={{
              borderRadius: '8px',
              px: 3,
              py: 1,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 4px 10px rgba(33, 150, 243, 0.3)',
            }}
          >
            Create First Department
          </Button>
        </Paper>
      ) : (
        <Fade in={true} timeout={500}>
          <Grid container spacing={3}>
            {departments.map((dept) => (
              <Grid item xs={12} sm={6} md={4} key={dept.id}>
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.07)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  },
                  position: 'relative',
                }}>
                  <Box sx={{ 
                    height: 80, 
                    background: getRandomGradient(dept.id),
                    position: 'relative',
                  }}>
                    <Avatar 
                      sx={{ 
                        position: 'absolute', 
                        bottom: -24, 
                        left: 24, 
                        width: 48, 
                        height: 48,
                        backgroundColor: theme.palette.primary.main,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                        border: '2px solid rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      <BusinessIcon />
                    </Avatar>
                  </Box>
                  
                  <CardContent sx={{ pt: 4, pb: 2, flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1, fontWeight: 600 }}>
                      {dept.name}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2, minHeight: 40 }}>
                      {dept.description || 'No description provided'}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                        Department Head
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: dept.head ? theme.palette.success.main : 'rgba(255, 255, 255, 0.1)' }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ color: '#fff' }}>
                          {dept.head?.username || dept.head_name || 'No Head Assigned'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                        Team Members
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AvatarGroup 
                          max={5}
                          sx={{
                            '& .MuiAvatar-root': {
                              width: 28,
                              height: 28,
                              fontSize: '0.75rem',
                              border: '2px solid rgba(255, 255, 255, 0.2)',
                            }
                          }}
                        >
                          {(dept.members || [])
                            .filter(member => member && member.name)
                            .map((member) => (
                              <Avatar 
                                key={member.id || 'unknown'} 
                                src={member.avatar}
                                sx={{ bgcolor: theme.palette.primary.dark }}
                              >
                                {member.name.charAt(0)}
                              </Avatar>
                            ))}
                          {dept.members_count > 5 && (
                            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}>
                              +{dept.members_count - 5}
                            </Avatar>
                          )}
                        </AvatarGroup>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {dept.members_count || 0} members
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  
                  <CardActions sx={{ p: 1.5, justifyContent: 'space-between' }}>
                    <Tooltip title="Edit department details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditDepartment(dept)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View department members">
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedDepartment(dept);
                          setOpenMembersDialog(true);
                        }}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        <GroupIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete department">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteDepartment(dept.id)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Fade>
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        PaperProps={dialogPaperProps}
      >
        <DialogTitle>
          {editMode.isEdit ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              label="Department Name"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              required
              variant="outlined"
              placeholder="Enter department name"
              InputLabelProps={{
                style: glassStyles.inputLabel
              }}
              sx={{
                '& .MuiOutlinedInput-root': glassStyles.input,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={handleFormChange}
              multiline
              rows={3}
              fullWidth
              placeholder="Enter department description"
              variant="outlined"
              InputLabelProps={{
                style: glassStyles.inputLabel
              }}
              sx={{
                '& .MuiOutlinedInput-root': glassStyles.input,
              }}
            />
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel id="department-head-label">Department Head</InputLabel>
              <Select
                labelId="department-head-label"
                name="head"
                value={formData.head}
                label="Department Head"
                onChange={handleHeadChange}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {availableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel id="department-province-label">Assigned Province</InputLabel>
              <Select
                labelId="department-province-label"
                name="provinceId"
                value={formData.provinceId ?? ''}
                label="Assigned Province"
                onChange={handleProvinceChange}
                disabled={isLoadingProvinces}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {availableProvinces.map((province) => (
                  <MenuItem key={province.id} value={province.id}>{province.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveDepartment} 
            variant="contained" 
            disabled={!formData.name}
            sx={glassStyles.button}
          >
            {editMode.isEdit ? 'Update Department' : 'Create Department'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openMembersDialog}
        onClose={() => setOpenMembersDialog(false)}
        PaperProps={dialogPaperProps}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography variant="h6" component="div">
                Department Members
              </Typography>
              {selectedDepartment && (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ mt: 0.5, color: 'text.secondary' }}
                  >
                    {selectedDepartment.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}
                  >
                    Total Members: {selectedDepartment.members?.length || 0}
                  </Typography>
                </>
              )}
            </div>
            <Button 
              variant="contained" 
              onClick={handleOpenAddMemberDialog}
              startIcon={<PersonIcon />}
              size="small"
              sx={glassStyles.button}
            >
              Add Member
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDepartment && selectedDepartment.members && selectedDepartment.members.length > 0 ? (
            <List>
              {selectedDepartment.members.map((member) => (
                <ListItem key={member?.id || 'unknown'}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleRemoveMemberFromDepartment(member.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={member.name} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No members in this department yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Add Member" to assign users to this department
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMembersDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openAddMemberDialog} 
        onClose={() => setOpenAddMemberDialog(false)}
        PaperProps={dialogPaperProps}
      >
        <DialogTitle>Add Member to Department</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={glassStyles.inputLabel}>Select User</InputLabel>
              <Select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                label="Select User"
                sx={{
                  '& .MuiOutlinedInput-root': glassStyles.input,
                  ...glassStyles.input
                }}
              >
                <MenuItem value="">Select a user</MenuItem>
                {availableUsers
                  .filter(user => !selectedDepartment?.members?.some(member => member.id === user.id))
                  .map((user) => (
                    <MenuItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenAddMemberDialog(false)}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddMemberToDepartment} 
            variant="contained" 
            disabled={!selectedMember}
            sx={glassStyles.button}
          >
            Add Member
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );

  return (
    <ModernDashboardLayout
      sidebar={
        <Sidebar
          open={sidebarOpen}
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
          onNotificationClick={() => console.log('Notification clicked')}
          onLogout={handleLogout}
          onProfileClick={() => navigate('/profile')}
          onSettingsClick={() => navigate('/admin/settings')}
          onHelpClick={() => console.log('Help clicked')}
          onToggleTopWidgets={handleToggleTopWidgets}
          topWidgetsVisible={topWidgetsVisible}
        />
      }
      mainContent={mainContent}
      sidebarOpen={sidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default DepartmentManagement;