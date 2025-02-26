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
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { Task } from '../../types/task';
import axios from '../../utils/axios';

// Define TaskStatus enum to match the backend
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

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
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>(TaskStatus.TODO);
  
  // Edit task dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>(TaskStatus.TODO);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Task[]>('/tasks');
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
        status: newTaskStatus
      });
      
      setTasks([...tasks, response.data]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskStatus(TaskStatus.TODO);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await axios.delete(`/tasks/${id}`);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  const openEditDialog = (task: Task) => {
    setCurrentTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    // Convert the string status to our enum
    const taskStatus = task.status as unknown as string;
    setEditStatus(taskStatus === 'DONE' ? TaskStatus.DONE : 
                 taskStatus === 'IN_PROGRESS' ? TaskStatus.IN_PROGRESS : 
                 TaskStatus.TODO);
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
      case TaskStatus.TODO:
        return 'info';
      case TaskStatus.IN_PROGRESS:
        return 'warning';
      case TaskStatus.DONE:
        return 'success';
      default:
        return 'default';
    }
  };

  // Helper function to check if a task is done
  const isTaskDone = (task: Task): boolean => {
    return (task.status as unknown as string) === TaskStatus.DONE;
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
                <MenuItem value={TaskStatus.TODO}>To Do</MenuItem>
                <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={TaskStatus.DONE}>Done</MenuItem>
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
      <Stack spacing={2}>
        {tasks.length === 0 ? (
          <Typography variant="body1" color="textSecondary" align="center">
            No tasks found. Create a new task to get started!
          </Typography>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} sx={{ mb: 1 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" alignItems="center" width="100%">
                    <Checkbox
                      checked={isTaskDone(task)}
                      onChange={() => 
                        handleStatusChange(
                          task, 
                          isTaskDone(task) ? TaskStatus.TODO : TaskStatus.DONE
                        )
                      }
                    />
                    <Box width="100%">
                      <Typography
                        variant="h6"
                        sx={{
                          textDecoration: isTaskDone(task) ? 'line-through' : 'none',
                          color: isTaskDone(task) ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {task.title}
                      </Typography>
                      {task.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {task.description}
                        </Typography>
                      )}
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={(task.status as unknown as string).replace('_', ' ')} 
                          size="small" 
                          color={getStatusColor(task.status as unknown as string) as any}
                          sx={{ mr: 1 }}
                        />
                        {task.updated_at && (
                          <Typography variant="caption" color="text.secondary">
                            Updated: {new Date(task.updated_at).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => openEditDialog(task)}
                      aria-label="edit task"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteTask(task.id)}
                      aria-label="delete task"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
      
      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
              rows={3}
              variant="outlined"
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editStatus}
                label="Status"
                onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
              >
                <MenuItem value={TaskStatus.TODO}>To Do</MenuItem>
                <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={TaskStatus.DONE}>Done</MenuItem>
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
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Todo; 