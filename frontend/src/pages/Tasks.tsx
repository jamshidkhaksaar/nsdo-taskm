import React, { useState, useEffect } from 'react';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminLayout from '../components/AdminLayout';
import { TaskService } from '../services/task';
import { Task } from '../types/task';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await TaskService.getTasks();
      setTasks(response);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Filter tasks by title based on search query
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handler for editing a task
  const handleEdit = (task: Task) => {
    // Implement your edit logic here (e.g., navigate to an edit page or open a dialog)
    console.log('Edit task:', task);
  };

  // Handler for deleting a task
  const handleDelete = async (task: Task) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await TaskService.deleteTask(task.id);
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Handler for creating a task
  const handleCreate = () => {
    // Implement your create task logic here (e.g., open a creation dialog or navigate to a new page)
    console.log('Create new task');
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: '#fff' }}>
            Tasks
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Create Task
          </Button>
        </Box>
        <TextField
          label="Search Tasks"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{
            mb: 3,
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
          InputLabelProps={{ style: { color: '#fff' } }}
          inputProps={{ style: { color: '#fff' } }}
        />
        {isLoading ? (
          <Typography variant="body1" sx={{ color: '#fff' }}>
            Loading tasks...
          </Typography>
        ) : error ? (
          <Typography variant="body1" sx={{ color: '#f44336' }}>
            {error}
          </Typography>
        ) : (
          <TableContainer component={Paper} sx={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <Table sx={{ minWidth: 650 }} aria-label="tasks table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#fff' }}>Title</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Status</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Due Date</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell sx={{ color: '#fff' }}>{task.title}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{task.status}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {new Date(task.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(task)} aria-label="edit">
                        <EditIcon sx={{ color: '#fff' }} />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(task)} aria-label="delete">
                        <DeleteIcon sx={{ color: '#fff' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ color: '#fff' }}>
                      No tasks found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </AdminLayout>
  );
};

export default Tasks; 