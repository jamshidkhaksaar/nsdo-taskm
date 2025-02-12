import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Sidebar from './Sidebar';
import Footer from './Footer';

const DRAWER_WIDTH = 240;

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(true);
  const theme = useTheme();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        '&::before': {
          content: '""',
          position: 'fixed',
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
      <Sidebar
        open={open}
        onToggleDrawer={toggleDrawer}
        onLogout={() => {}}
        drawerWidth={DRAWER_WIDTH}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          position: 'relative',
          zIndex: 1,
          paddingLeft: open ? `${DRAWER_WIDTH + 16}px` : '73px',
          transition: theme.transitions.create('padding-left', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
      <Footer open={open} drawerWidth={DRAWER_WIDTH} />
    </Box>
  );
};

export default AdminLayout; 