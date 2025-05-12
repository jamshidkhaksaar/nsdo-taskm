import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AppRoutes } from './routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWebSocketNotifications } from './hooks/useWebSocketNotifications';
import { SnackbarProvider } from 'notistack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { fetchUserNotifications, openNotificationPanel, closeNotificationPanel, markAllUserNotificationsAsRead } from './store/slices/notificationsSlice';
import NotificationPanel from './components/NotificationPanel';
import { selectIsAuthenticated } from './store/slices/authSlice';
import { NotificationProvider } from './context/NotificationContext';

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { isPanelOpen, unreadCount } = useSelector((state: RootState) => state.notifications);
  
  // Call the hook to establish connection and listen for notifications
  useWebSocketNotifications();

  // State for Popover anchor element
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserNotifications());
    }
  }, [isAuthenticated, dispatch]);

  const handleNotificationBellClick = (event: React.MouseEvent<HTMLElement>) => {
    console.log('[App.tsx] handleNotificationBellClick triggered. Event target:', event.currentTarget);
    setNotificationAnchorEl(event.currentTarget);
    dispatch(openNotificationPanel());
    console.log('[App.tsx] Dispatched openNotificationPanel. Current unreadCount:', unreadCount);
    if (unreadCount > 0) {
      // Consider dispatching markAllUserNotificationsAsRead() here or inside the panel itself
      // For now, let's log to see if we reach here
      console.log('[App.tsx] Unread count is > 0, potentially mark all as read here.');
    }
  };

  const handleNotificationPanelClose = () => {
    setNotificationAnchorEl(null);
    dispatch(closeNotificationPanel());
  };

  // Pass handleNotificationBellClick down through context or props to where DashboardTopBar is rendered
  // For now, assume AppRoutes or components within it will eventually provide it to DashboardTopBar
  // This might require a React Context if props drilling becomes too deep.

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={5000}
      >
        <NotificationProvider value={{ handleNotificationBellClick }}>
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored" 
          />
          <AppRoutes />
          <NotificationPanel 
            anchorEl={notificationAnchorEl} 
            onClose={handleNotificationPanelClose} 
          />
        </NotificationProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;

