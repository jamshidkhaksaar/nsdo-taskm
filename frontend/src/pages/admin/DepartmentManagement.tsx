import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';
import { DepartmentService } from '../../services/department';
import { Department, CreateDepartmentPayload, Province } from '@/types/index';
import * as provinceService from '../../services/provinceService';
import { UserService } from '../../services/user';
import MemberCard from '../../components/departments/MemberCard';

interface DepartmentFormData {
  name: string;
  description: string;
  headId: string;
  provinceId: string | null;
}

interface EditMode {
  isEdit: boolean;
  departmentId: string | null;
}

interface LocalUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: { id: string; name: string };
  created_at: string;
  updated_at: string;
  avatar?: string;
  role?: string | { id: string; name: string };
  position?: string;
  status: string;
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
    headId: '',
    provinceId: null,
  });
  const [availableUsers, setAvailableUsers] = useState<LocalUser[]>([]);
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
  const [fullDepartments, setFullDepartments] = useState<Department[]>([]);

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

  const memberDialogPaperProps = {
    sx: {
      ...glassStyles.form,
      minWidth: '800px',
      maxWidth: '1200px',
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

  const { data: departments = [], isLoading: isLoadingDepartments } = 
    useQuery<Department[], Error>({
      queryKey: ['departments'],
      queryFn: DepartmentService.getDepartments,
      staleTime: 5 * 60 * 1000,
    });

  const { data: provincesData = [], isLoading: isLoadingProvinces } = 
    useQuery<Province[], Error>({
      queryKey: ['adminProvincesForSelect'],
      queryFn: provinceService.getAdminProvinces,
      staleTime: 10 * 60 * 1000,
    });

  useEffect(() => {
    if (provincesData) {
      setAvailableProvinces(provincesData);
    }
  }, [provincesData]);

  const createDepartmentMutation = useMutation({
    mutationFn: DepartmentService.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      handleCloseDialog();
      alert('Department created successfully!');
    },
    onError: (err: any) => {
      console.error("Error creating department:", err);
      setError(err.response?.data?.message || err.message || 'Failed to create department');
    }
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: (data: { id: string, dto: Partial<Department> }) => 
      DepartmentService.updateDepartment(data.id, data.dto),
    onSuccess: (updatedDept) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      handleCloseDialog();
      alert('Department updated successfully!');
    },
    onError: (err: any) => {
      console.error("Error updating department:", err);
      setError(err.response?.data?.message || err.message || 'Failed to update department');
    }
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: DepartmentService.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
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
      provinceId: value === '' ? null : String(value)
    });
  };
  
  const handleHeadChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFormData({ 
        ...formData, 
        headId: value
    });
  };

  const handleSaveDepartment = () => {
    setError(null);
    const submissionData: CreateDepartmentPayload = {
      name: formData.name,
      description: formData.description || undefined,
      provinceId: formData.provinceId || null,
      head: formData.headId || null
    };

    if (!submissionData.name) {
      setError("Department Name is required.");
      return;
    }

    if (editMode.isEdit && editMode.departmentId) {
      const updateDto: Partial<Department> = {
        name: submissionData.name,
        description: submissionData.description,
        provinceId: submissionData.provinceId,
        headId: submissionData.head
      };
      if (updateDto.description === undefined) delete updateDto.description;
      if (updateDto.provinceId === null) delete updateDto.provinceId;
      if (updateDto.headId === null) delete updateDto.headId;

      updateDepartmentMutation.mutate({ id: editMode.departmentId, dto: updateDto });
    } else {
      createDepartmentMutation.mutate(submissionData);
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
      headId: dept.head?.id || '',
      provinceId: dept.provinceId || null
    });
    setError(null);
    setOpenDialog(true);
  };

  const handleOpenCreateDialog = () => {
    setEditMode({ isEdit: false, departmentId: null });
    setFormData({ name: '', description: '', headId: '', provinceId: null });
    setError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode({ isEdit: false, departmentId: null });
    setFormData({ name: '', description: '', headId: '', provinceId: '' });
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
      
      await queryClient.invalidateQueries({ queryKey: ['departments'] });
      
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

  const handleRemoveMemberFromDepartment = async (userId: string | number) => {
    if (!selectedDepartment) return;
    
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    try {
      await DepartmentService.removeMemberFromDepartment(selectedDepartment.id, String(userId));
      alert('Member removed successfully!');
      
      await queryClient.invalidateQueries({ queryKey: ['departments'] });
      
      const updatedDept = await DepartmentService.getDepartment(selectedDepartment.id);
      setSelectedDepartment(updatedDept);
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member from department');
    }
  };

  useEffect(() => {
    async function fetchUsers() {
      try {
        const users = await UserService.getUsers();
        setAvailableUsers(users.map((u: any) => ({ ...u, id: String(u.id) })));
      } catch (error) {
        setAvailableUsers([]);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchFullDepartments() {
      if (!departments || departments.length === 0) {
        setFullDepartments([]);
        return;
      }
      try {
        const details = await Promise.all(
          departments.map(dept => DepartmentService.getDepartment(dept.id))
        );
        setFullDepartments(details);
      } catch (error) {
        setFullDepartments([]);
      }
    }
    fetchFullDepartments();
  }, [departments]);

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
      ) : fullDepartments.length === 0 ? (
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
            {fullDepartments.map((dept) => (
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

                    {dept.province_name && (
                       <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOnIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {dept.province_name}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                        Department Head
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: dept.head ? theme.palette.success.main : 'rgba(255, 255, 255, 0.1)' }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ color: '#fff' }}>
                          {dept.head_name || 'No Head Assigned'}
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
                            .filter(member => member && (member.username || member.first_name))
                            .map((member) => (
                              <Avatar 
                                key={member.id || 'unknown'} 
                                src={member.avatar}
                                sx={{ bgcolor: theme.palette.primary.dark }}
                              >
                                {(member.username || (member.first_name ? member.first_name[0] : '?'))}
                              </Avatar>
                            ))}
                          {(dept.members && dept.members.length > 5) && (
                            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}>
                              +{dept.members.length - 5}
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
              name="name"
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
              name="description"
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
                name="headId"
                value={formData.headId}
                label="Department Head"
                onChange={handleHeadChange}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {availableUsers
                  .filter(user => user.status === 'active')
                  .map((user) => (
                    <MenuItem key={user.id} value={user.id}>{user.username || (user.first_name + ' ' + user.last_name)}</MenuItem>
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
        PaperProps={memberDialogPaperProps}
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
        <DialogContent sx={{ minHeight: '400px', maxHeight: '600px', overflow: 'auto' }}>
          {selectedDepartment && selectedDepartment.members && selectedDepartment.members.length > 0 ? (
            <Grid container spacing={2}>
              {(selectedDepartment?.members || [])
                .map((member) => {
                  if (!member || !member.id) return null;

                  // Get full user data from availableUsers if available
                  const fullUser = availableUsers.find(u => String(u.id) === String(member.id));
                  
                  // Prepare member data for MemberCard
                  const memberRole = member.role || fullUser?.role;
                  const roleForCard = typeof memberRole === 'string' 
                    ? { id: memberRole, name: memberRole } 
                    : memberRole as { id: string; name: string } | undefined;
                  
                  const memberData = {
                    id: member.id,
                    username: member.username || fullUser?.username,
                    first_name: member.first_name || fullUser?.first_name,
                    last_name: member.last_name || fullUser?.last_name,
                    avatar: member.avatar || fullUser?.avatar,
                    position: member.position || fullUser?.position,
                    role: roleForCard,
                  };

                  return (
                    <Grid item xs={12} sm={6} md={4} key={member.id}>
                      <MemberCard
                        member={memberData}
                        onRemove={handleRemoveMemberFromDepartment}
                        canRemove={true}
                      />
                    </Grid>
                  );
                })
                .filter(Boolean)
              }
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <PersonIcon sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No members in this department yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click "Add Member" to assign users to this department
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleOpenAddMemberDialog}
                startIcon={<PersonIcon />}
                sx={glassStyles.button}
              >
                Add First Member
              </Button>
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
                  .filter(user => !selectedDepartment?.members?.some(member => String(member.id) === String(user.id)))
                  .map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.username || (user.first_name + ' ' + user.last_name)}
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