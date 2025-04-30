import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import { useRoles } from '../hooks/useRoles';
import { usePermissions } from '../hooks/usePermissions';
import { Role, RoleFormData, Permission } from '../types';

const RolesTab: React.FC = () => {
  const {
    roles,
    loading: rolesLoading,
    error: rolesError,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    assignPermissionsToRole
  } = useRoles();

  const {
    permissions,
    loading: permissionsLoading,
    fetchPermissions
  } = usePermissions();

  // Local state
  const [open, setOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Fetch roles and permissions on component mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Dialog handlers
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      name: '',
      description: ''
    });
    setEditingId(null);
  };

  const handleEdit = (role: Role) => {
    setFormData({
      name: role.name,
      description: role.description
    });
    setEditingId(role.id);
    setOpen(true);
  };

  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (roleToDelete) {
      await deleteRole(roleToDelete.id);
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateRole(editingId, formData);
    } else {
      await createRole(formData);
    }
    handleClose();
  };

  // Permissions dialog handlers
  const handleOpenPermissionsDialog = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissionIds(role.permissions.map(p => p.id));
    setPermissionsDialogOpen(true);
  };

  const handleClosePermissionsDialog = () => {
    setPermissionsDialogOpen(false);
    setSelectedRole(null);
    setSelectedPermissionIds([]);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissionIds(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleAssignPermissions = async () => {
    if (selectedRole) {
      await assignPermissionsToRole(selectedRole.id, selectedPermissionIds);
      handleClosePermissionsDialog();
    }
  };

  const isLoading = rolesLoading || permissionsLoading;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Roles Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Role
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : rolesError ? (
        <Typography color="error">{rolesError}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No roles found
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {role.permissions.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No permissions assigned
                          </Typography>
                        ) : (
                          role.permissions.map((permission) => (
                            <Chip
                              key={permission.id}
                              label={permission.name}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenPermissionsDialog(role)}
                        aria-label="manage permissions"
                      >
                        <SecurityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(role)}
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(role)}
                        aria-label="delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Role' : 'Create Role'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="description"
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role "{roleToDelete?.name}"?
            This action cannot be undone and will remove all associated permissions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Assignment Dialog */}
      <Dialog 
        open={permissionsDialogOpen} 
        onClose={handleClosePermissionsDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Manage Permissions for Role: {selectedRole?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Select the permissions to assign to this role:
          </Typography>
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {permissions.map((permission: Permission) => (
              <React.Fragment key={permission.id}>
                <ListItem>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedPermissionIds.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">{permission.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {permission.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {permission.resource}: {permission.action}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermissionsDialog}>Cancel</Button>
          <Button onClick={handleAssignPermissions} variant="contained" color="primary">
            Save Permissions
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesTab; 