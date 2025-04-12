import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import { Task } from '../../types/task';

interface TaskViewDialogProps {
  open: boolean;
  onClose: () => void;
  task: Task;
}

const TaskViewDialog: React.FC<TaskViewDialogProps> = ({ open, onClose, task }) => {
  const theme = useTheme();
  // Delegation state (must be inside component)
  const [delegateDialogOpen, setDelegateDialogOpen] = useState(false);
  const [delegateUserId, setDelegateUserId] = useState('');

  if (!task) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Task Not Found</DialogTitle>
        <DialogContent>
          <Typography>The requested task could not be loaded.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Task Details</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>{task.title}</Typography>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            Status: {task.status}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            <strong>Description:</strong>
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {task.description || 'No description provided'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box>
            <Typography variant="body2" color="textSecondary">
              <strong>Created:</strong> {new Date(task.created_at).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Due:</strong> {task.due_date ? new Date(task.due_date).toLocaleString() : 'Not set'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              <strong>Priority:</strong> {task.priority}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Department:</strong> {typeof task.department === 'object' ? task.department?.name : task.department || '-'}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
        {/* Delegate Task Button */}
        <Button
          color="secondary"
          variant="outlined"
          onClick={() => setDelegateDialogOpen(true)}
        >
          Delegate Task
        </Button>
      </DialogActions>
      {/* Delegate Dialog */}
      <Dialog open={delegateDialogOpen} onClose={() => setDelegateDialogOpen(false)}>
        <DialogTitle>Delegate Task</DialogTitle>
        <DialogContent>
          <Typography>Select user ID to delegate to:</Typography>
          <input
            type="text"
            value={delegateUserId}
            onChange={e => setDelegateUserId(e.target.value)}
            placeholder="User ID"
            style={{ width: '100%', marginTop: 8, marginBottom: 8 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelegateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              await TaskService.delegateTask(task.id, delegateUserId);
              setDelegateDialogOpen(false);
              onClose();
            }}
            variant="contained"
            color="primary"
            disabled={!delegateUserId}
          >
            Delegate
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};


export default TaskViewDialog;