import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group';
import AdminLayout from '../../layouts/AdminLayout';
import axios from '../../utils/axios';

interface Department {
  id: string;
  name: string;
  description: string;
  head: string;
  head_name: string;
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

const dialogPaperProps = {
  sx: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    minWidth: '500px',
    borderRadius: '12px',
    '& .MuiDialogTitle-root': {
      background: 'rgba(0, 0, 0, 0.05)',
      padding: '16px 24px',
    },
    '& .MuiDialogContent-root': {
      padding: '24px',
    },
    '& .MuiDialogActions-root': {
      padding: '16px 24px',
      background: 'rgba(0, 0, 0, 0.05)',
    },
  }
};

const DepartmentManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
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

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/departments/');
      console.log('Received departments:', response.data);
      const departmentsWithMembers = response.data.map((dept: Department) => {
        console.log(`Department ${dept.name} members:`, dept.members);
        console.log(`Department ${dept.name} members count:`, dept.members_count);
        return {
          ...dept,
          members: dept.members || []
        };
      });
      setDepartments(departmentsWithMembers);
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
      const response = await axios.get<UserResponse[]>('/api/users/');
      setAvailableUsers(response.data.map((user) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim() || user.username,
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
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
        await axios.put(`/api/departments/${editMode.departmentId}/`, formData);
        alert('Department updated successfully!');
      } else {
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
        head: department.head || '',
      });
      setEditMode({ isEdit: true, departmentId: deptId });
      setOpenDialog(true);
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    
    try {
      await axios.delete(`/api/departments/${deptId}/`);
      await fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      setError('Failed to delete department');
    }
  };

  const handleViewMembers = (deptId: string) => {
    const department = departments.find(d => d.id === deptId);
    if (department) {
      // You can either:
      // 1. Open a dialog to show members
      // 2. Navigate to a dedicated members page
      // For now, let's show a dialog
      setSelectedDepartment(deptId);
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

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#fff' }}>
          Department Management
        </Typography>
        {selectedDepartment && (
          <Typography 
            variant="subtitle1" 
            component="div"
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              mt: 1 
            }}
          >
            Selected Department: {departments.find(d => d.id === selectedDepartment)?.name}
          </Typography>
        )}
      </Box>

      <Card sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        mb: 3,
      }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  },
                }}
              />
            </Grid>
            <Grid item>
              <Tooltip title="Create a new department">
                <Button
                  variant="contained"
                  onClick={() => setOpenDialog(true)}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  Add New Department
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper 
        component={Card} 
        sx={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          position: 'relative',
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}>Name</TableCell>
                <TableCell sx={{ color: '#fff' }}>Description</TableCell>
                <TableCell sx={{ color: '#fff' }}>Head</TableCell>
                <TableCell sx={{ color: '#fff' }}>Members</TableCell>
                <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : departments.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={5} 
                    sx={{ 
                      color: '#fff', 
                      textAlign: 'center',
                      py: 4,
                    }}
                  >
                    No departments found
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell sx={{ color: '#fff' }}>{dept.name}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{dept.description}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {dept.head_name || 'No Head Assigned'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AvatarGroup 
                          max={3}
                          sx={{
                            '& .MuiAvatar-root': {
                              width: 24,
                              height: 24,
                              fontSize: '0.75rem',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }
                          }}
                        >
                          {(dept.members || [])
                            .filter(member => member && member.name)
                            .map((member) => (
                              <Avatar 
                                key={member.id || 'unknown'} 
                                src={member.avatar}
                              >
                                {member.name.charAt(0)}
                              </Avatar>
                            ))}
                        </AvatarGroup>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {dept.members_count || 0} members
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit department details">
                          <IconButton
                            onClick={() => handleEditDepartment(dept.id)}
                            sx={{ color: '#fff' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View department members">
                          <IconButton
                            onClick={() => handleViewMembers(dept.id)}
                            sx={{ color: '#fff' }}
                          >
                            <GroupIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete department">
                          <IconButton
                            onClick={() => handleDeleteDepartment(dept.id)}
                            sx={{ color: '#fff' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Department Head</InputLabel>
              <Select
                value={formData.head || ''}
                onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                label="Department Head"
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
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddDepartment} 
            variant="contained" 
            color="primary"
            disabled={!formData.name}
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
          <Box>
            <Typography variant="h6" component="div">
              Department Members
            </Typography>
            {selectedDepartment && (
              <Typography 
                variant="body2" 
                component="div" 
                sx={{ mt: 1, color: 'text.secondary' }}
              >
                {departments.find(d => d.id === selectedDepartment)?.name}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedDepartment && departments.find(d => d.id === selectedDepartment)?.members?.map((member) => (
              <ListItem key={member?.id || 'unknown'}>
                <ListItemAvatar>
                  <Avatar src={member?.avatar}>
                    {member?.name ? member.name.charAt(0) : '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={member?.name || 'Unknown Member'}
                />
              </ListItem>
            ))}
            {(!selectedDepartment || 
              !departments.find(d => d.id === selectedDepartment)?.members?.length) && (
              <ListItem>
                <ListItemText 
                  primary="No members in this department"
                  sx={{ textAlign: 'center', color: 'text.secondary' }}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMembersDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </AdminLayout>
  );
};

export default DepartmentManagement; 