import React from 'react';
import { Popover, Box, Typography, List, ListItem, ListItemText, Divider, Button, CircularProgress } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { Notification } from '../services/notification';
import { markNotificationAsRead, markAllUserNotificationsAsRead, closeNotificationPanel } from '../store/slices/notificationsSlice';

interface NotificationPanelProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ anchorEl, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: notifications,
    isPanelOpen,
    loading,
    error
  } = useSelector((state: RootState) => state.notifications);

  console.log('[NotificationPanel] Rendering. Props anchorEl:', anchorEl, 'Redux isPanelOpen:', isPanelOpen);

  const handleMarkAsRead = (notificationId: number) => {
    dispatch(markNotificationAsRead(notificationId));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllUserNotificationsAsRead());
  };

  // if (!isPanelOpen) { // Temporarily comment out to see if Popover gets rendered with open=false
  //   console.log('[NotificationPanel] Not rendering because isPanelOpen is false.');
  //   return null;
  // }

  console.log('[NotificationPanel] Attempting to render Popover. open prop will be:', Boolean(anchorEl), 'isPanelOpen from Redux:', isPanelOpen);

  return (
    <Popover
      open={Boolean(anchorEl) && isPanelOpen} // Ensure both conditions are met for Popover to be open
      anchorEl={anchorEl}
      onClose={onClose} // Use the onClose from props, which should dispatch closeNotificationPanel
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          width: 360,
          maxHeight: 400,
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: '8px',
          background: 'rgba(40, 50, 70, 0.9)', // Darker, slightly transparent
          backdropFilter: 'blur(10px)',
          color: '#e0e0e0',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{color: '#fff'}}>Notifications</Typography>
        {notifications.some(n => !n.read) && (
          <Button size="small" onClick={handleMarkAllRead} sx={{color: '#bbdefb'}}>
            Mark all as read
          </Button>
        )}
      </Box>
      <Divider sx={{borderColor: 'rgba(255,255,255,0.1)'}} />
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <CircularProgress size={24} color="inherit" />
          <Typography sx={{ml: 1}}>Loading...</Typography>
        </Box>
      )}
      {error && (
        <Box sx={{ p: 2, color: '#ffcdd2' }}>
          <Typography>Error: {error}</Typography>
        </Box>
      )}
      {!loading && !error && notifications.length === 0 && (
        <Typography sx={{ p: 2, textAlign: 'center', color: '#9e9e9e' }}>You have no notifications.</Typography>
      )}
      {!loading && !error && notifications.length > 0 && (
        <List disablePadding>
          {notifications.map((notification) => (
            <ListItem 
              key={notification.id} 
              divider 
              sx={{
                backgroundColor: notification.read ? 'transparent' : 'rgba(255,255,255,0.05)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                },
                opacity: notification.read ? 0.7 : 1,
              }}
            >
              <ListItemText
                primary={notification.message}
                secondary={new Date(notification.created_at).toLocaleString()}
                primaryTypographyProps={{ sx: { fontWeight: notification.read ? 'normal' : 'bold', color: notification.read ? '#bdbdbd' : '#fff' } }}
                secondaryTypographyProps={{ sx: { color: '#9e9e9e' }}}
              />
              {!notification.read && (
                <Button size="small" onClick={() => handleMarkAsRead(notification.id)} sx={{ml: 1, color: '#80cbc4'}}>
                  Mark read
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Popover>
  );
};

export default NotificationPanel; 