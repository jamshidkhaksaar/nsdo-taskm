import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  SelectChangeEvent
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Role, RoleFormData, Permission } from './types';
import { usePermissions } from './hooks/usePermissions';
import axios from '../../../utils/axios';

const RoleManagement: React.FC = () => {
  // States
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissionIds: [],
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get permissions from the usePermissions hook
  const { permissions, fetchPermissions } = usePermissions();

  // Moved fetchRoles function definition before useEffect and wrap in useCallback
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/rbac/roles');
      setRoles(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError('Failed to load roles: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setRoles, setError]); // Added dependencies

  // Fetch data on component mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  // Create or update role
  const saveRole = async () => {
    try {
      setLoading(true);
      if (!formData.name.trim()) {
        setError('Role name is required');
        return false;
      }

      const roleData = {
        ...formData,
        permissionIds: selectedPermissions
      };

      if (editingRole) {
        // Update existing role
        const response = await axios.put(`/admin/rbac/roles/${editingRole.id}`, roleData);
        setRoles(roles.map(r => r.id === editingRole.id ? response.data : r));
      } else {
        // Create new role
        const response = await axios.post('/admin/rbac/roles', roleData);
        setRoles([...roles, response.data]);
      }
      return true;
    } catch (err: any) {
      console.error('Error saving role:', err);
      setError('Failed to save role: ' + (err.response?.data?.message || err.message));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete role
  const deleteRole = async (roleId: string) => {
    try {
      setLoading(true);
      await axios.delete(`/admin/rbac/roles/${roleId}`);
      setRoles(roles.filter(r => r.id !== roleId));
      return true;
    } catch (err: any) {
      console.error('Error deleting role:', err);
      setError('Failed to delete role: ' + (err.response?.data?.message || err.message));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Dialog handlers
  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description,
      });
      setSelectedPermissions(role.permissions.map(p => p.id));
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
      });
      setSelectedPermissions([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePermissionChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setSelectedPermissions(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSubmit = async () => {
    const success = await saveRole();
    if (success) {
      handleCloseDialog();
    }
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (roleToDelete) {
      await deleteRole(roleToDelete.id);
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h2" sx={{ color: '#fff' }}>
          Roles Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'rgba(33, 150, 243, 0.8)',
            '&:hover': {
              background: 'rgba(33, 150, 243, 1)',
            }
          }}
        >
          Add Role
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Permissions</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{role.name}</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{role.description}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {role.permissions.slice(0, 3).map((permission) => (
                        <Chip
                          key={permission.id}
                          label={permission.name}
                          size="small"
                          sx={{
                            background: 'rgba(33, 150, 243, 0.2)',
                            color: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '4px',
                          }}
                        />
                      ))}
                      {role.permissions.length > 3 && (
                        <Chip
                          label={`+${role.permissions.length - 3} more`}
                          size="small"
                          sx={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            borderRadius: '4px',
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(role)}
                        sx={{ color: '#2196f3' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(role)}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Role Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            background: 'rgba(25, 32, 45, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: '500px'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          {editingRole ? 'Edit Role' : 'Add New Role'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 2, mt: 1 }}
            InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
            InputProps={{ sx: { color: '#fff' } }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
            InputProps={{ sx: { color: '#fff' } }}
          />
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Permissions</InputLabel>
            <Select
              multiple
              value={selectedPermissions}
              onChange={handlePermissionChange}
              input={<OutlinedInput label="Permissions" sx={{ color: '#fff' }} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const permission = permissions.find(p => p.id === value);
                    return (
                      <Chip
                        key={value}
                        label={permission?.name || value}
                        size="small"
                        sx={{
                          background: 'rgba(33, 150, 243, 0.2)',
                          color: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '4px',
                        }}
                      />
                    );
                  })}
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  sx: {
                    background: 'rgba(25, 32, 45, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    maxHeight: '300px',
                  }
                }
              }}
            >
              {permissions.map((permission: Permission) => (
                <MenuItem key={permission.id} value={permission.id}>
                  <Checkbox checked={selectedPermissions.indexOf(permission.id) > -1} />
                  <ListItemText 
                    primary={permission.name} 
                    secondary={permission.description}
                    primaryTypographyProps={{ sx: { color: '#fff' } }}
                    secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              background: 'rgba(33, 150, 243, 0.8)',
              '&:hover': {
                background: 'rgba(33, 150, 243, 1)',
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : (editingRole ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(25, 32, 45, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Are you sure you want to delete the role "{roleToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement; 