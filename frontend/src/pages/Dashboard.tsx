import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import LoadingScreen from '../components/LoadingScreen';
import { AppDispatch, RootState } from '../store';
import { logout } from '../services/api';
import { logoutSuccess } from '../store/slices/authSlice';
import { keyframes } from '@mui/system';
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
import AddIcon from '@mui/icons-material/Add';
import Sidebar from '../components/Sidebar';
import StickyNotes from '../components/dashboard/StickyNotes';
import Footer from '../components/Footer';

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
    max-height: 200px;
  }
  to {
    transform: translateY(-20px);
    opacity: 0;
    max-height: 0;
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

  return (
    <>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{
          '& .MuiTabs-indicator': {
            backgroundColor: '#fff',
          },
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-selected': {
              color: '#fff',
            },
          },
        }}
      >
        <Tab 
          icon={<DateRangeIcon />} 
          label="Upcoming" 
          iconPosition="start"
        />
        <Tab 
          icon={<WorkIcon />} 
          label="Ongoing" 
          iconPosition="start"
        />
        <Tab 
          icon={<CheckCircleIcon />} 
          label="Completed" 
          iconPosition="start"
        />
      </Tabs>

      {tabValue === 0 && (
        <Box sx={{ mt: 2 }}>
          {filterTasks('upcoming').length === 0 ? (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 4 }}>
              No upcoming tasks
            </Typography>
          ) : (
            filterTasks('upcoming').map(task => (
              // Task card component here
              <Box key={task.id}>{/* Task card content */}</Box>
            ))
          )}
        </Box>
      )}
      {tabValue === 1 && (
        <Box sx={{ mt: 2 }}>
          {filterTasks('ongoing').length === 0 ? (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 4 }}>
              No ongoing tasks
            </Typography>
          ) : (
            filterTasks('ongoing').map(task => (
              // Task card component here
              <Box key={task.id}>{/* Task card content */}</Box>
            ))
          )}
        </Box>
      )}
      {tabValue === 2 && (
        <Box sx={{ mt: 2 }}>
          {filterTasks('completed').length === 0 ? (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 4 }}>
              No completed tasks
            </Typography>
          ) : (
            filterTasks('completed').map(task => (
              // Task card component here
              <Box key={task.id}>{/* Task card content */}</Box>
            ))
          )}
        </Box>
      )}
    </>
  );
};

interface AssignedTasksProps {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  showAssignButton?: boolean;
}

const AssignedTasks: React.FC<AssignedTasksProps> = ({
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
        justifyContent: 'space-between', 
        alignItems: 'center',
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
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 4 }}>
          No tasks {title.toLowerCase()}
        </Typography>
      ) : (
        tasks.map(task => (
          // Task card component here
          <Box key={task.id}>{/* Task card content */}</Box>
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

  const { 
    isAuthenticated, 
    token,
    user
  } = useSelector((state: RootState) => state.auth);

  const [showWidget, setShowWidget] = useState(() => {
    const saved = localStorage.getItem('showHeaderWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState(3);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    localStorage.setItem('showHeaderWidget', JSON.stringify(showWidget));
  }, [showWidget]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }
  }, [dispatch, isAuthenticated, token, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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

  const handleNotificationClick = () => {
    setNotifications(0);
  };

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
    <Box sx={{ 
      display: 'flex', 
      position: 'relative',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e2a78 0%, #ff3c7d 100%)',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.3)'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/svg%3E")
        `,
        backgroundSize: '40px 40px',
        opacity: 0.5,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}>
      <Sidebar
        open={open}
        onToggleDrawer={toggleDrawer}
        onLogout={handleLogout}
      />
      
      <StickyNotes />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
          marginLeft: { xs: 0, sm: open ? '0' : '0' },
          width: { 
            xs: '100%',
            sm: `calc(100% - ${open ? DRAWER_WIDTH + 250 : 72 + 250}px)`
          },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          pb: '28px',
        }}
      >
        <Container 
          maxWidth="lg" 
          sx={{ 
            mt: { xs: 2, sm: 4 }, 
            mb: { xs: 2, sm: 4 },
            px: { xs: 1, sm: 2, md: 3 }, // Adjust padding for different screen sizes
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center',
              gap: { xs: 1, sm: 2 },
              mb: { xs: 1, sm: 2 },
              flexWrap: 'wrap',
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
                padding: { xs: '4px 8px', sm: '4px 12px' },
                minWidth: 'auto',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              {showWidget ? 'Hide' : 'Show'}
            </Button>
          </Box>

          <Box
            sx={{
              height: showWidget ? 'auto' : '0',
              maxHeight: showWidget ? '200px' : '0',
              overflow: 'hidden',
              animation: showWidget 
                ? `${slideDown} 0.3s ease-out forwards`
                : `${slideUp} 0.3s ease-out forwards`,
              marginBottom: showWidget ? 3 : 0,
              transition: theme.transitions.create(['margin-bottom', 'max-height'], {
                duration: theme.transitions.duration.shorter,
                easing: theme.transitions.easing.easeInOut,
              }),
              opacity: showWidget ? 1 : 0,
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
            
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12}>
                <Card
                  sx={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    mb: 3,
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
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

      <Footer open={open} drawerWidth={DRAWER_WIDTH} />
    </Box>
  );
};

export default Dashboard;