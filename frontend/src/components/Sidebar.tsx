import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Tooltip,
  Collapse,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import BackupIcon from '@mui/icons-material/Backup';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import logo from '../assets/images/logo.png';
import logoIcon from '../assets/images/logoIcon.png';

const DRAWER_WIDTH = 240;

const mainMenuItems = [
  { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { title: 'Departments', path: '/departments', icon: <BusinessIcon /> },
  { title: 'Users', path: '/users', icon: <PeopleIcon /> },
];

const adminMenuItems = [
  { title: 'Admin Dashboard', path: '/admin', icon: <DashboardIcon /> },
  { title: 'User Management', path: '/admin/users', icon: <PeopleIcon /> },
  { title: 'Department Management', path: '/admin/departments', icon: <BusinessIcon /> },
  { title: 'Activity Logs', path: '/admin/activity-logs', icon: <HistoryIcon /> },
  { title: 'System Settings', path: '/admin/settings', icon: <SettingsIcon /> },
  { title: 'Backup & Restore', path: '/admin/backup', icon: <BackupIcon /> },
];

interface SidebarProps {
  open: boolean;
  onToggleDrawer: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onToggleDrawer, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isCurrentPath = (path: string) => location.pathname === path;

  const toggleAdminMenu = () => {
    setAdminMenuOpen(!adminMenuOpen);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : 72,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : 72,
          boxSizing: 'border-box',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: 'none',
          transition: 'width 0.3s ease-in-out',
          overflowX: 'hidden',
        },
      }}
    >
      <Box 
        sx={{ 
          p: 2,
          pb: 0,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '64px',
          overflow: 'hidden',
          mb: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.3s ease-in-out',
            transform: open ? 'translateX(0)' : 'translateX(-100%)',
            position: 'absolute',
            left: '16px',
            width: open ? `${DRAWER_WIDTH - 48}px` : 'auto',
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="NSDD Logo"
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '50px',
              objectFit: 'contain',
              opacity: open ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.3s ease-in-out',
            transform: open ? 'translateX(100%)' : 'translateX(0)',
            opacity: open ? 0 : 1,
            position: 'absolute',
          }}
        >
          <Box
            component="img"
            src={logoIcon}
            alt="NSDD Icon"
            sx={{
              height: 30,
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </Box>
      </Box>

      <ListItem
        sx={{
          px: 2.5,
          justifyContent: 'center',
        }}
      >
        <IconButton 
          onClick={onToggleDrawer} 
          sx={{ 
            color: '#fff',
            transition: 'all 0.3s ease-in-out',
            transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        >
          <MenuIcon />
        </IconButton>
      </ListItem>
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />

      {/* Main Menu Items */}
      <List>
        {mainMenuItems.map((item) => (
          <ListItem
            key={item.path}
            button
            onClick={() => handleNavigation(item.path)}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              backgroundColor: isCurrentPath(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <Tooltip title={!open ? item.title : ''} placement="right">
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
            </Tooltip>
            {open && (
              <ListItemText 
                primary={item.title} 
                sx={{ 
                  opacity: open ? 1 : 0,
                  color: '#fff',
                }}
              />
            )}
          </ListItem>
        ))}

        {/* Admin Panel Menu */}
        <ListItem
          button
          onClick={toggleAdminMenu}
          sx={{
            minHeight: 48,
            justifyContent: open ? 'initial' : 'center',
            px: 2.5,
            backgroundColor: location.pathname.startsWith('/admin') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          <Tooltip title={!open ? 'Admin Panel' : ''} placement="right">
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <AdminPanelSettingsIcon />
            </ListItemIcon>
          </Tooltip>
          {open && (
            <>
              <ListItemText 
                primary="Admin Panel" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  color: '#fff',
                }}
              />
              {adminMenuOpen ? <ExpandLess sx={{ color: '#fff' }} /> : <ExpandMore sx={{ color: '#fff' }} />}
            </>
          )}
        </ListItem>

        {/* Admin Submenu */}
        <Collapse in={open && adminMenuOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {adminMenuItems.map((item) => (
              <ListItem
                key={item.path}
                button
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  pl: 4,
                  backgroundColor: isCurrentPath(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 3,
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.title} 
                  sx={{ 
                    color: '#fff',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', mt: 'auto' }} />

      {/* Logout Button */}
      <List>
        <ListItem
          button
          onClick={onLogout}
          sx={{
            minHeight: 48,
            justifyContent: open ? 'initial' : 'center',
            px: 2.5,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          <Tooltip title={!open ? 'Logout' : ''} placement="right">
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
          </Tooltip>
          {open && (
            <ListItemText 
              primary="Logout" 
              sx={{ 
                opacity: open ? 1 : 0,
                color: '#fff',
              }}
            />
          )}
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar; 