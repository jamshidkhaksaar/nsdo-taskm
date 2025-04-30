import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress
} from '@mui/material';
import { Theme, useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import { useUserRoles } from '../hooks/useUserRoles';
import { useRoles } from '../hooks/useRoles';
import { User } from '../types/index';

// MenuItem props for multi-select
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

// Style function for selected items in multi-select
function getStyles(name: string, selectedItems: readonly string[], theme: Theme) {
  return {
    fontWeight:
      selectedItems.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const UserRolesTab: React.FC = () => {
  const theme = useTheme();
  const { 
    users, 
    userRoles, 
    loading: userLoading, 
    error: userError,
    fetchUsers,
    fetchUserRoles,
    assignRolesToUser,
    removeRoleFromUser
  } = useUserRoles();

  const { 
    roles, 
    loading: rolesLoading, 
    fetchRoles 
  } = useRoles();

  // Local state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<Record<string, boolean>>({});

  // Fetch users and roles on component mount
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  // Load user roles when a user is selected
  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    
    // If we haven't already loaded this user's roles, load them
    if (!userRoles[user.id]) {
      setLoadingUsers(prev => ({ ...prev, [user.id]: true }));
      await fetchUserRoles(user.id);
      setLoadingUsers(prev => ({ ...prev, [user.id]: false }));
    }
  };

  // Open dialog to manage roles for a user
  const handleOpenRolesDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleIds(userRoles[user.id] || []);
    setDialogOpen(true);
  };

  const handleCloseRolesDialog = () => {
    setDialogOpen(false);
    setSelectedRoleIds([]);
  };

  const handleRoleSelectionChange = (event: SelectChangeEvent<typeof selectedRoleIds>) => {
    const {
      target: { value },
    } = event;
    setSelectedRoleIds(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleSaveRoles = async () => {
    if (selectedUser) {
      await assignRolesToUser(selectedUser.id, selectedRoleIds);
      setDialogOpen(false);
    }
  };

  const isLoading = userLoading || rolesLoading;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        User Role Management
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : userError ? (
        <Typography color="error">{userError}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow 
                    key={user.id} 
                    hover 
                    onClick={() => handleUserSelect(user)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {loadingUsers[user.id] ? (
                        <CircularProgress size={20} />
                      ) : userRoles[user.id] ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {userRoles[user.id].length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No roles assigned
                            </Typography>
                          ) : (
                            userRoles[user.id].map((roleId) => {
                              const role = roles.find((r) => r.id === roleId);
                              return (
                                <Chip
                                  key={roleId}
                                  label={role?.name || roleId}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  onDelete={() => removeRoleFromUser(user.id, roleId)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              );
                            })
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Click to load roles
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRolesDialog(user);
                        }}
                        startIcon={<PersonIcon />}
                      >
                        Manage Roles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Role Assignment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseRolesDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Manage Roles for {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          <FormControl sx={{ mt: 2, width: '100%' }}>
            <InputLabel id="role-multiple-chip-label">Roles</InputLabel>
            <Select
              labelId="role-multiple-chip-label"
              id="role-multiple-chip"
              multiple
              value={selectedRoleIds}
              onChange={handleRoleSelectionChange}
              input={<OutlinedInput id="select-multiple-chip" label="Roles" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const role = roles.find((r) => r.id === value);
                    return (
                      <Chip key={value} label={role?.name || value} />
                    );
                  })}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {roles.map((role) => (
                <MenuItem
                  key={role.id}
                  value={role.id}
                  style={getStyles(role.name, selectedRoleIds, theme)}
                >
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRolesDialog}>Cancel</Button>
          <Button onClick={handleSaveRoles} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserRolesTab; 