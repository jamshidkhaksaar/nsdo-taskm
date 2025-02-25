import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  Button,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface DashboardHeaderProps {
  notifications: number;
  onNotificationClick: () => void;
  showWidget: boolean;
  onToggleWidget: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  notifications,
  onNotificationClick,
  showWidget,
  onToggleWidget,
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        mb: { xs: 1, sm: 2 },
        flexWrap: 'wrap',
      }}
    >
      <IconButton
        onClick={onNotificationClick}
        sx={{
          color: '#fff',
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
          badgeContent={notifications} 
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

      <IconButton
        onClick={handleProfileClick}
        sx={{
          color: '#fff',
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

      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleProfileClose}
        onClick={handleProfileClose}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
            color: '#fff',
            mt: 1.5,
            '& .MuiMenuItem-root': {
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <AccountCircleIcon sx={{ color: '#fff' }} />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <SettingsIcon sx={{ color: '#fff' }} />
          </ListItemIcon>
          Settings
        </MenuItem>
      </Menu>

      <Button
        onClick={onToggleWidget}
        startIcon={showWidget ? <ExpandLessIcon /> : <ExpandLessIcon />}
        sx={{
          color: '#fff',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '20px',
          padding: { xs: '4px 8px', sm: '4px 12px' },
          minWidth: 'auto',
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.2)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {showWidget ? 'Hide' : 'Show'}
      </Button>
    </Box>
  );
};

export default DashboardHeader; 