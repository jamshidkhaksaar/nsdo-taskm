import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Button,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import UpdateIcon from '@mui/icons-material/Update';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CloseIcon from '@mui/icons-material/Close';
import { formatDistanceToNow } from 'date-fns';
import { NotificationService, Notification } from '../../services/notification';
import { useNavigate } from 'react-router-dom';

const NotificationsMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await NotificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prevNotifications =>
        prevNotifications.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      NotificationService.markAsRead(notification.id);
    }
    
    if (notification.task_id) {
      navigate(`/tasks/${notification.task_id}`);
    }
    
    handleMenuClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <AssignmentIcon color="primary" />;
      case 'task_status_changed':
        return <UpdateIcon color="info" />;
      case 'collaborator_added':
        return <PersonAddIcon color="secondary" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleMenuOpen}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
          }
        }}
      >
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary">
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.map(notification => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.read ? 'inherit' : 'rgba(25, 118, 210, 0.05)',
                '&:hover': {
                  backgroundColor: notification.read ? undefined : 'rgba(25, 118, 210, 0.08)',
                },
              }}
            >
              <ListItemIcon>
                {getNotificationIcon(notification.type)}
              </ListItemIcon>
              <ListItemText
                primary={notification.message}
                secondary={formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: notification.read ? 'textPrimary' : 'primary',
                  fontWeight: notification.read ? 'normal' : 'medium',
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                }}
              />
              {!notification.read && (
                <IconButton
                  size="small"
                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                  sx={{ ml: 1 }}
                >
                  <CheckCircleIcon fontSize="small" color="action" />
                </IconButton>
              )}
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationsMenu; 