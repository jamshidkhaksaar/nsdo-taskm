import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import { usePermissions } from '../hooks/usePermissions';
import { Permission, PermissionFormData } from '../types';

const PermissionsTab: React.FC = () => {
  const {
    permissions,
    loading,
    error,
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission
  } = usePermissions();

  // Local state
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<PermissionFormData>({
    name: '',
    description: '',
    resource: '',
    action: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);

  // Fetch permissions on component mount
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

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
      description: '',
      resource: '',
      action: ''
    });
    setEditingId(null);
  };

  const handleEdit = (permission: Permission) => {
    setFormData({
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action
    });
    setEditingId(permission.id);
    setOpen(true);
  };

  const handleDelete = (permission: Permission) => {
    setPermissionToDelete(permission);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (permissionToDelete) {
      await deletePermission(permissionToDelete.id);
      setDeleteConfirmOpen(false);
      setPermissionToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updatePermission(editingId, formData);
    } else {
      await createPermission(formData);
    }
    handleClose();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Permissions Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Permission
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Action</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No permissions found
                  </TableCell>
                </TableRow>
              ) : (
                permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>{permission.name}</TableCell>
                    <TableCell>{permission.description}</TableCell>
                    <TableCell>{permission.resource}</TableCell>
                    <TableCell>{permission.action}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(permission)}
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(permission)}
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
          {editingId ? 'Edit Permission' : 'Create Permission'}
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
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="resource"
              label="Resource"
              name="resource"
              value={formData.resource}
              onChange={handleInputChange}
              helperText="e.g., tasks, users, etc."
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="action"
              label="Action"
              name="action"
              value={formData.action}
              onChange={handleInputChange}
              helperText="e.g., create, read, update, delete"
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
            Are you sure you want to delete the permission "{permissionToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermissionsTab; 