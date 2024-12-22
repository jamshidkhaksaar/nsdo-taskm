import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  styled,
  alpha,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import logo from '../assets/images/logo.png';
import logoIcon from '../assets/images/logoIcon.png';

const RotatingImage = styled('img')<{ isrotating: string }>(({ isrotating }) => ({
  transition: 'transform 0.3s ease-in-out',
  transform: isrotating === 'true' ? 'rotate(360deg)' : 'rotate(0deg)',
}));

const StyledListItemIcon = styled(ListItemIcon, {
  shouldForwardProp: prop => prop !== 'isActive',
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  minWidth: 0,
  justifyContent: 'center',
  color: isActive ? '#4CAF50' : alpha('#4CAF50', 0.7),
  transition: 'color 0.2s ease',
}));

const StyledListItemText = styled(ListItemText, {
  shouldForwardProp: prop => prop !== 'isActive',
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  '& .MuiListItemText-primary': {
    color: isActive ? '#4CAF50' : alpha('#4CAF50', 0.7),
    fontWeight: isActive ? 600 : 400,
    transition: 'color 0.2s ease, font-weight 0.2s ease',
  },
}));

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRotating, setIsRotating] = React.useState(false);

  React.useEffect(() => {
    setIsRotating(true);
    const timer = setTimeout(() => setIsRotating(false), 300);
    return () => clearTimeout(timer);
  }, [open]);

  const menuItems = [
    { icon: DashboardIcon, label: 'Dashboard', path: '/dashboard' },
    { icon: BusinessIcon, label: 'Departments', path: '/departments' },
    { icon: PersonIcon, label: 'Users', path: '/users' },
    { icon: FolderIcon, label: 'My Tasks', path: '/tasks' },
  ];

  const bottomMenuItems = [
    { icon: SettingsIcon, label: 'Settings', path: '/settings' },
    { icon: AdminPanelSettingsIcon, label: 'Admin Panel', path: '/admin' },
    { icon: LogoutIcon, label: 'Logout', onClick: onLogout },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%',
        }}>
          <RotatingImage
            src={open ? logo : logoIcon}
            alt="Logo"
            style={{ 
              height: open ? 40 : 32,
              width: 'auto',
              maxWidth: open ? 150 : 32,
              objectFit: 'contain',
            }}
            isrotating={(!open && isRotating).toString()}
          />
        </Box>
      </Box>

      {/* Main Menu Items */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={!open ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    bgcolor: isActive ? alpha('#4CAF50', 0.08) : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? alpha('#4CAF50', 0.12)
                        : alpha('#4CAF50', 0.08),
                    },
                  }}
                >
                  <StyledListItemIcon
                    isActive={isActive}
                    sx={{ mr: open ? 2 : 'auto' }}
                  >
                    <Icon />
                  </StyledListItemIcon>
                  {open && (
                    <StyledListItemText 
                      primary={item.label}
                      isActive={isActive}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom Menu Items */}
      <List sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
        {bottomMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path ? location.pathname === item.path : false;
          return (
            <ListItem key={item.label} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={!open ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={item.onClick || (() => navigate(item.path!))}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    bgcolor: isActive ? alpha('#4CAF50', 0.08) : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? alpha('#4CAF50', 0.12)
                        : alpha('#4CAF50', 0.08),
                    },
                  }}
                >
                  <StyledListItemIcon
                    isActive={isActive}
                    sx={{ mr: open ? 2 : 'auto' }}
                  >
                    <Icon />
                  </StyledListItemIcon>
                  {open && (
                    <StyledListItemText 
                      primary={item.label}
                      isActive={isActive}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar; 