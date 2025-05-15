import React, { useState, useCallback, useEffect } from 'react';
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

// Define required permissions for specific items
const PERMISSIONS = {
  TASKS_OVERVIEW: 'page:view:tasks_overview',
  ADMIN_PANEL: 'page:view:admin_dashboard', // Example for admin panel access
  // Add other permission keys as needed
};

const mainMenuItems: MenuItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { title: 'Departments', path: '/departments', icon: <BusinessIcon /> },
  { title: 'Users', path: '/users', icon: <PeopleIcon /> },
  { title: 'Provinces', path: '/provinces', icon: <AssignmentIcon /> },
];

// Separated item that requires specific permission
const tasksOverviewItem: MenuItem = 
  { title: 'Tasks Overview', path: '/tasks-overview', icon: <AssessmentIcon /> };

// Items visible only to Leadership and Admins
const managerMenuItems: MenuItem[] = [
  // { title: 'Tasks Overview', path: '/tasks-overview', icon: <AssessmentIcon /> }, // Removed duplicate
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
    title: 'Task Management',
    path: '/admin/task-management', 
    icon: <SettingsIcon />,
    description: 'Manage system tasks, completed tasks, and cleanup operations'
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
  
  // --- NEW DEBUG LOG --- 
  console.log("[Sidebar] Raw user object from Redux store:", JSON.stringify(user, null, 2));

  const [adminMenuOpen, setAdminMenuOpen] = useState(true);

  // Memoize user permissions for efficiency
  const userPermissions = React.useMemo(() => {
    // Prioritize the new user.permissions string array
    if (user && Array.isArray(user.permissions)) {
      return user.permissions;
    }
    // Fallback to the older structure if user.permissions is not available
    if (user?.role && typeof user.role === 'object' && Array.isArray((user.role as any).permissions)) {
      return (user.role as any).permissions.map((p: any) => p.name).filter((name:any) => !!name);
    }
    return []; // Return empty array if no permissions found
  }, [user]);

  // --- DEBUG LOG --- 
  console.log("[Sidebar] User Permissions Loaded:", userPermissions);

  // Helper function to check permission
  const userHasPermission = useCallback((permissionName: string) => {
    const hasPerm = userPermissions.includes(permissionName);
    // --- DEBUG LOG --- 
    // console.log(`[Sidebar] Checking permission: ${permissionName} -> ${hasPerm}`); // Log every check (can be verbose)
    return hasPerm;
  }, [userPermissions]);

  // Determine if Admin panel itself should be shown
  const canViewAdminPanel = React.useMemo(() => {
    const hasAdminDashboardPerm = userHasPermission(PERMISSIONS.ADMIN_PANEL);
    // --- DEBUG LOG --- 
    console.log(`[Sidebar] Has '${PERMISSIONS.ADMIN_PANEL}' permission?`, hasAdminDashboardPerm);
    
    // Simplify logic: Primarily rely on the specific dashboard permission
    // We can add more complex logic later if needed, but let's ensure the basic check works.
    // const hasAnyAdminPagePerm = adminMenuItems.some(item => userHasPermission(item.path.replace('/', ':').replace('/admin', 'page:view')));
    // console.log(`[Sidebar] Has *any* inferred admin page permission?`, hasAnyAdminPagePerm);
    
    return hasAdminDashboardPerm; // Let's ONLY check for the specific admin dashboard permission for now

  }, [userHasPermission]);
  
  // --- DEBUG LOG --- 
  console.log("[Sidebar] Calculated canViewAdminPanel:", canViewAdminPanel);

  // Toggle Admin Menu
  const handleAdminMenuClick = () => {
    setAdminMenuOpen(!adminMenuOpen);
  };
  
  // Initialize adminMenuOpen based on whether the current path is within admin
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setAdminMenuOpen(true);
    } else {
      // Optional: close it if navigating away from admin pages
      // setAdminMenuOpen(false);
    }
  }, [location.pathname]);

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

  const renderMenuItem = (item: MenuItem, key: string | number) => {
    const active = isActive(item.path);
    return (
      <Tooltip title={open ? '' : item.title} placement="right" key={key}>
        <ListItemButton
          onClick={() => item.onClick ? item.onClick(navigate) : navigate(item.path)}
          sx={getMenuItemStyles(active)}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: 'inherit' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.title} sx={{ opacity: open ? 1 : 0, color: 'inherit' }} />
        </ListItemButton>
      </Tooltip>
    );
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
          {mainMenuItems.map((item) => renderMenuItem(item, item.title))}
          
          {/* Conditionally render Tasks Overview based on permission */}
          {userHasPermission(PERMISSIONS.TASKS_OVERVIEW) && renderMenuItem(tasksOverviewItem, tasksOverviewItem.title)}
        </List>

        {/* Leadership menu section - visible to Leadership and Admins */}
        {userHasPermission(PERMISSIONS.TASKS_OVERVIEW) && (
          <>
            <Divider sx={{ 
              my: 1, 
              borderColor: 'rgba(255, 255, 255, 0.08)',
              mx: 2
            }} />
            <List>
              {managerMenuItems.map((item) => renderMenuItem(item, item.title))}
            </List>
          </>
        )}

        {/* Admin menu section */}
        {canViewAdminPanel && (
          <>
            <Divider sx={{ 
              my: 1, 
              borderColor: 'rgba(255, 255, 255, 0.08)',
              mx: 2
            }} />
            <Tooltip title={open ? '' : 'Admin Panel'} placement="right">
                <ListItemButton onClick={handleAdminMenuClick} sx={getMenuItemStyles(location.pathname.startsWith('/admin'))}>
                    <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: 'inherit' }}>
                        <AdminPanelSettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Admin Panel" sx={{ opacity: open ? 1 : 0, color: 'inherit' }} />
                    {open ? (adminMenuOpen ? <ExpandLess /> : <ExpandMore />) : null}
                </ListItemButton>
            </Tooltip>
            <Collapse in={adminMenuOpen && open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: open ? 2 : 0 }}>
                  {adminMenuItems.map((item) => renderMenuItem(item, item.title))} 
                  {/* TODO: Add permission checks for individual admin items if needed */}
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