import React, { useState, useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';
import NotificationsMenu from '../components/layout/NotificationsMenu';
import { standardBackgroundStyle } from '../utils/backgroundStyles';

const DRAWER_WIDTH = 240;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [greeting, setGreeting] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isConnected, lastNotification, notifications } = useWebSocket(token);

  useEffect(() => {
    console.log('[AdminLayout] WebSocket Connected:', isConnected);
  }, [isConnected]);

  useEffect(() => {
    if (lastNotification) {
      console.log('[AdminLayout] New Notification Received:', lastNotification);
    }
  }, [lastNotification]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const handleLogout = async () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleDrawer = () => {
    // Implement drawer toggle logic if needed
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      ...standardBackgroundStyle
    }}>
      <Sidebar
        open={false}
        onToggleDrawer={toggleDrawer}
        onLogout={handleLogout}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: 16, right: 24 }}>
            <NotificationsMenu notifications={notifications} />
        </Box>

        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ mb: 4, color: 'white' }}>
            {greeting}, {user?.username || 'Admin'}
          </Typography>
          {children}
        </Container>
      </Box>
      
      <Footer open={true} drawerWidth={DRAWER_WIDTH} />
    </Box>
  );
};

export default AdminLayout; 