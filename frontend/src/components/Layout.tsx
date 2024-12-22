import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import Navbar from './Navbar';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(true);
  const drawerWidth = 240;
  const collapsedWidth = 64;
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const menuItems = [
    { title: 'Menu', icon: <MenuIcon sx={{ fontSize: 24 }} />, onClick: handleDrawerToggle },
    { title: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 24 }} />, onClick: () => navigate('/dashboard') },
    { title: 'Departments', icon: <BusinessIcon sx={{ fontSize: 24 }} />, onClick: () => navigate('/departments') },
    { title: 'Users', icon: <PeopleIcon sx={{ fontSize: 24 }} />, onClick: () => navigate('/users') },
    { title: 'Settings', icon: <SettingsIcon sx={{ fontSize: 24 }} />, onClick: () => navigate('/settings') },
    { title: 'Admin Panel', icon: <AdminPanelSettingsIcon sx={{ fontSize: 24 }} />, onClick: () => navigate('/admin') },
    { title: 'Logout', icon: <LogoutIcon sx={{ fontSize: 24 }} />, onClick: () => navigate('/logout') }
  ];

  const listItemStyles = {
    height: 64,
    justifyContent: open ? 'initial' : 'center',
    px: 2,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  };

  const listItemIconStyles = {
    minWidth: 0,
    width: collapsedWidth,
    display: 'flex',
    justifyContent: 'center',
    color: 'inherit',
    mr: open ? 0 : 'auto',
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            boxSizing: 'border-box',
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            whiteSpace: 'nowrap',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ mt: 8 }} />
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => (
            <Tooltip 
              key={item.title}
              title={!open ? item.title : ''} 
              placement="right"
              enterDelay={500}
            >
              <ListItem disablePadding>
                <ListItemButton
                  onClick={item.onClick}
                  sx={listItemStyles}
                >
                  <ListItemIcon sx={listItemIconStyles}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title} 
                    sx={{ 
                      opacity: open ? 1 : 0,
                      ml: open ? 2 : 0,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Drawer>

      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Navbar 
          open={open} 
          drawerWidth={drawerWidth} 
          onDrawerToggle={handleDrawerToggle}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${open ? drawerWidth : collapsedWidth}px)` },
            ml: { sm: `${open ? drawerWidth : collapsedWidth}px` },
            mt: 8,
            transition: theme =>
              theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout; 