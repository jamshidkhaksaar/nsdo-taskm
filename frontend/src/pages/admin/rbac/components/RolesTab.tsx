import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  ListSubheader
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
  } = useRoles();

  const {
    permissions,
    loading: permissionsLoading,
    fetchPermissions: fetchSystemPermissions,
  } = usePermissions();

  // Local state for the main Create/Edit Role Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState<RoleFormData>({ name: '', description: '', permissionIds: [] });
  
  // State for permission selection within the dialog
  const [selectedPermissionIdsInDialog, setSelectedPermissionIdsInDialog] = useState<string[]>([]);
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');

  // State for delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
    fetchSystemPermissions();
  }, [fetchRoles, fetchSystemPermissions]);

  const handleRoleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoleFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenCreateDialog = () => {
    setEditingRole(null);
    setRoleFormData({ name: '', description: '', permissionIds: [] });
    setSelectedPermissionIdsInDialog([]);
    setPermissionSearchTerm('');
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (role: Role) => {
    setEditingRole(role);
    setRoleFormData({ name: role.name, description: role.description, permissionIds: role.permissions.map(p => p.id) });
    setSelectedPermissionIdsInDialog(role.permissions.map(p => p.id));
    setPermissionSearchTerm('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
  };

  const handlePermissionToggleInDialog = (permissionId: string) => {
    setSelectedPermissionIdsInDialog(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSaveRole = async () => {
    if (editingRole && !roleFormData.name.trim()) {
      console.error("Role name is required");
      return;
    }
    
    const payload: RoleFormData = {
      name: roleFormData.name,
      description: roleFormData.description,
      permissionIds: selectedPermissionIdsInDialog,
    };

    let success = false;
    if (editingRole) {
      success = await updateRole(editingRole.id, payload);
    } else {
      success = await createRole(payload);
    }

    if (success) {
      handleCloseDialog();
      fetchRoles();
    }
  };

  const handleOpenDeleteDialog = (role: Role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (roleToDelete) {
      const success = await deleteRole(roleToDelete.id);
      if (success) {
        setDeleteConfirmOpen(false);
        setRoleToDelete(null);
        fetchRoles();
      }
    }
  };

  const filteredAndGroupedPermissions = useCallback(() => {
    const lowerSearchTerm = permissionSearchTerm.toLowerCase();
    const filtered = permissions.filter(permission =>
      permission.name.toLowerCase().includes(lowerSearchTerm) ||
      (permission.description && permission.description.toLowerCase().includes(lowerSearchTerm)) ||
      (permission.resource && permission.resource.toLowerCase().includes(lowerSearchTerm)) ||
      (permission.action && permission.action.toLowerCase().includes(lowerSearchTerm)) ||
      (permission.group && permission.group.toLowerCase().includes(lowerSearchTerm))
    );

    return filtered.reduce((acc, permission) => {
      const group = permission.group || 'Uncategorized';
      if (!acc[group]) acc[group] = [];
      acc[group].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions, permissionSearchTerm]);

  const currentDialogPermissions = filteredAndGroupedPermissions();

  const combinedLoading = rolesLoading || permissionsLoading;

  return (
    <Box>
      <Typography variant="h1" color="error" sx={{my: 4, textAlign: 'center'}}>!! TESTING ROLES TAB COMPONENT !!</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Roles Management</Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
          Add Role
        </Button>
      </Box>

      {combinedLoading && !dialogOpen ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
      ) : rolesError ? (
        <Typography color="error" sx={{ p:2 }}>{`Error loading roles: ${rolesError}`}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Permissions Summary</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center">No roles found.</TableCell></TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id} hover>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.description || "-"}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                        {role.permissions.slice(0, 3).map(p => <Chip key={p.id} label={p.name} size="small" variant="outlined" />)}
                        {role.permissions.length > 3 && <Chip label={`+${role.permissions.length - 3} more`} size="small" />}
                        {role.permissions.length === 0 && <Typography variant="caption" color="text.secondary">None</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenEditDialog(role)} aria-label="Edit role and permissions">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(role)} aria-label="Delete role" disabled={role.isSystemRole}>
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

      {/* Create/Edit Role Dialog with Integrated Permission Management */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: '80vh'} }}>
        <DialogTitle>
          !! DIALOG TITLE TEST !! {editingRole ? 'Edit Role' : 'Create New Role'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Role Name"
            name="name"
            value={roleFormData.name}
            onChange={handleRoleFormInputChange}
            fullWidth required autoFocus margin="normal"
            disabled={editingRole?.isSystemRole && editingRole.name === 'Super Admin'}
          />
          <TextField
            label="Description"
            name="description"
            value={roleFormData.description}
            onChange={handleRoleFormInputChange}
            fullWidth multiline rows={2} margin="normal"
          />
          
          <Divider sx={{ my: 2 }}>Permissions</Divider>
          
          <TextField
            placeholder="Search permissions (by name, description, group, resource, action)..."
            value={permissionSearchTerm}
            onChange={(e) => setPermissionSearchTerm(e.target.value)}
            fullWidth 
            margin="normal" 
            variant="outlined" 
            size="small"
            sx={{ mb: 1 }}
          />
          <Paper variant="outlined" sx={{ maxHeight: 'calc(80vh - 300px)', minHeight: 200, overflow: 'auto' }}>
            {permissionsLoading && !Object.keys(currentDialogPermissions).length ? (
              <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={24} /> Loading permissions...</Box>
            ) : Object.keys(currentDialogPermissions).length === 0 ? (
              <Typography sx={{ p: 2, textAlign: 'center' }}>
                {permissionSearchTerm ? 'No permissions match your search.' : (permissions.length === 0 ? 'No permissions defined in the system.' : 'No permissions found.')}
              </Typography>
            ) : (
              <List dense disablePadding>
                {Object.entries(currentDialogPermissions).map(([groupName, groupPermissions]) => (
                  <React.Fragment key={groupName}>
                    <ListSubheader sx={{ bgcolor: 'action.hover', fontWeight: 'bold', py: 0.5, lineHeight: 'normal', top: 0, zIndex: 1 }}>
                      {groupName}
                    </ListSubheader>
                    {groupPermissions.map((permission) => (
                      <ListItem key={permission.id} dense sx={{ pl: 2 }} button onClick={() => handlePermissionToggleInDialog(permission.id)}>
                        <Checkbox
                          edge="start"
                          checked={selectedPermissionIdsInDialog.includes(permission.id)}
                          tabIndex={-1}
                          disableRipple
                          size="small"
                        />
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2">{permission.name}</Typography>
                          {permission.description && <Typography variant="caption" color="text.secondary">{permission.description}</Typography>}
                        </Box>
                      </ListItem>
                    ))}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px:3, py:2 }}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSaveRole} variant="contained" color="primary" disabled={permissionsLoading || (!editingRole && !roleFormData.name.trim())}>
            {editingRole ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs">
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role "<b>{roleToDelete?.name}</b>"?
            {roleToDelete?.isSystemRole && <Typography color="error" variant="caption" component="div">This is a system role. Deleting it may have unintended consequences.</Typography>}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesTab; 