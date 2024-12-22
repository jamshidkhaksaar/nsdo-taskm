import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { AppDispatch, RootState } from '../store';
import { fetchBoards } from '../store/slices/boardSlice';
import { logout } from '../services/api';
import { logoutSuccess } from '../store/slices/authSlice';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import WeatherAndClock from '../components/WeatherAndClock';
import { WeatherProvider } from '../context/WeatherContext';
import MyTasks from '../components/MyTasks';
import Projects from '../components/Projects';
import AssignedByMeTasks from '../components/AssignedByMeTasks';
import AssignedToMeTasks from '../components/AssignedToMeTasks';
import StickyNotes from '../components/StickyNotes';
import OnlineUsersFooter from '../components/OnlineUsersFooter';
import DashboardLayout from '../components/layouts/DashboardLayout';

const DRAWER_WIDTH = 240;

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [isNotesMinimized, setIsNotesMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWelcome, setShowWelcome] = useState(false);

  const { loading } = useSelector((state: RootState) => state.board);
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    const currentDate = new Date().toDateString();
    
    if (!lastLoginTime || new Date(lastLoginTime).toDateString() !== currentDate) {
      setShowWelcome(true);
      localStorage.setItem('lastLoginTime', new Date().toISOString());
    }

    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  React.useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    dispatch(fetchBoards());
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

  const handleDrawerToggle = () => {
    setIsOpen(!isOpen);
  };

  const styles = {
    welcomeCard: {
      p: 1.5,
      mb: 1.5,
      borderRadius: 2,
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 1.5,
    },

    contentGrid: {
      display: 'grid',
      gap: 1.5,
      gridTemplateColumns: {
        xs: '1fr',
        lg: '2fr 1fr'
      },
      gridTemplateRows: 'auto 1fr',
      height: 'calc(100% - 70px)',
    },

    taskSection: {
      display: 'grid',
      gap: 1.5,
      gridTemplateColumns: {
        xs: '1fr',
        md: '2fr 1fr'
      },
      gridAutoRows: 'minmax(min-content, max-content)',
      alignItems: 'start',
    },

    assignedSection: {
      display: 'grid',
      gap: 1.5,
      gridTemplateRows: 'repeat(2, 1fr)',
      height: '100%',
    }
  };

  if (loading) {
    return null;
  }

  const mainContent = (
    <WeatherProvider>
      <Paper elevation={0} sx={styles.welcomeCard}>
        <Typography 
          variant="h5"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(46, 125, 50, 0.1)',
          }}
        >
          {getGreeting()}, {user?.name || 'User'}
        </Typography>
        <WeatherAndClock currentTime={currentTime} />
      </Paper>

      <Box sx={styles.contentGrid}>
        <Box sx={styles.taskSection}>
          <MyTasks />
          <Projects />
        </Box>
        <Box sx={styles.assignedSection}>
          <AssignedByMeTasks />
          <AssignedToMeTasks />
        </Box>
      </Box>
    </WeatherProvider>
  );

  const sidebarContent = (
    <Sidebar 
      open={isOpen}
      onToggle={handleDrawerToggle}
      onLogout={handleLogout}
    />
  );

  const quickNotesContent = (
    <StickyNotes 
      isMinimized={isNotesMinimized}
      onToggleMinimize={() => setIsNotesMinimized(!isNotesMinimized)}
    />
  );

  const footerContent = (
    <OnlineUsersFooter isNotesMinimized={isNotesMinimized} />
  );

  return (
    <>
      <Navbar 
        open={isOpen}
        drawerWidth={DRAWER_WIDTH}
        onDrawerToggle={handleDrawerToggle}
      />
      <DashboardLayout
        isOpen={isOpen}
        isNotesMinimized={isNotesMinimized}
        sidebar={sidebarContent}
        quickNotes={quickNotesContent}
        footer={footerContent}
      >
        {mainContent}
      </DashboardLayout>
    </>
  );
};

export default Dashboard;