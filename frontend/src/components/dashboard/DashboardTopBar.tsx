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
  Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import { SxProps, Theme } from '@mui/material/styles';
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
  onToggleTopWidgets: () => void;
  topWidgetsVisible: boolean;
  rightSidebarVisible?: boolean;
  onToggleRightSidebar?: () => void;
  onToggleQuickNotes?: () => void;
  showQuickNotes?: boolean;
  showQuickNotesButton?: boolean;
  sx?: SxProps<Theme>;
}

const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  username,
  notificationCount,
  onToggleSidebar,
  onNotificationClick,
  onToggleQuickNotes,
  showQuickNotes,
  onLogout,
  onProfileClick,
  onSettingsClick,
  onHelpClick,
  onToggleTopWidgets,
  rightSidebarVisible,
  onToggleRightSidebar,
  sx,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        ...sx,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left section */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mr: { xs: 1, sm: 2 } }}>
          {/* Sidebar Toggle */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle sidebar"
            onClick={onToggleSidebar}
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
              mr: 1,
            }}
          >
            <MenuIcon />
          </IconButton>
          {/* App Title */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              display: { xs: 'none', sm: 'block' },
              color: 'white',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Task Manager
          </Typography>
        </Box>

        {/* Right section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              onClick={onToggleQuickNotes ? onToggleQuickNotes : () => {}}
              variant="outlined"
              size="small"
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {showQuickNotes ? 'Hide Quick Notes' : 'Show Quick Notes'}
            </Button>

          <IconButton color="inherit" onClick={onProfileClick}>
            <AccountCircleIcon />
          </IconButton>
          <IconButton color="inherit" onClick={onSettingsClick}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardTopBar;