import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
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
  useMediaQuery,
  Divider,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Badge,
  Fade,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import axios from '../../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';

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
}

interface EditMode {
  isEdit: boolean;
  departmentId: string | null;
}

interface UserResponse {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
}

const DRAWER_WIDTH = 240;

const DepartmentManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [notifications, setNotifications] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<AdminDepartment | null>(null);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
    head: '',
  });
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>({
    isEdit: false,
    departmentId: null
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tabValue, setTabValue] = useState(0);
  const glassStyles = getGlassmorphismStyles(theme);
  
  // State for managing adding members
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');

  // Define dialogPaperProps with glassmorphism styles
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

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/departments');
      const departments = response.data;
      console.log('Received departments:', departments);
      
      setDepartments(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      const users = response.data;
      
      // Map the user data to the format expected by the dropdown
      const formattedUsers = users.map((user: any) => ({
        id: user.id,
        name: `${user.first_name || user.username} ${user.last_name || ''}`.trim()
      }));
      
      setAvailableUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching available users:', error);
      setError('Failed to fetch available users');
    }
  };

  useEffect(() => {
    if (openDialog) {
      fetchAvailableUsers();
    }
  }, [openDialog]);

  const handleAddDepartment = async () => {
    try {
      if (editMode.isEdit && editMode.departmentId) {
        // Update existing department
        const departmentData = {
          name: formData.name,
          description: formData.description,
          head: formData.head // Using just the user ID string
        };
        
        await axios.put(`/api/departments/${editMode.departmentId}/`, departmentData);
        alert('Department updated successfully!');
      } else {
        // Create new department
        await axios.post('/api/departments/', formData);
        alert('Department created successfully!');
      }
      
      handleCloseDialog();
      await fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      setError(`Failed to ${editMode.isEdit ? 'update' : 'create'} department`);
    }
  };

  const handleEditDepartment = (deptId: string) => {
    const department = departments.find(d => d.id === deptId);
    if (department) {
      setFormData({
        name: department.name,
        description: department.description,
        head: department.head?.id || ''
      });
      setEditMode({ isEdit: true, departmentId: deptId });
      setOpenDialog(true);
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await axios.delete(`/api/departments/${deptId}/`);
        alert('Department deleted successfully!');
        await fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
        setError('Failed to delete department');
      }
    }
  };

  const handleViewMembers = (deptId: string) => {
    const department = departments.find(d => d.id === deptId);
    if (department) {
      setSelectedDepartment(department);
      setOpenMembersDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode({ isEdit: false, departmentId: null });
    setFormData({
      name: '',
      description: '',
      head: '',
    });
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    // Handle logout logic here
    navigate('/login');
  };

  const handleNotificationClick = () => {
    setNotifications(0);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleHelpClick = () => {
    console.log('Help clicked');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getRandomGradient = (id: string) => {
    // Generate a consistent gradient based on the department ID
    const hash = id.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const h1 = Math.abs(hash % 360);
    const h2 = (h1 + 40) % 360;
    
    return `linear-gradient(135deg, hsl(${h1}, 70%, 35%) 0%, hsl(${h2}, 80%, 25%) 100%)`;
  };

  // Function to open the add member dialog
  const handleOpenAddMemberDialog = () => {
    if (selectedDepartment) {
      setOpenAddMemberDialog(true);
      setSelectedMember('');
    }
  };

  // Function to add a member to a department
  const handleAddMemberToDepartment = async () => {
    if (!selectedDepartment || !selectedMember) return;
    
    try {
      console.log(`Adding user ${selectedMember} to department ${selectedDepartment.id}`);
      await axios.post(`/api/departments/${selectedDepartment.id}/members/${selectedMember}/`);
      alert('Member added successfully!');
      
      // Close the dialog
      setOpenAddMemberDialog(false);
      
      // Refresh department data
      await fetchDepartments();
      
      // Refresh the selected department to see the new member
      const updatedDept = await axios.get(`/api/departments/${selectedDepartment.id}/`);
      setSelectedDepartment(updatedDept.data);
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Failed to add member to department');
    }
  };

  // Function to remove a member from a department
  const handleRemoveMemberFromDepartment = async (userId: string) => {
    if (!selectedDepartment) return;
    
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/departments/${selectedDepartment.id}/members/${userId}/`);
      alert('Member removed successfully!');
      
      // Refresh department data
      await fetchDepartments();
      
      // Refresh the selected department
      const updatedDept = await axios.get(`/api/departments/${selectedDepartment.id}/`);
      setSelectedDepartment(updatedDept.data);
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
              onClick={() => setOpenDialog(true)}
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
            <Tab label="Active Projects" />
            <Tab label="Performance" />
          </Tabs>
        </Box>
      </Paper>

      {loading ? (
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
            onClick={() => setOpenDialog(true)}
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
                    
                    {dept.active_projects > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                          Active Projects
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            size="small" 
                            label={`${dept.active_projects} projects`} 
                            sx={{ 
                              bgcolor: 'rgba(255, 255, 255, 0.1)', 
                              color: '#fff',
                              borderRadius: '4px',
                            }} 
                          />
                        </Box>
                      </Box>
                    )}
                    
                    {dept.completion_rate > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            Completion Rate
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {dept.completion_rate}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={dept.completion_rate} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: dept.completion_rate > 75 
                                ? theme.palette.success.main 
                                : dept.completion_rate > 50 
                                  ? theme.palette.warning.main 
                                  : theme.palette.error.main
                            }
                          }} 
                        />
                      </Box>
                    )}
                  </CardContent>
                  
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  
                  <CardActions sx={{ p: 1.5, justifyContent: 'space-between' }}>
                    <Tooltip title="Edit department details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditDepartment(dept.id)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View department members">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewMembers(dept.id)}
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
            <TextField
              label="Department Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={glassStyles.inputLabel}>Department Head</InputLabel>
              <Select
                value={formData.head || ''}
                onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                label="Department Head"
                sx={{
                  '& .MuiOutlinedInput-root': glassStyles.input,
                  ...glassStyles.input
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="">None</MenuItem>
                {availableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </MenuItem>
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
            onClick={handleAddDepartment} 
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
                <Typography
                  variant="subtitle1"
                  sx={{ mt: 0.5, color: 'text.secondary' }}
                >
                  {selectedDepartment.name}
                </Typography>
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
          <List>
            {selectedDepartment && selectedDepartment.members?.map((member) => (
              <ListItem key={member?.id || 'unknown'}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleRemoveMemberFromDepartment(member.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar>
                    <PeopleIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={member.name} />
              </ListItem>
            ))}
            {(!selectedDepartment || 
              !selectedDepartment.members?.length) && (
              <ListItem>
                <ListItemText 
                  primary="No members found" 
                  secondary="This department doesn't have any members yet." 
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMembersDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog 
        open={openAddMemberDialog} 
        onClose={() => setOpenAddMemberDialog(false)}
        PaperProps={dialogPaperProps}
      >
        <DialogTitle>Add Department Member</DialogTitle>
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
                <MenuItem value="">None</MenuItem>
                {availableUsers
                  .filter(user => 
                    // Filter out users that are already members
                    !selectedDepartment?.members?.some(member => member.id === user.id)
                  )
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

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
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
          onNotificationClick={handleNotificationClick}
          onLogout={handleLogout}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onHelpClick={handleHelpClick}
        />
      }
      mainContent={mainContent}
      sidebarOpen={sidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default DepartmentManagement; 