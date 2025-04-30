import React, { useState, useEffect } from 'react';
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
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Permission, PermissionFormData } from './types';
import { usePermissions } from './hooks/usePermissions';

const PermissionManagement: React.FC = () => {
  const {
    permissions,
    loading,
    error,
    fetchPermissions,
    savePermission,
    deletePermission,
    setError
  } = usePermissions();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState<PermissionFormData>({
    name: '',
    description: '',
    resource: '',
    action: ''
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleOpenDialog = (permission?: Permission) => {
    if (permission) {
      setEditingPermission(permission);
      setFormData({
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action
      });
    } else {
      setEditingPermission(null);
      setFormData({
        name: '',
        description: '',
        resource: '',
        action: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPermission(null);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    const success = await savePermission(formData, editingPermission);
    if (success) {
      handleCloseDialog();
    }
  };

  const handleDeleteClick = (permission: Permission) => {
    setPermissionToDelete(permission);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (permissionToDelete) {
      await deletePermission(permissionToDelete.id);
      setDeleteConfirmOpen(false);
      setPermissionToDelete(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h2" sx={{ color: '#fff' }}>
          Permissions Management
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
          Add Permission
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
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Resource</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Action</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : permissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  No permissions found
                </TableCell>
              </TableRow>
            ) : (
              permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{permission.name}</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{permission.description}</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{permission.resource}</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{permission.action}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(permission)}
                        sx={{ color: '#2196f3' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(permission)}
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

      {/* Add/Edit Permission Dialog */}
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
          {editingPermission ? 'Edit Permission' : 'Add New Permission'}
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
            name="resource"
            label="Resource"
            type="text"
            fullWidth
            value={formData.resource}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
            InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
            InputProps={{ sx: { color: '#fff' } }}
          />
          <TextField
            margin="dense"
            name="action"
            label="Action"
            type="text"
            fullWidth
            value={formData.action}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
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
            sx={{ mb: 1 }}
            InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
            InputProps={{ sx: { color: '#fff' } }}
          />
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
            {loading ? <CircularProgress size={24} /> : (editingPermission ? 'Update' : 'Create')}
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
            Are you sure you want to delete the permission "{permissionToDelete?.name}"?
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

export default PermissionManagement; 