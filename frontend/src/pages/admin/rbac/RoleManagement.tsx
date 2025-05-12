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
  SelectChangeEvent,
  List,
  ListItem,
  ListSubheader,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Lock as LockIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Role, RoleFormData, Permission } from './types';
import { usePermissions } from './hooks/usePermissions';
import axios from '../../../utils/axios';

const RoleManagement: React.FC = () => {
  // States
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<Omit<RoleFormData, 'permissionIds'>>({ name: '', description: '' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});

  // Get permissions from the usePermissions hook
  const { permissions: systemPermissions, fetchPermissions: fetchSystemPermissions, loading: permissionsLoading } = usePermissions();

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
  }, [setLoading, setRoles, setError]);

  useEffect(() => {
    fetchRoles();
    fetchSystemPermissions();
  }, [fetchRoles, fetchSystemPermissions]);

  const saveRole = async () => {
    try {
      setLoading(true);
      if (!formData.name.trim()) {
        setError('Role name is required');
        return false;
      }

      const roleData: RoleFormData = {
        ...formData,
        permissionIds: selectedPermissionIds,
      };

      if (editingRole) {
        const response = await axios.put(`/admin/rbac/roles/${editingRole.id}`, roleData);
        setRoles(roles.map(r => r.id === editingRole.id ? response.data : r));
      } else {
        const response = await axios.post('/admin/rbac/roles', roleData);
        setRoles([...roles, response.data]);
      }
      fetchRoles();
      return true;
    } catch (err: any) {
      console.error('Error saving role:', err);
      const errorMsg = 'Failed to save role: ' + (err.response?.data?.message || err.message);
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

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

  const handleOpenDialog = (role?: Role) => {
    setPermissionSearchTerm('');
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, description: role.description || '' });
      setSelectedPermissionIds(role.permissions.map(p => p.id));
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '' });
      setSelectedPermissionIds([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissionIds(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmitDialog = async () => {
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

  const filteredAndGroupedPermissions = useCallback(() => {
    const lowerSearchTerm = permissionSearchTerm.toLowerCase();
    const filtered = (systemPermissions || []).filter(permission =>
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
  }, [systemPermissions, permissionSearchTerm]);

  const currentDialogPermissions = filteredAndGroupedPermissions();

  const handleAccordionChange = (group: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordions(prev => ({ ...prev, [group]: isExpanded }));
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
                    {role.isSystemRole ? (
                      <Tooltip title="System roles cannot be modified">
                        <span>
                          <IconButton disabled size="small" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                            <LockIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : (
                      <>
                        <Tooltip title="Edit Role">
                          <IconButton onClick={() => handleOpenDialog(role)} size="small" sx={{ color: '#2196f3' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Role">
                          <IconButton onClick={() => handleDeleteClick(role)} size="small" sx={{ color: '#f44336' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { minHeight: '80vh' } }}
      >
        <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Role Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            fullWidth
            required
            autoFocus
            margin="normal"
            disabled={editingRole?.isSystemRole && editingRole.name === 'Super Admin'}
          />
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={2}
            margin="normal"
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
          <Paper variant="outlined" sx={{ maxHeight: 'calc(80vh - 320px)', minHeight: 200, overflow: 'auto' }}>
            {permissionsLoading && !Object.keys(currentDialogPermissions).length ? (
              <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={24} /> Loading permissions...</Box>
            ) : Object.keys(currentDialogPermissions).length === 0 ? (
              <Typography sx={{ p: 2, textAlign: 'center' }}>
                {permissionSearchTerm 
                  ? 'No permissions match your search.' 
                  : (systemPermissions.length === 0 ? 'No permissions defined in the system.' : 'No permissions found.')}
              </Typography>
            ) : (
              <Box sx={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 1 }}>
                {Object.entries(currentDialogPermissions).map(([groupName, groupPermissions]) => (
                  <Accordion 
                    key={groupName} 
                    expanded={expandedAccordions[groupName] || false}
                    onChange={handleAccordionChange(groupName)}
                    sx={{ 
                      backgroundImage: 'none',
                      boxShadow: 'none', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      '&:last-of-type': {
                        borderBottom: 0,
                      },
                      '&:before': { 
                        display: 'none'
                      }, 
                      backgroundColor: 'transparent'
                    }}
                    disableGutters
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
                      aria-controls={`panel-${groupName}-content`}
                      id={`panel-${groupName}-header`}
                      sx={{ 
                        minHeight: '48px',
                        paddingX: 2,
                        '&.Mui-expanded': {
                          minHeight: '48px',
                        },
                        '& .MuiAccordionSummary-content': {
                          margin: '12px 0',
                          '&.Mui-expanded': {
                            margin: '12px 0',
                          }
                        }
                      }}
                    >
                      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                        {groupName}
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          ({groupPermissions.length} permissions)
                        </Typography>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                      <List dense disablePadding component="div">
                        {groupPermissions.map((permission) => (
                          <ListItem key={permission.id} dense sx={{ pl: 2 }} button onClick={() => handlePermissionToggle(permission.id)}>
                            <Checkbox
                              edge="start"
                              checked={selectedPermissionIds.includes(permission.id)}
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
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSubmitDialog} variant="contained" color="primary" disabled={loading || (!editingRole && !formData.name.trim())}>
            {editingRole ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogActions>
      </Dialog>

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