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
  Chip,
  TextField,
  InputAdornment,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Tooltip,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import BlockIcon from '@mui/icons-material/Block';
import axios from '../../utils/axios';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';
import { AdminService } from '../../services/admin';
import { UserService, User as ServiceUser } from '../../services/user';

const DRAWER_WIDTH = 240;

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string; // This is just the ID
  department_name: string;
  status: 'active' | 'inactive';
  last_login: string;
  position: string;
}

interface UserFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  position: string;
  password?: string;
}

interface Department {
  id: string;
  name: string;
}

interface EditMode {
  isEdit: boolean;
  userId: string | null;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive';
  position: string;
  department?: {
    id: string;
    name: string;
  };
  last_login: string;
}

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'user',
    department: '',
    position: '',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>({ isEdit: false, userId: null });
  const glassStyles = getGlassmorphismStyles(theme);

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    // Implement user selection logic
  };

  const handleEditUser = async (userId: string) => {
    try {
      // Use UserService instead of direct axios call
      const user = await UserService.getUserById(userId);
      if (user) {
        setFormData({
          username: user.username,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: user.role,
          department: user.department?.id || '',
          position: user.position || ''
        });
        setEditMode({ isEdit: true, userId });
        setOpenDialog(true);
      }
    } catch (error) {
      console.error('Error fetching user for edit:', error);
      setError('Failed to load user data for editing');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // Use UserService instead of direct axios call
        await UserService.deleteUser(userId);
        alert('User deleted successfully!');
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Failed to delete user');
      }
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      // Use UserService instead of direct axios call
      const response = await UserService.resetPassword(userId, '');
      alert(`Password has been reset. New password: ${response.newPassword}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      // Use UserService instead of direct axios call
      await UserService.toggleUserStatus(userId);
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Failed to update user status');
    }
  };

  const generatePassword = () => {
    const length = 16;
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = "";
    
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData({ ...formData, password });
    setCopied(false);
  };

  const handleCopyPassword = () => {
    if (formData.password) {
      navigator.clipboard.writeText(formData.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddUser = async () => {
    try {
      if (editMode.isEdit && editMode.userId) {
        // Update existing user
        const userData: Partial<ServiceUser> = {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          position: formData.position,
          role: formData.role as 'admin' | 'manager' | 'user'
        };
        
        // Only include department if one is selected
        if (formData.department) {
          // When handling the department field, pass it as a string
          // The API will handle converting it to an object
          userData.department = formData.department ? { id: formData.department, name: '' } : null;
        }
        
        // Use UserService instead of direct axios call
        await UserService.updateUser(editMode.userId, userData);
        alert('User updated successfully!');
        handleCloseDialog();
        await fetchUsers();
      } else {
        // Create new user
        // Format the data for the API and include all required properties
        const createUserData = {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role as 'admin' | 'manager' | 'user',
          position: formData.position,
          department: formData.department ? { id: formData.department, name: '' } : null,
          status: 'active' as const // Specify status as a literal type
        };
        
        // Use UserService instead of direct axios call
        const response = await UserService.createUser({
          ...createUserData,
          // Add the password separately since it's not in the User type
          password: formData.password
        } as any);
        
        if (response) {
          alert(`User created successfully! ${
            formData.password 
              ? 'Password set as specified.' 
              : `Default password: ${response.default_password}`
          }`);
          handleCloseDialog();
          await fetchUsers();
        }
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      setError(error.message || `Failed to ${editMode.isEdit ? 'update' : 'create'} user`);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[UserManagement] Fetching users with search:', searchQuery);
      
      // Use AdminService instead of direct axios call
      const userData = await AdminService.getUsers(searchQuery);
      
      // Format the users to match the interface
      const formattedUsers = userData.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department: user.department?.id || '',
        department_name: user.department?.name || 'None',
        status: user.status,
        last_login: user.last_login,
        position: user.position
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const fetchDepartments = async () => {
    try {
      // Use AdminService instead of direct axios call
      const departmentData = await AdminService.getDepartments();
      
      setDepartments(departmentData.map((dept: any) => ({
        id: dept.id,
        name: dept.name
      })));
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode({ isEdit: false, userId: null });
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role: 'user',
      department: '',
      position: '',
      password: '',
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

  const mainContent = (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#fff' }}>
        User Management
      </Typography>
      <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
        Manage system users, roles, and permissions
      </Typography>

      <Box sx={{ mb: 4 }}>
        {selectedUser && (
          <Typography 
            variant="subtitle1" 
            component="div"
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              mt: 1 
            }}
          >
            Selected User: {users.find(u => u.id === selectedUser)?.username}
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
                placeholder="Search users..."
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
              <Tooltip title="Create a new user account">
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
                  Add New User
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper component={Card} sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        position: 'relative',
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}>Name</TableCell>
                <TableCell sx={{ color: '#fff' }}>Email</TableCell>
                <TableCell sx={{ color: '#fff' }}>Role</TableCell>
                <TableCell sx={{ color: '#fff' }}>Department</TableCell>
                <TableCell sx={{ color: '#fff' }}>Status</TableCell>
                <TableCell sx={{ color: '#fff' }}>Last Login</TableCell>
                <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={7} 
                    align="center"
                    sx={{ color: '#fff', py: 4 }}
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow 
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: selectedUser === user.id ? 
                        'rgba(255, 255, 255, 0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  >
                    <TableCell sx={{ color: '#fff' }}>{user.username}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{user.email}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{user.role}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{user.department_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={user.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>{user.last_login}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit user details">
                          <IconButton
                            onClick={() => handleEditUser(user.id)}
                            sx={{ color: '#fff' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset user password">
                          <IconButton
                            onClick={() => handleResetPassword(user.id)}
                            sx={{ color: '#fff' }}
                          >
                            <LockResetIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={`${user.status === 'active' ? 'Deactivate' : 'Activate'} user`}>
                          <IconButton
                            onClick={() => handleToggleStatus(user.id)}
                            sx={{ color: '#fff' }}
                          >
                            <BlockIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton
                            onClick={() => handleDeleteUser(user.id)}
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
        PaperProps={{
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
        }}
      >
        <DialogTitle>
          {editMode.isEdit ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              fullWidth
              required
              disabled={editMode.isEdit}
              InputLabelProps={{
                style: glassStyles.inputLabel
              }}
              sx={{
                '& .MuiOutlinedInput-root': glassStyles.input,
              }}
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
              InputLabelProps={{
                style: glassStyles.inputLabel
              }}
              sx={{
                '& .MuiOutlinedInput-root': glassStyles.input,
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                fullWidth
                InputLabelProps={{
                  style: glassStyles.inputLabel
                }}
                sx={{
                  '& .MuiOutlinedInput-root': glassStyles.input,
                }}
              />
              <TextField
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                fullWidth
                InputLabelProps={{
                  style: glassStyles.inputLabel
                }}
                sx={{
                  '& .MuiOutlinedInput-root': glassStyles.input,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel sx={glassStyles.inputLabel}>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Role"
                  sx={{
                    '& .MuiOutlinedInput-root': glassStyles.input,
                    ...glassStyles.input
                  }}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel sx={glassStyles.inputLabel}>Department</InputLabel>
                <Select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  label="Department"
                  sx={{
                    '& .MuiOutlinedInput-root': glassStyles.input,
                    ...glassStyles.input
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              fullWidth
              InputLabelProps={{
                style: glassStyles.inputLabel
              }}
              sx={{
                '& .MuiOutlinedInput-root': glassStyles.input,
              }}
            />
            {!editMode.isEdit && (
              <TextField
                label="Temporary Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                fullWidth
                InputLabelProps={{
                  style: glassStyles.inputLabel
                }}
                sx={{
                  '& .MuiOutlinedInput-root': glassStyles.input,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={generatePassword}
                        edge="end"
                        title="Generate secure password"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        <AutorenewIcon />
                      </IconButton>
                      {formData.password && (
                        <IconButton
                          onClick={handleCopyPassword}
                          edge="end"
                          title="Copy password"
                          color={copied ? "success" : "default"}
                          sx={{ color: copied ? '#4caf50' : 'rgba(255, 255, 255, 0.7)' }}
                        >
                          {copied ? <DoneIcon /> : <ContentCopyIcon />}
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        title={showPassword ? "Hide password" : "Show password"}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText={
                  formData.password 
                    ? "Make sure to copy this password before saving" 
                    : "Leave empty to use system-generated password"
                }
                FormHelperTextProps={{
                  sx: { color: 'rgba(255, 255, 255, 0.7)' }
                }}
              />
            )}
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
            onClick={handleAddUser}
            variant="contained"
            sx={glassStyles.button}
          >
            {editMode.isEdit ? 'Update User' : 'Add User'}
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

export default UserManagement;