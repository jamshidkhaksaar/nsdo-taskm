import React, { useState } from 'react';
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
import AssessmentIcon from '@mui/icons-material/Assessment';
import DeleteIcon from '@mui/icons-material/Delete';
import MailIcon from '@mui/icons-material/Mail';
import SecurityIcon from '@mui/icons-material/Security';
import logo from '../assets/images/logo.png';
import logoIcon from '../assets/images/logoIcon.png';

// Define interface for menu items
interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  description?: string;
  onClick?: (navigate: any) => void;
}

const DRAWER_WIDTH = 240;

const mainMenuItems: MenuItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { title: 'Departments', path: '/departments', icon: <BusinessIcon /> },
  { title: 'Users', path: '/users', icon: <PeopleIcon /> },
  { title: 'Provinces', path: '/provinces', icon: <AssignmentIcon /> },
];

// Items visible only to Leadership and Admins
const managerMenuItems: MenuItem[] = [
  { title: 'Tasks Overview', path: '/tasks-overview', icon: <AssessmentIcon /> },
];

const adminMenuItems: MenuItem[] = [
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
    title: 'RBAC Management', 
    path: '/admin/rbac', 
    icon: <SecurityIcon />,
    description: 'Manage role-based access control, roles and permissions'
  },
  { 
    title: 'Department Management', 
    path: '/admin/departments', 
    icon: <BusinessIcon />,
    description: 'Manage departments and their settings'
  },
  {
    title: 'Province Management',
    path: '/admin/provinces',
    icon: <AssignmentIcon />,
    description: 'Manage provinces and assign departments'
  },
  { 
    title: 'Activity Logs', 
    path: '/admin/activity-logs', 
    icon: <HistoryIcon />,
    description: 'View system activity and audit logs'
  },
  { 
    title: 'Recycle Bin', 
    path: '/admin/recycle-bin', 
    icon: <DeleteIcon />,
    description: 'View and manage deleted tasks'
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
  {
    title: 'Email Configuration',
    path: '/admin/email-config',
    icon: <MailIcon />,
    description: 'Configure email settings and templates'
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

  const isAdmin = React.useMemo(() => {
    const role = user?.role || localStorage.getItem('user_role');
    return typeof role === 'string' && role.toUpperCase() === 'ADMIN';
  }, [user?.role]);

  const isManagerOrAdmin = React.useMemo(() => {
    const role = user?.role || localStorage.getItem('user_role');
    const upperRole = typeof role === 'string' ? role.toUpperCase() : '';
    return upperRole === 'ADMIN' || upperRole === 'LEADERSHIP';
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

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : 65,
        flexShrink: 0,
        transition: (theme) => theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: open ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
        }),
        zIndex: (theme) => theme.zIndex.appBar - 1,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 65,
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: open ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
          }),
          background: 'rgba(31, 41, 55, 0.8)',
          backdropFilter: 'blur(12px)',
          border: 'none',
          overflowX: 'hidden',
          overflowY: 'hidden',
          boxShadow: '4px 0 15px rgba(0, 0, 0, 0.1)',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
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

      {/* Scrollable menu container */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
          },
        }}
      >
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

        {/* Leadership menu section - visible to Leadership and Admins */}
        {isManagerOrAdmin && (
          <>
            <Divider sx={{ 
              my: 1, 
              borderColor: 'rgba(255, 255, 255, 0.08)',
              mx: 2
            }} />
            <List>
              {managerMenuItems.map((item) => (
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
          </>
        )}

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
            <Collapse in={open && adminMenuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {adminMenuItems.map((item) => (
                  <ListItem key={item.title} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        console.log('Navigating to:', item.path);
                        console.log('Menu item clicked:', item.title);
                        if (item.title === 'Email Configuration') {
                          console.log('Email Configuration clicked - path:', item.path);
                        }
                        if (item.onClick) {
                          item.onClick(navigate);
                        } else {
                          navigate(item.path);
                        }
                      }}
                      selected={isActive(item.path)}
                      sx={{
                        ...getMenuItemStyles(isActive(item.path)),
                        pl: open ? 4 : 2.5,
                      }}
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
            </Collapse>
          </>
        )}
      </Box>

      {/* Logout button at bottom */}
      <Box sx={{ 
        mt: 'auto', 
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        py: 1.5,
        px: 1
      }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={onLogout}
            sx={{
              ...getMenuItemStyles(false),
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                transform: 'translateX(5px)',
                color: '#ff5252',
              },
            }}
          >
            <Tooltip title={!open ? 'Logout' : ''} placement="right">
              <ListItemIcon sx={{ 
                color: 'inherit', 
                minWidth: 0, 
                mr: open ? 3 : 'auto',
              }}>
                <LogoutIcon />
              </ListItemIcon>
            </Tooltip>
            {open && (
              <ListItemText 
                primary="Logout" 
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: 500,
                  }
                }}
              />
            )}
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 