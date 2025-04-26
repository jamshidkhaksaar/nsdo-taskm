import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  Checkbox, 
  IconButton, 
  Stack, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  DialogContentText
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { Task, TaskStatus } from '../../types/task';
import axios from '../../utils/axios';

interface TodoProps {
  userId?: string;
}

const Todo: React.FC<TodoProps> = ({ userId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  
  // Edit task dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>(TaskStatus.PENDING);

  // Add state for deletion
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [deletionReasonError, setDeletionReasonError] = useState('');

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Use specific endpoint for user tasks if userId is provided
      const endpoint = userId ? `/tasks/user/${userId}` : '/tasks';
      const response = await axios.get<Task[]>(endpoint);
      setTasks(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    try {
      const response = await axios.post<Task>('/tasks', {
        title: newTaskTitle,
        description: newTaskDescription,
        status: newTaskStatus,
        type: 'personal', // Specify task type
        priority: 'medium', // Default priority
        is_private: false // Default visibility
      });
      
      setTasks([...tasks, response.data]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskStatus(TaskStatus.PENDING);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    }
  };

  const initiateDeleteTask = (id: string) => {
    setDeletingTaskId(id);
    setDeletionReason('');
    setDeletionReasonError('');
    setDeletionDialogOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    
    if (!deletionReason || deletionReason.length < 20) {
      setDeletionReasonError('Please provide a detailed reason (at least 20 characters)');
      return;
    }
    
    try {
      await axios.post(`/tasks/${deletingTaskId}/delete`, { deletionReason });
      setTasks(tasks.filter(task => task.id !== deletingTaskId));
      setDeletionDialogOpen(false);
      setDeletingTaskId(null);
      setDeletionReason('');
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  const openEditDialog = (task: Task) => {
    setCurrentTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    // Convert the string status to our enum if needed
    const taskStatus = task.status;
    setEditStatus(taskStatus === 'completed' ? TaskStatus.COMPLETED : 
                 taskStatus === 'in_progress' ? TaskStatus.IN_PROGRESS : 
                 taskStatus === 'cancelled' ? TaskStatus.CANCELLED :
                 TaskStatus.PENDING);
    setEditDialogOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!currentTask || !editTitle.trim()) return;
    
    try {
      const response = await axios.patch<Task>(`/tasks/${currentTask.id}`, {
        title: editTitle,
        description: editDescription,
        status: editStatus
      });
      
      setTasks(tasks.map(task => 
        task.id === currentTask.id ? response.data : task
      ));
      
      setEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      const response = await axios.patch<Task>(`/tasks/${task.id}/status`, {
        status: newStatus
      });
      
      setTasks(tasks.map(t => 
        t.id === task.id ? response.data : t
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'info';
      case TaskStatus.IN_PROGRESS:
        return 'warning';
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  // Helper function to check if a task is done
  const isTaskDone = (task: Task): boolean => {
    return task.status === TaskStatus.COMPLETED;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Tasks
      </Typography>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {/* New Task Form */}
      <Card sx={{ mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Create New Task
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Task Title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Description"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              multiline
              rows={2}
              variant="outlined"
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newTaskStatus}
                label="Status"
                onChange={(e) => setNewTaskStatus(e.target.value as TaskStatus)}
              >
                <MenuItem value={TaskStatus.PENDING}>To Do</MenuItem>
                <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={TaskStatus.COMPLETED}>Done</MenuItem>
                <MenuItem value={TaskStatus.CANCELLED}>Cancelled</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim()}
            >
              Add Task
            </Button>
          </Stack>
        </CardContent>
      </Card>
      
      {/* Task List */}
      <Typography variant="h6" gutterBottom>
        Task List ({tasks.length})
      </Typography>
      
      {tasks.length === 0 ? (
        <Typography color="textSecondary">
          No tasks found. Create one to get started!
        </Typography>
      ) : (
        <Stack spacing={2}>
          {tasks.map(task => (
            <Card key={task.id} sx={{ 
              p: 2, 
              opacity: isTaskDone(task) ? 0.7 : 1,
              textDecoration: isTaskDone(task) ? 'line-through' : 'none'
            }}>
              <CardContent sx={{ pb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center">
                    <Checkbox
                      checked={isTaskDone(task)}
                      onChange={() => handleStatusChange(task, 
                        isTaskDone(task) ? TaskStatus.PENDING : TaskStatus.COMPLETED
                      )}
                    />
                    <Typography variant="h6" component="div">
                      {task.title}
                    </Typography>
                  </Box>
                  <Box>
                    <Chip 
                      label={task.status} 
                      color={getStatusColor(task.status) as any}
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                    <IconButton 
                      onClick={() => openEditDialog(task)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => initiateDeleteTask(task.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                {task.description && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1, ml: 4 }}>
                    {task.description}
                  </Typography>
                )}
                {task.dueDate && (
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 4 }}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
      
      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Task Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              multiline
              rows={2}
              variant="outlined"
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editStatus}
                label="Status"
                onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
              >
                <MenuItem value={TaskStatus.PENDING}>To Do</MenuItem>
                <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={TaskStatus.COMPLETED}>Done</MenuItem>
                <MenuItem value={TaskStatus.CANCELLED}>Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateTask}
            variant="contained"
            disabled={!editTitle.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Task Dialog */}
      <Dialog open={deletionDialogOpen} onClose={() => setDeletionDialogOpen(false)}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Are you sure you want to delete this task? This action places the task in the recycle bin.
            Please provide a detailed reason for deletion.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Reason for Deletion"
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            error={!!deletionReasonError}
            helperText={deletionReasonError || 'Minimum 20 characters required'}
            multiline
            rows={3}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteTask}
            color="error"
            variant="contained"
            disabled={!deletionReason || deletionReason.length < 20}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
    </Box>
  );
};

export default Todo; 