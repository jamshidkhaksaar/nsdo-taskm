import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AppRoutes } from './routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWebSocketNotifications } from './hooks/useWebSocketNotifications';
import { SnackbarProvider } from 'notistack';

const App: React.FC = () => {
  // Call the hook to establish connection and listen for notifications
  useWebSocketNotifications();

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={5000}
      >
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
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;

