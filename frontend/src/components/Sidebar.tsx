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
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import logo from '../assets/images/logo.png';
import logoIcon from '../assets/images/logoIcon.png';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const DRAWER_WIDTH = 240;

const mainMenuItems = [
  { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { title: 'Tasks', path: '/tasks', icon: <AssignmentIcon /> },
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
  drawerWidth?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onToggleDrawer, onLogout, drawerWidth = DRAWER_WIDTH }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [adminMenuOpen, setAdminMenuOpen] = useState(true);
  const theme = useTheme();

  const isAdmin = React.useMemo(() => {
    const role = user?.role || localStorage.getItem('user_role');
    return role === 'admin';
  }, [user?.role]);

  const getMenuItemStyles = (isActive: boolean) => ({
    minHeight: 48,
    justifyContent: open ? 'initial' : 'center',
    px: 2.5,
    mx: 1,
    my: 0.5,
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      transform: 'translateX(5px)',
      color: '#fff',
    },
  });

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : 65,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 65,
          transition: 'width 0.3s ease',
          background: 'rgba(31, 41, 55, 0.8)',
          backdropFilter: 'blur(12px)',
          border: 'none',
          overflow: 'hidden',
          boxShadow: '4px 0 15px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
          },
        },
      }}
    >
      {/* Logo Section */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        mb: 2
      }}>
        {open ? (
          <img 
            src={logo} 
            alt="Logo" 
            style={{ 
              height: '40px',
              transition: 'opacity 0.3s ease-in-out',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }} 
          />
        ) : (
          <img 
            src={logoIcon} 
            alt="Icon" 
            style={{ 
              height: '30px',
              transition: 'opacity 0.3s ease-in-out',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }} 
          />
        )}
      </Box>

      {/* Main menu items */}
      <List>
        {mainMenuItems.map((item) => (
          <ListItem key={item.title} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={isActive(item.path)}
              sx={getMenuItemStyles(isActive(item.path))}
            >
              <Tooltip title={!open ? item.title : ''} placement="right">
                <ListItemIcon sx={{ 
                  color: 'inherit', 
                  minWidth: 0, 
                  mr: open ? 3 : 'auto',
                  transition: 'transform 0.2s ease',
                  transform: isActive(item.path) ? 'scale(1.1)' : 'scale(1)',
                }}>
                  {item.icon}
                </ListItemIcon>
              </Tooltip>
              {open && (
                <ListItemText 
                  primary={item.title} 
                  sx={{ 
                    opacity: 1,
                    '& .MuiListItemText-primary': {
                      fontWeight: isActive(item.path) ? 600 : 400,
                    }
                  }} 
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Admin menu section */}
      {isAdmin && (
        <>
          <Divider sx={{ 
            my: 1, 
            borderColor: 'rgba(255, 255, 255, 0.08)',
            mx: 2
          }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              sx={{
                ...getMenuItemStyles(isActive('/admin')),
                backgroundColor: adminMenuOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ 
                color: 'inherit', 
                minWidth: 0, 
                mr: open ? 3 : 'auto',
                transition: 'transform 0.2s ease',
              }}>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              {open && (
                <>
                  <ListItemText 
                    primary="Admin Panel" 
                    sx={{ 
                      '& .MuiListItemText-primary': {
                        fontWeight: adminMenuOpen ? 600 : 400,
                      }
                    }} 
                  />
                  {adminMenuOpen ? (
                    <ExpandLess sx={{ transition: 'transform 0.3s ease' }} />
                  ) : (
                    <ExpandMore sx={{ transition: 'transform 0.3s ease' }} />
                  )}
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
                      onClick={() => navigate(item.path)}
                      selected={isActive(item.path)}
                      sx={{
                        ...getMenuItemStyles(isActive(item.path)),
                        pl: open ? 4 : 2.5,
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: 'inherit', 
                        minWidth: 0, 
                        mr: open ? 3 : 'auto',
                        transition: 'transform 0.2s ease',
                        transform: isActive(item.path) ? 'scale(1.1)' : 'scale(1)',
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      {open && (
                        <ListItemText 
                          primary={item.title} 
                          sx={{ 
                            '& .MuiListItemText-primary': {
                              fontWeight: isActive(item.path) ? 600 : 400,
                              fontSize: '0.9rem',
                            }
                          }} 
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              ))}
            </List>
          </Collapse>
        </>
      )}

      {/* Logout button */}
      <Box sx={{ 
        mt: 'auto', 
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        p: 1
      }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={onLogout}
            sx={{
              ...getMenuItemStyles(false),
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main,
              },
            }}
          >
            <Tooltip title={!open ? 'Logout' : ''} placement="right">
              <ListItemIcon sx={{ 
                color: 'inherit', 
                minWidth: 0, 
                mr: open ? 3 : 'auto',
                transition: 'all 0.2s ease',
              }}>
                <LogoutIcon />
              </ListItemIcon>
            </Tooltip>
            {open && <ListItemText primary="Logout" />}
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 