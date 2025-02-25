import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Box,
  InputBase,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { alpha } from '@mui/material/styles';

interface DashboardTopBarProps {
  username: string;
  notificationCount: number;
  onToggleSidebar: () => void;
  onNotificationClick: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onHelpClick: () => void;
}

const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  username,
  notificationCount,
  onToggleSidebar,
  onNotificationClick,
  onLogout,
  onProfileClick,
  onSettingsClick,
  onHelpClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileMenuClick = () => {
    handleMenuClose();
    onProfileClick();
  };

  const handleSettingsMenuClick = () => {
    handleMenuClose();
    onSettingsClick();
  };

  const handleLogoutMenuClick = () => {
    handleMenuClose();
    onLogout();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Implement search functionality
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left section */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle sidebar"
            onClick={onToggleSidebar}
            sx={{ 
              mr: 2, 
              color: 'white',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.05)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          {!isMobile && (
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: 'none', sm: 'block' }, color: 'white', fontWeight: 600 }}
            >
              Task Manager
            </Typography>
          )}
        </Box>

        {/* Search bar */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            position: 'relative',
            borderRadius: theme.shape.borderRadius,
            backgroundColor: alpha('#fff', 0.1),
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            '&:hover': {
              backgroundColor: alpha('#fff', 0.15),
            },
            marginRight: theme.spacing(2),
            marginLeft: 0,
            width: '100%',
            maxWidth: '400px',
            [theme.breakpoints.down('sm')]: {
              display: 'none',
            },
          }}
        >
          <Box sx={{ padding: theme.spacing(0, 2), height: '100%', position: 'absolute', display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ color: 'white' }} />
          </Box>
          <InputBase
            placeholder="Search tasks, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              color: 'white',
              padding: theme.spacing(1, 1, 1, 0),
              paddingLeft: `calc(1em + ${theme.spacing(4)})`,
              transition: theme.transitions.create('width'),
              width: '100%',
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.7)',
                opacity: 1,
              },
            }}
          />
        </Box>

        {/* Right section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Help button */}
          <Tooltip title="Help & Resources">
            <IconButton
              color="inherit"
              onClick={onHelpClick}
              sx={{
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={onNotificationClick}
              sx={{
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Badge 
                badgeContent={notificationCount} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    background: '#ff3c7d',
                    color: '#fff',
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User profile */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!isMobile && (
              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  mr: 1,
                  display: { xs: 'none', md: 'block' },
                }}
              >
                {username}
              </Typography>
            )}
            <Tooltip title="Account settings">
              <IconButton
                edge="end"
                onClick={handleProfileMenuOpen}
                sx={{
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'transparent',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <AccountCircleIcon />
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          {/* User menu */}
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
                color: 'white',
                minWidth: '200px',
                '& .MuiMenuItem-root': {
                  padding: '10px 16px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfileMenuClick}>
              <ListItemIcon>
                <AccountCircleIcon sx={{ color: 'white' }} />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleSettingsMenuClick}>
              <ListItemIcon>
                <SettingsIcon sx={{ color: 'white' }} />
              </ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogoutMenuClick}>
              <ListItemIcon>
                <LogoutIcon sx={{ color: 'white' }} />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardTopBar; 