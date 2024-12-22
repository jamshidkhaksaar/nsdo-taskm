import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  useTheme,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  currentTask?: string;
  status: 'online' | 'busy' | 'away';
  lastActive?: string;
}

interface OnlineUsersFooterProps {
  isNotesMinimized: boolean;
}

const OnlineUsersFooter: React.FC<OnlineUsersFooterProps> = ({ isNotesMinimized }) => {
  const theme = useTheme();

  // Mock data - replace with real data from your backend
  const onlineUsers: OnlineUser[] = [
    { id: '1', name: 'John Doe', currentTask: 'Working on Dashboard UI', status: 'online', lastActive: '2 min ago' },
    { id: '2', name: 'Jane Smith', currentTask: 'Reviewing PRs', status: 'busy', lastActive: '5 min ago' },
    { id: '3', name: 'Mike Johnson', currentTask: 'Bug fixes', status: 'away', lastActive: '15 min ago' },
    { id: '4', name: 'Sarah Wilson', currentTask: 'Adding new features', status: 'online', lastActive: 'just now' },
  ];

  const getStatusColor = (status: OnlineUser['status']) => {
    switch (status) {
      case 'online':
        return theme.palette.success.main;
      case 'busy':
        return theme.palette.warning.main;
      case 'away':
        return theme.palette.grey[400];
      default:
        return theme.palette.grey[400];
    }
  };

  const getStatusLabel = (status: OnlineUser['status']) => {
    switch (status) {
      case 'online':
        return 'Active';
      case 'busy':
        return 'Busy';
      case 'away':
        return 'Away';
      default:
        return 'Offline';
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
      {/* Activity Feed Section */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          overflow: 'hidden',
          height: '100%',
          borderRight: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.text.secondary,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 'fit-content',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        >
          <AccessTimeIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
          Recent Activity
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflow: 'auto',
            whiteSpace: 'nowrap',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {onlineUsers.map((user) => (
            <Box
              key={user.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 'fit-content',
              }}
            >
              <Avatar
                src={user.avatar}
                sx={{
                  width: 24,
                  height: 24,
                  border: `1.5px solid ${getStatusColor(user.status)}`,
                }}
              >
                {user.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    lineHeight: 1.1,
                    fontSize: '0.75rem',
                  }}
                >
                  {user.name}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    display: 'block',
                    lineHeight: 1.1,
                    fontSize: '0.7rem',
                  }}
                >
                  {user.currentTask}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Online Users Section */}
      <Box
        sx={{
          width: 'auto',
          minWidth: 240,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          overflow: 'hidden',
          height: '100%',
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.text.secondary,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 'fit-content',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        >
          <GroupIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
          Online
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflow: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {onlineUsers.map((user) => (
            <Chip
              key={user.id}
              avatar={
                <Avatar
                  src={user.avatar}
                  sx={{
                    width: 18,
                    height: 18,
                    border: `1.5px solid ${getStatusColor(user.status)}`,
                  }}
                >
                  {user.name.charAt(0)}
                </Avatar>
              }
              label={getStatusLabel(user.status)}
              size="small"
              sx={{
                bgcolor: theme.palette.action.hover,
                borderRadius: '10px',
                height: 20,
                '& .MuiChip-label': {
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  px: 1,
                },
                '& .MuiChip-avatar': {
                  width: 16,
                  height: 16,
                  marginLeft: '2px',
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default OnlineUsersFooter; 