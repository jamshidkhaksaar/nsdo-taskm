import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Chip,
  keyframes,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TuneIcon from '@mui/icons-material/Tune';
import AdminLayout from '../components/AdminLayout';
import { TaskService } from '../services/task';
import { Task, TaskStatus } from '../types/task';
import { loadFull } from "tsparticles";
import Particles from "react-tsparticles";
import type { Container as ParticlesContainer, Engine } from "tsparticles-engine";

// Animation keyframes
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
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
};

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [tabValue, setTabValue] = useState(0);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: ParticlesContainer | undefined) => {
    console.log("Particles loaded", container);
  }, []);

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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (task: Task) => {
    console.log('Edit task:', task);
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await TaskService.deleteTask(task.id);
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleCreate = () => {
    console.log('Create new task');
  };

  const handleNotificationClick = () => {
    setNotifications(0);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in_progress':
        return '#2196f3';
      case 'pending':
        return '#ff9800';
      case 'cancelled':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const renderTaskColumn = (title: string, tasks: Task[], count: number) => (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        p: 2,
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ color: '#fff' }}>
            {title}
          </Typography>
          <Chip
            label={count}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          />
        </Box>
      </Box>
      <Stack spacing={2}>
        {tasks.map((task) => (
          <Card
            key={task.id}
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '8px',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: 'transform 0.2s ease-in-out',
              },
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1 }}>
                {task.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                {task.description}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(task)}
                    sx={{ color: '#fff' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(task)}
                    sx={{ color: '#f44336' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );

  const upcomingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const cancelledTasks = tasks.filter(task => task.status === 'cancelled');

  return (
    <AdminLayout>
      <Box
        sx={{
          position: 'relative',
          minHeight: 'calc(100vh - 64px)',
          background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          overflow: 'hidden',
          padding: '24px 0',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.1)'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.05)' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px',
            opacity: 0.3,
            pointerEvents: 'none',
            zIndex: 0,
          },
        }}
      >
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            fullScreen: false,
            background: {
              color: {
                value: "transparent",
              },
            },
            fpsLimit: 120,
            particles: {
              color: {
                value: "#ffffff",
              },
              links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.15,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "bounce",
                },
                random: false,
                speed: 1.5,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: 60,
              },
              opacity: {
                value: 0.15,
              },
              shape: {
                type: "circle",
              },
              size: {
                value: { min: 1, max: 2 },
              },
            },
            detectRetina: true,
          }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            zIndex: 0,
          }}
        />
        <Container 
          maxWidth="xl" 
          sx={{ 
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Header Section */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.18)',
            }}
          >
            <Typography variant="h4" sx={{ color: '#fff' }}>
              Task Board
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{
                  background: '#2196f3',
                  color: '#fff',
                  '&:hover': {
                    background: '#1976d2',
                  },
                }}
              >
                Create Task
              </Button>
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#2196f3',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#2196f3',
                },
              }}
            >
              <Tab label="My Tasks" />
              <Tab label="Assigned to Me" />
              <Tab label="Created by Me" />
            </Tabs>
          </Box>

          {/* Task Board Content */}
          <TabPanel value={tabValue} index={0}>
            {isLoading ? (
              <Typography sx={{ color: '#fff' }}>Loading tasks...</Typography>
            ) : error ? (
              <Typography sx={{ color: '#f44336' }}>{error}</Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 3,
                  mt: 2,
                }}
              >
                {renderTaskColumn('Upcoming', upcomingTasks, upcomingTasks.length)}
                {renderTaskColumn('In Progress', inProgressTasks, inProgressTasks.length)}
                {renderTaskColumn('Completed', completedTasks, completedTasks.length)}
                {renderTaskColumn('Cancelled', cancelledTasks, cancelledTasks.length)}
              </Box>
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <Typography sx={{ color: '#fff' }}>Assigned tasks will appear here</Typography>
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <Typography sx={{ color: '#fff' }}>Created tasks will appear here</Typography>
          </TabPanel>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleProfileClose}
            onClick={handleProfileClose}
            PaperProps={{
              sx: {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
                '& .MuiMenuItem-root': {
                  color: '#fff',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                },
              },
            }}
          >
            <MenuItem>Profile</MenuItem>
            <MenuItem>Settings</MenuItem>
            <MenuItem>Logout</MenuItem>
          </Menu>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default Tasks; 