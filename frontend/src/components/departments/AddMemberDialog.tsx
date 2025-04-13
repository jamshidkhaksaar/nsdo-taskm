import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  Avatar,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Typography,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { User } from '../../types/user';
import { UserService } from '../../services/user';
import { DepartmentService } from '../../services/department';

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  departmentId: string;
  currentMembers: User[];
  onMemberAdded: () => void;
}

const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  open,
  onClose,
  departmentId,
  currentMembers,
  onMemberAdded,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Fetch all users
  const { 
    data: allUsers = [], 
    isLoading: isLoadingUsers, 
    error: fetchUsersError 
  } = useQuery<User[], Error>(
    'allUsersForAddMember', 
    UserService.getUsers, 
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      enabled: open, // Only fetch when the dialog is open
    }
  );

  // Filter out current members and apply search query
  const availableUsers = useMemo(() => {
    const currentMemberIds = new Set(currentMembers.map(m => m.id));
    const filtered = allUsers.filter(user => !currentMemberIds.has(user.id));
    if (!searchQuery) {
      return filtered;
    }
    return filtered.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allUsers, currentMembers, searchQuery]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedUserIds([]);
      setSearchQuery('');
      setIsAdding(false);
      setAddError(null);
    }
  }, [open]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) return;
    setIsAdding(true);
    setAddError(null);
    try {
      // Call addMemberToDepartment for each selected user
      // Consider Promise.all for parallel execution, but handle errors carefully
      for (const userId of selectedUserIds) {
        await DepartmentService.addMemberToDepartment(departmentId, userId);
      }
      onMemberAdded(); // Notify parent component (triggers refetch)
      onClose(); // Close dialog on success
    } catch (error) {
      console.error('Error adding members:', error);
      setAddError(error instanceof Error ? error.message : 'Failed to add members. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Members to Department</DialogTitle>
      <DialogContent dividers>
        {fetchUsersError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error loading users: {fetchUsersError.message}
          </Alert>
        )}
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {isLoadingUsers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : availableUsers.length === 0 ? (
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 2 }}>
            {allUsers.length > 0 ? 'No matching users found.' : 'No users available to add.'}
          </Typography>
        ) : (
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {availableUsers.map((user) => (
              <ListItem
                key={user.id}
                button
                onClick={() => handleToggleUser(user.id)}
                secondaryAction={
                  <Checkbox
                    edge="end"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleToggleUser(user.id)}
                  />
                }
              >
                <ListItemAvatar>
                  <Avatar src={user.avatar} alt={user.username}>
                    {user.first_name ? user.first_name.charAt(0) : user.username.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        )}
        
        {addError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {addError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isAdding}>Cancel</Button>
        <Button 
          onClick={handleAddMembers} 
          variant="contained" 
          disabled={selectedUserIds.length === 0 || isAdding}
        >
          {isAdding ? <CircularProgress size={24} /> : `Add Selected (${selectedUserIds.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMemberDialog; 