import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import logo from '../assets/images/logo.png';
import logoIcon from '../assets/images/logoIcon.png';

const DRAWER_WIDTH = 240;

interface SidebarProps {
  open: boolean;
  onToggleDrawer: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onToggleDrawer, onLogout }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isMenuItemActive = (path: string): boolean => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  return (
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
          <Box sx={{ px: 2, pb: 2 }}>
            <ListItem
              button
              onClick={onToggleDrawer}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                background: 'rgba(67, 52, 129, 0.95)',
                borderRadius: '8px',
                mb: 1,
                '&:hover': {
                  background: 'rgba(67, 52, 129, 0.85)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <MenuIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Toggle Menu" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  color: '#fff',
                  '& .MuiTypography-root': {
                    fontWeight: 500,
                  },
                }} 
              />
            </ListItem>
          </Box>

          {/* Menu Items */}
          {[
            { path: '/dashboard', icon: <DashboardIcon />, text: 'Dashboard' },
            { path: '/departments', icon: <BusinessIcon />, text: 'Departments' },
            { path: '/users', icon: <PersonIcon />, text: 'Users' },
            { path: '/admin', icon: <AdminPanelSettingsIcon />, text: 'Admin Panel' },
          ].map((item) => (
            <Tooltip 
              key={item.path}
              title={!open ? item.text : ""} 
              placement="right"
            >
              <ListItem
                button
                onClick={() => {
                  navigate(item.path, { replace: true });
                }}
                selected={isMenuItemActive(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
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
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: open ? 1 : 0,
                    color: '#fff',
                  }} 
                />
              </ListItem>
            </Tooltip>
          ))}
        </List>

        {/* Logout */}
        <List sx={{ marginTop: 'auto' }}>
          <Tooltip title={!open ? "Logout" : ""} placement="right">
            <ListItem
              button
              onClick={onLogout}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
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
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  color: '#fff',
                }} 
              />
            </ListItem>
          </Tooltip>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 