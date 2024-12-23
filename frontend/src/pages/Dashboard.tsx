import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { AppDispatch, RootState } from '../store';
import { logout } from '../services/api';
import { logoutSuccess } from '../store/slices/authSlice';
import logo from '../assets/images/logo.png';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import logoIcon from '../assets/images/logoIcon.png';
import { keyframes } from '@mui/system';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { format } from 'date-fns';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import DateRangeIcon from '@mui/icons-material/DateRange';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import LoadingScreen from '../components/LoadingScreen';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';

const DRAWER_WIDTH = 240;

const slideDown = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
`;

const shakeAnimation = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(10deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(-10deg); }
  100% { transform: rotate(0deg); }
`;

const HeaderWidget: React.FC<{ username: string }> = ({ username }) => {
  const [time, setTime] = useState(new Date());
  const [weatherInfo, setWeatherInfo] = useState({
    location: "Loading...",
    temp: "--°C",
    condition: "Loading",
  });

  // Fetch location and weather data using IP
  useEffect(() => {
    const fetchLocationAndWeather = async () => {
      try {
        // Get location from IP
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        // Set weather info based on location
        setWeatherInfo({
          location: `${data.city}, ${data.country_code}`,
          temp: `${Math.round(data.latitude < 0 ? 25 : 20)}°C`, // Simple temperature estimation
          condition: data.latitude < 0 ? "Sunny" : "Clear",
        });
      } catch (error) {
        console.error("Error fetching location:", error);
        setWeatherInfo({
          location: "Kabul, AF",
          temp: "25°C",
          condition: "Clear",
        });
      }
    };

    fetchLocationAndWeather();
  }, []);

  // Clock update effect remains the same
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Function to get greeting based on time of day
  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 17) {
      return 'Good afternoon';
    } else if (hour < 21) {
      return 'Good evening';
    } else {
      return 'Good night';
    }
  };

  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.17)',
      }}
    >
      {/* Greeting Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />
        <Box>
          <Typography
            variant="body1"
            sx={{
              color: '#fff',
              fontWeight: 500,
            }}
          >
            {getGreeting()},
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 400,
            }}
          >
            {username}
          </Typography>
        </Box>
      </Box>

      {/* Right Section Container */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {/* Weather Widget */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />
            <Typography
              variant="body2"
              sx={{ color: '#fff' }}
            >
              {weatherInfo.location}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WbSunnyIcon sx={{ color: '#FFD700' }} />
            <Box>
              <Typography
                variant="body2"
                sx={{ color: '#fff', fontWeight: 500 }}
              >
                {weatherInfo.temp}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                {weatherInfo.condition}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Clock with improved design */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, rgba(255,255,255,0.1), transparent)',
              borderRadius: '12px',
              pointerEvents: 'none',
            }
          }}
        >
          <AccessTimeIcon 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.6 },
              }
            }} 
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography
              variant="h6"
              sx={{ 
                color: '#fff',
                fontWeight: 600,
                letterSpacing: '2px',
                fontFamily: 'monospace',
                fontSize: '1.1rem',
              }}
            >
              {format(time, 'HH:mm')}
            </Typography>
            <Typography
              variant="caption"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: 'monospace',
              }}
            >
              {format(time, 'ss')} SEC
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  assignedTo?: string;
  assignedBy?: string;
}

const TaskTabs: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filterTasks = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const TaskList: React.FC<{ tasks: Task[]; status: Task['status'] }> = ({ tasks, status }) => (
    <Box sx={{ mt: 2 }}>
      {tasks.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px dashed rgba(255, 255, 255, 0.2)',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontStyle: 'italic',
            }}
          >
            {status === 'upcoming' && 'No upcoming tasks'}
            {status === 'ongoing' && 'No ongoing tasks'}
            {status === 'completed' && 'No completed tasks'}
          </Typography>
        </Box>
      ) : (
        tasks.map((task) => (
          <Card
            key={task.id}
            sx={{
              mb: 2,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                {task.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {task.description}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                <Typography variant="caption">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-selected': {
              color: '#fff',
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#fff',
          },
        }}
      >
        <Tab icon={<DateRangeIcon />} label="Upcoming" />
        <Tab icon={<WorkIcon />} label="Ongoing" />
        <Tab icon={<CheckCircleIcon />} label="Completed" />
      </Tabs>
      <Box role="tabpanel" hidden={tabValue !== 0}>
        {tabValue === 0 && <TaskList tasks={filterTasks('upcoming')} status="upcoming" />}
      </Box>
      <Box role="tabpanel" hidden={tabValue !== 1}>
        {tabValue === 1 && <TaskList tasks={filterTasks('ongoing')} status="ongoing" />}
      </Box>
      <Box role="tabpanel" hidden={tabValue !== 2}>
        {tabValue === 2 && <TaskList tasks={filterTasks('completed')} status="completed" />}
      </Box>
    </Box>
  );
};

const AssignedTasks: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  tasks: Task[];
  showAssignButton?: boolean;
}> = ({
  title,
  icon,
  tasks,
  showAssignButton
}) => (
  <Card
    sx={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      mb: 3,
    }}
  >
    <CardContent>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ color: '#fff' }}>
            {title}
          </Typography>
        </Box>
        {showAssignButton && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#fff',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Assign Task
          </Button>
        )}
      </Box>
      {tasks.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px dashed rgba(255, 255, 255, 0.2)',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontStyle: 'italic',
            }}
          >
            {title.includes('to Me') ? 'No tasks assigned to you' : 'No tasks assigned by you'}
          </Typography>
        </Box>
      ) : (
        tasks.map((task) => (
          <Card
            key={task.id}
            sx={{
              mb: 2,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" sx={{ color: '#fff' }}>
                {task.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {task.description}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const { 
    isAuthenticated, 
    token,
    user
  } = useSelector((state: RootState) => state.auth);

  const [showWidget, setShowWidget] = useState(() => {
    const saved = localStorage.getItem('showHeaderWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('showHeaderWidget', JSON.stringify(showWidget));
  }, [showWidget]);

  React.useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }
  }, [dispatch, isAuthenticated, token, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(logoutSuccess());
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const [notifications, setNotifications] = useState<number>(3); // Example number of notifications

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time or wait for resources
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Adjust time as needed

    return () => clearTimeout(timer);
  }, []);

  const handleNotificationClick = () => {
    // Reset notifications count when clicked
    setNotifications(0);
  };

  const isMenuItemActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ display: 'flex', background: 'linear-gradient(135deg, #1e2a78 0%, #ff3c7d 100%)' }}>
      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? DRAWER_WIDTH : 72,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : 72,
            overflowX: 'hidden',
            background: 'rgba(30, 42, 120, 0.8)',
            backdropFilter: 'blur(8px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#fff',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <List>
            {/* Logo */}
            <ListItem 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px',
                marginBottom: 0,
                position: 'relative',
                height: '80px',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '40px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    transition: theme.transitions.create(['transform', 'opacity'], {
                      duration: theme.transitions.duration.enteringScreen,
                      easing: theme.transitions.easing.easeInOut,
                    }),
                    transform: open ? 'scale(1)' : 'scale(0.5)',
                    opacity: open ? 1 : 0,
                  }}
                >
                  <img 
                    src={logo} 
                    alt="Logo" 
                    style={{ 
                      height: '50px',
                      width: '200px',
                      objectFit: 'contain'
                    }} 
                  />
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    transition: theme.transitions.create(['transform', 'opacity'], {
                      duration: theme.transitions.duration.enteringScreen,
                      easing: theme.transitions.easing.easeInOut,
                    }),
                    transform: !open ? 'scale(1)' : 'scale(1.2)',
                    opacity: !open ? 1 : 0,
                  }}
                >
                  <img src={logoIcon} alt="Logo Icon" style={{ height: '35px' }} />
                </Box>
              </Box>
            </ListItem>

            {/* Toggle Button */}
            <ListItem
              button
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                mb: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
              onClick={toggleDrawer}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: '#fff',
                  transition: theme.transitions.create(['margin-right', 'transform'], {
                    duration: theme.transitions.duration.shorter,
                  }),
                  transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
                }}
              >
                <MenuIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Toggle Menu" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  transition: theme.transitions.create('opacity', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                  color: '#fff'
                }} 
              />
            </ListItem>

            {/* Navigation Items */}
            <ListItem
              button
              selected={isMenuItemActive('/')}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                transition: theme.transitions.create(['padding', 'margin', 'background-color'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: '#fff',
                    borderRadius: '0 4px 4px 0',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: '#fff',
                  transition: theme.transitions.create('margin-right', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                }}
              >
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Dashboard" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  transition: theme.transitions.create('opacity', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                  color: '#fff'
                }} 
              />
            </ListItem>

            <ListItem
              button
              selected={isMenuItemActive('/departments')}
              onClick={() => navigate('/departments')}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                transition: theme.transitions.create(['padding', 'margin', 'background-color'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: '#fff',
                    borderRadius: '0 4px 4px 0',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: '#fff'
                }}
              >
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Departments" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  transition: theme.transitions.create('opacity', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                  color: '#fff'
                }} 
              />
            </ListItem>

            <ListItem
              button
              selected={isMenuItemActive('/users')}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                transition: theme.transitions.create(['padding', 'margin', 'background-color'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: '#fff',
                    borderRadius: '0 4px 4px 0',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: '#fff',
                  transition: theme.transitions.create('margin-right', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                }}
              >
                <PersonIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Users" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  transition: theme.transitions.create('opacity', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                  color: '#fff'
                }} 
              />
            </ListItem>

            <ListItem
              button
              selected={isMenuItemActive('/admin')}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                transition: theme.transitions.create(['padding', 'margin', 'background-color'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: '#fff',
                    borderRadius: '0 4px 4px 0',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: '#fff',
                  transition: theme.transitions.create('margin-right', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                }}
              >
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Admin Panel" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  transition: theme.transitions.create('opacity', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                  color: '#fff'
                }} 
              />
            </ListItem>
          </List>

          {/* Logout at bottom */}
          <List sx={{ marginTop: 'auto' }}>
            <Tooltip title="Logout">
              <ListItem 
                button 
                onClick={handleLogout}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.contrastText }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
            </Tooltip>
          </List>
        </Box>
      </Drawer>

      {/* Main Content - Updated styling */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          minHeight: '100vh',
          p: 3,
          pb: 8,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          marginLeft: 0,
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='network' x='0' y='0' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.3)'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%' height='100%' fill='url(%23network)'/%3E%3C/svg%3E")
          `,
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center',
              gap: 2,
              mb: 2,
              position: 'relative',
              zIndex: 2,
            }}
          >
            <IconButton
              onClick={handleNotificationClick}
              sx={{
                color: '#fff',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                animation: notifications > 0 ? `${shakeAnimation} 1s ease-in-out infinite` : 'none',
                animationPlayState: 'running',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  animationPlayState: 'paused',
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Badge 
                badgeContent={notifications} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    background: '#ff3c7d',
                    color: '#fff',
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton
              onClick={handleProfileClick}
              sx={{
                color: '#fff',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: 'transparent',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                }}
              >
                <AccountCircleIcon />
              </Avatar>
            </IconButton>

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
                  color: '#fff',
                  mt: 1.5,
                  '& .MuiMenuItem-root': {
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => navigate('/profile')}>
                <ListItemIcon>
                  <AccountCircleIcon sx={{ color: '#fff' }} />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => navigate('/settings')}>
                <ListItemIcon>
                  <SettingsIcon sx={{ color: '#fff' }} />
                </ListItemIcon>
                Settings
              </MenuItem>
            </Menu>

            <Button
              onClick={() => setShowWidget(!showWidget)}
              startIcon={showWidget ? <ExpandLessIcon /> : <ExpandLessIcon />}
              sx={{
                color: '#fff',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '20px',
                padding: '4px 12px',
                minWidth: 'auto',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              {showWidget ? 'Hide Time & Weather' : 'Show Time & Weather'}
            </Button>
          </Box>

          <Box
            sx={{
              height: showWidget ? 'auto' : 0,
              overflow: 'hidden',
              animation: showWidget 
                ? `${slideDown} 0.3s ease-out forwards`
                : `${slideUp} 0.3s ease-out forwards`,
              marginBottom: showWidget ? 3 : 0,
              transition: 'margin-bottom 0.3s ease-out',
            }}
          >
            <HeaderWidget username={user?.username || 'User'} />
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography
              variant="h5"
              sx={{
                color: '#fff',
                mb: 3,
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              Task Management
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card
                  sx={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    mb: 3,
                  }}
                >
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2 
                    }}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        My Tasks
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          color: '#fff',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.2)',
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        Create New Task
                      </Button>
                    </Box>
                    <TaskTabs tasks={[/* Add your tasks data here */]} />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <AssignedTasks
                  title="Tasks Assigned to Me"
                  icon={<AssignmentIndIcon sx={{ color: '#fff' }} />}
                  tasks={[/* Add assigned to me tasks */]}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <AssignedTasks
                  title="Tasks Assigned by Me"
                  icon={<AssignmentIcon sx={{ color: '#fff' }} />}
                  tasks={[/* Add assigned by me tasks */]}
                  showAssignButton={true}
                />
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Add the footer before the closing Box */}
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: `calc(100% - ${open ? DRAWER_WIDTH : 72}px)`,
          padding: '0.5rem',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.18)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          zIndex: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 500,
          }}
        >
          Developed by Jamshid Khaksaar
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            component="a"
            href="https://github.com/JamshidKhaksaar"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              padding: '4px',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)',
              },
              transition: 'transform 0.2s ease-in-out',
            }}
          >
            <GitHubIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
          <IconButton
            component="a"
            href="https://linkedin.com/in/jamshid-khaksaar"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              padding: '4px',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)',
              },
              transition: 'transform 0.2s ease-in-out',
            }}
          >
            <LinkedInIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;