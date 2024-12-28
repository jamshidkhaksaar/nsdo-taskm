import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Collapse,
  ListItemButton,
  Box,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import BackupIcon from '@mui/icons-material/Backup';
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
  { 
    title: 'Admin Dashboard', 
    path: '/admin', 
    icon: <DashboardIcon />,
    description: 'Overview of system statistics and metrics'
  },
  { 
    title: 'User Management', 
    path: '/admin/users', 
    icon: <PeopleIcon />,
    description: 'Manage users, roles, and permissions'
  },
  { 
    title: 'Department Management', 
    path: '/admin/departments', 
    icon: <BusinessIcon />,
    description: 'Manage departments and their settings'
  },
  { 
    title: 'Activity Logs', 
    path: '/admin/activity-logs', 
    icon: <HistoryIcon />,
    description: 'View system activity and audit logs'
  },
  { 
    title: 'System Settings', 
    path: '/admin/settings', 
    icon: <SettingsIcon />,
    description: 'Configure system-wide settings'
  },
  { 
    title: 'Backup & Restore', 
    path: '/admin/backup', 
    icon: <BackupIcon />,
    description: 'Manage system backups and restoration'
  },
];

interface SidebarProps {
  open: boolean;
  onToggleDrawer: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onToggleDrawer, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [adminMenuOpen, setAdminMenuOpen] = useState(true);

  // Get role from user or localStorage - memoize the function
  const getRole = React.useCallback(() => {
    return user?.role || localStorage.getItem('user_role');
  }, [user?.role]);

  // Memoize isAdmin value
  const isAdmin = React.useMemo(() => {
    const role = getRole();
    return role === 'admin';
  }, [getRole]); // Now getRole is a stable reference

  // Debug logging
  useEffect(() => {
    const role = getRole();
    console.log('Sidebar render - User state:', {
      userExists: !!user,
      userData: user,
      role: role,
      isAdmin,
      adminMenuVisible: isAdmin,
      adminMenuOpen
    });
  }, [user, adminMenuOpen, isAdmin, getRole]); // Added getRole to dependencies

  // Set initial admin menu state
  useEffect(() => {
    if (isAdmin) {
      setAdminMenuOpen(true);
    }
  }, [isAdmin]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Admin menu section
  const adminMenuSection = isAdmin ? (
    <>
      <Divider sx={{ my: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => setAdminMenuOpen(!adminMenuOpen)}
          sx={{
            minHeight: 48,
            justifyContent: open ? 'initial' : 'center',
            px: 2.5,
            backgroundColor: isActive('/admin') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          }}
        >
          <ListItemIcon sx={{ color: '#fff', minWidth: 0, mr: open ? 3 : 'auto' }}>
            <AdminPanelSettingsIcon />
          </ListItemIcon>
          {open && (
            <>
              <ListItemText primary="Admin Panel" sx={{ color: '#fff' }} />
              {adminMenuOpen ? <ExpandLess sx={{ color: '#fff' }} /> : <ExpandMore sx={{ color: '#fff' }} />}
            </>
          )}
        </ListItemButton>
      </ListItem>
      <Collapse in={adminMenuOpen && open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {adminMenuItems.map((item) => (
            <Tooltip
              key={item.title}
              title={!open ? `${item.title}: ${item.description}` : ''}
              placement="right"
            >
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={isActive(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    pl: 4,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: '#fff', minWidth: 0, mr: open ? 3 : 'auto' }}>
                    {item.icon}
                  </ListItemIcon>
                  {open && <ListItemText primary={item.title} sx={{ color: '#fff' }} />}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Collapse>
    </>
  ) : null;

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 65,
        transition: 'width 0.2s',
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : 65,
          transition: 'width 0.2s',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: 'none',
          overflow: 'hidden',
        },
      }}
    >
      {/* Logo Section */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {open ? (
          <img 
            src={logo} 
            alt="Logo" 
            style={{ 
              height: '40px',
              transition: 'opacity 0.3s ease-in-out',
            }} 
          />
        ) : (
          <img 
            src={logoIcon} 
            alt="Icon" 
            style={{ 
              height: '30px',
              transition: 'opacity 0.3s ease-in-out',
            }} 
          />
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />

      {/* Main menu items */}
      <List>
        {mainMenuItems.map((item) => (
          <ListItem key={item.title} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isActive(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Tooltip title={!open ? item.title : ''} placement="right">
                <ListItemIcon sx={{ color: '#fff', minWidth: 0, mr: open ? 3 : 'auto' }}>
                  {item.icon}
                </ListItemIcon>
              </Tooltip>
              {open && <ListItemText primary={item.title} sx={{ color: '#fff' }} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Admin menu section */}
      {adminMenuSection}

      {/* Logout button */}
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', mt: 'auto' }} />
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
            <ListItemIcon sx={{ color: '#fff', minWidth: 0, mr: open ? 3 : 'auto' }}>
              <LogoutIcon />
            </ListItemIcon>
          </Tooltip>
          {open && <ListItemText primary="Logout" sx={{ color: '#fff' }} />}
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar; 