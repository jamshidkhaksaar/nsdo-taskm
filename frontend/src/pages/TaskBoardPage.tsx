import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  useTheme,
  Tab,
  Tabs,
  IconButton,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Task } from '../types/task';
import { TaskService } from '../services/task';
import TaskBoard from '../components/tasks/TaskBoard';
import CreateTaskDialog from '../components/tasks/CreateTaskDialog';

type TaskType = 'my_tasks' | 'assigned' | 'created' | 'all';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `task-tab-${index}`,
    'aria-controls': `task-tabpanel-${index}`,
  };
}

const TaskBoardPage: React.FC = () => {
  const theme = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async (taskType: TaskType = 'my_tasks') => {
    try {
      setIsLoading(true);
      const fetchedTasks = await TaskService.getTasks({ task_type: taskType });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const taskTypes: TaskType[] = ['my_tasks', 'assigned', 'created'];
    fetchTasks(taskTypes[tabValue]);
  }, [tabValue]);

  const handleCreateTask = async (newTask: Task) => {
    try {
      await TaskService.createTask(newTask);
      const taskTypes: TaskType[] = ['my_tasks', 'assigned', 'created'];
      fetchTasks(taskTypes[tabValue]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await TaskService.deleteTask(taskId);
        const taskTypes: TaskType[] = ['my_tasks', 'assigned', 'created'];
        fetchTasks(taskTypes[tabValue]);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleTaskUpdated = async (updatedTask: Task) => {
    try {
      await TaskService.updateTask(updatedTask.id, updatedTask);
      const taskTypes: TaskType[] = ['my_tasks', 'assigned', 'created'];
      fetchTasks(taskTypes[tabValue]);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Task Board
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Filter tasks">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedTaskId(null);
                setIsCreateDialogOpen(true);
              }}
            >
              Create Task
            </Button>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="task tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                minWidth: 120,
              }
            }}
          >
            <Tab label="My Tasks" {...a11yProps(0)} />
            <Tab label="Assigned to Me" {...a11yProps(1)} />
            <Tab label="Created by Me" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TaskBoard
            tasks={tasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onTaskUpdated={handleTaskUpdated}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <TaskBoard
            tasks={tasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onTaskUpdated={handleTaskUpdated}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <TaskBoard
            tasks={tasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onTaskUpdated={handleTaskUpdated}
          />
        </TabPanel>
      </Box>

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setSelectedTaskId(null);
        }}
        onTaskCreated={async () => {
          const taskTypes: TaskType[] = ['my_tasks', 'assigned', 'created'];
          await fetchTasks(taskTypes[tabValue]);
        }}
        dialogType="personal"
        task={selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : undefined}
      />
    </Container>
  );
};

export default TaskBoardPage; 