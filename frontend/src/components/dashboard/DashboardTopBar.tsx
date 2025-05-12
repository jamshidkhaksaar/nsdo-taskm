import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Button,
  Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { SxProps, Theme } from '@mui/material/styles';
import { keyframes } from '@mui/system';

// Define keyframes for animation
const ringAnimation = keyframes`
  0% { transform: rotate(0); }
  10% { transform: rotate(30deg); }
  20% { transform: rotate(-28deg); }
  30% { transform: rotate(34deg); }
  40% { transform: rotate(-32deg); }
  50% { transform: rotate(30deg); }
  60% { transform: rotate(-28deg); }
  70% { transform: rotate(34deg); }
  80% { transform: rotate(-32deg); }
  90% { transform: rotate(30deg); }
  100% { transform: rotate(0); }
`;

interface DashboardTopBarProps {
  username: string;
  notificationCount: number;
  onToggleSidebar: () => void;
  onNotificationClick: (event: React.MouseEvent<HTMLElement>) => void;
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
  showQuickNotesButton,
}) => {
  // const theme = useTheme(); // Unused

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
          {showQuickNotesButton && (
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
          )}

          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={(event: React.MouseEvent<HTMLElement>) => {
                console.log('[DashboardTopBar] MUI IconButton NATIVE onClick fired!');
                console.log('[DashboardTopBar] Event target:', event.target, 'Current target:', event.currentTarget);
                console.log('[DashboardTopBar] Props.onNotificationClick function:', onNotificationClick);
                if (onNotificationClick) {
                  onNotificationClick(event);
                }
              }}
              sx={{
                transition: 'all 0.2s ease-in-out',
                animation: notificationCount > 0 ? `${ringAnimation} 1.5s ease-in-out infinite` : 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.1)',
                },
              }}
            >
              <Badge badgeContent={notificationCount} color="error" overlap="circular">
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Profile">
            <IconButton
              color="inherit"
              onClick={onProfileClick}
              sx={{
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.1)',
                },
              }}
            >
              <PersonOutlineIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton
              color="inherit"
              onClick={onSettingsClick}
              sx={{
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.1)',
                },
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardTopBar;