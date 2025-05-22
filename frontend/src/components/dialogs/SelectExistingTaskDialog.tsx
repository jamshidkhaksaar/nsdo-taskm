import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  TextField,
  Checkbox,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import { User } from '../../types/user';
import { Task } from '@/types'; // Corrected import path for Task type
import { TaskService } from '../../services/task'; // Assuming a TaskService
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SelectExistingTaskDialogProps { // Renamed interface
  open: boolean;
  onClose: () => void;
  user: User | null; // This dialog is for assigning to a single user primarily
}

const SelectExistingTaskDialog: React.FC<SelectExistingTaskDialogProps> = ({ open, onClose, user }) => { // Renamed component
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tasks (replace with your actual task fetching logic)
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery<Task[], Error>({
    queryKey: ['tasks', { /* any relevant filters like status: 'open' */ }],
    queryFn: () => TaskService.getTasks({ /* parameters for fetching assignable tasks */ }), // Modify as per your service
    enabled: open, // Only fetch when the dialog is open
  });

  const assignTaskMutation = useMutation({
    mutationFn: (taskId: string) => TaskService.updateTask(taskId, { assignedToUserIds: user ? [user.id] : [] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user', user?.id, 'tasks'] }); // Or however you track user-specific tasks
      onClose();
      // Optionally, show a success notification
    },
    onError: (error: any) => {
      // Optionally, show an error notification
      console.error("Failed to assign task:", error);
    },
  });

  const handleAssignTask = () => {
    if (selectedTaskId && user) {
      assignTaskMutation.mutate(selectedTaskId);
    }
  };

  const filteredTasks = tasksData?.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  useEffect(() => {
    if (open) {
      setSelectedTaskId(null); // Reset selection when dialog opens
      setSearchTerm(''); // Reset search term
    }
  }, [open]);

  if (!user) return null; // This dialog expects a single user context

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Task to Assign to {user.username}</DialogTitle> {/* Updated title */}
      <DialogContent dividers>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search tasks by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
        {tasksLoading && <CircularProgress />}
        {tasksError && <Alert severity="error">Error fetching tasks: {tasksError.message}</Alert>}
        {!tasksLoading && !tasksError && (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {filteredTasks.length === 0 && (
              <ListItem>
                <ListItemText primary={searchTerm ? "No tasks match your search." : "No available tasks to assign."} />
              </ListItem>
            )}
            {filteredTasks.map((task) => (
              <ListItem 
                key={task.id} 
                button 
                onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)}
                selected={task.id === selectedTaskId}
              >
                <ListItemText 
                  primary={task.title} 
                  secondary={task.status ? `Status: ${task.status}` : 'No status'} 
                />
                <ListItemSecondaryAction>
                  <Checkbox
                    edge="end"
                    onChange={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)}
                    checked={task.id === selectedTaskId}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleAssignTask} 
          color="primary" 
          disabled={!selectedTaskId || assignTaskMutation.isPending}
        >
          {assignTaskMutation.isPending ? <CircularProgress size={24} /> : "Assign Selected Task"} {/* Updated button text */}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectExistingTaskDialog; // Renamed export 