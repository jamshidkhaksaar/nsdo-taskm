import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Autocomplete, CircularProgress, Alert, Typography, Box
} from '@mui/material';
import { User } from '@/types/user';

interface DelegateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (selectedUsers: User[], comment: string) => Promise<void>; // Adjusted onSubmit based on TaskViewDialog usage
  taskId: string;
  taskTitle: string;
  currentAssignees?: User[]; // Optional: To show who is already assigned
  users: User[]; // List of users to select from
  loading: boolean;
  error: string | null;
}

const DelegateTaskDialog: React.FC<DelegateTaskDialogProps> = ({
  open,
  onClose,
  onSubmit,
  taskId,
  taskTitle,
  currentAssignees = [],
  users,
  loading,
  error,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [comment, setComment] = useState('');

  // Reset state when dialog opens or taskId changes
  useEffect(() => {
    if (open) {
      setSelectedUsers([]);
      setComment('');
    }
  }, [open]);

  const handleInternalSubmit = () => {
    // Consider adding validation here if needed (e.g., ensure users are selected)
    onSubmit(selectedUsers, comment);
  };

  // Filter out current assignees from the list of selectable users
  const availableUsers = users.filter(
    user => !currentAssignees.some(assignee => assignee.id === user.id)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delegate Task: "{taskTitle || '...'}"</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Select users to delegate this task to. The original task might be reassigned or a new linked task created, depending on backend logic.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        <Autocomplete
          multiple
          options={availableUsers} // Show only users not already assigned
          getOptionLabel={(option) => `${option.first_name || ''} ${option.last_name || ''}`.trim() || option.username || `ID: ${option.id}`}
          value={selectedUsers}
          onChange={(event, newValue) => {
            setSelectedUsers(newValue as User[]);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Select User(s) to Delegate To"
              placeholder="Users"
              margin="dense"
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          disabled={loading}
        />
        <TextField
          margin="dense"
          label="Delegation Comment (Optional)"
          type="text"
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleInternalSubmit}
          variant="contained"
          color="primary"
          disabled={selectedUsers.length === 0 || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Confirm Delegation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DelegateTaskDialog; 