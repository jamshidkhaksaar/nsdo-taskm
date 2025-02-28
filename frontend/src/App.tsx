import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AppRoutes } from './routes';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ProtectedRoute from './routes/ProtectedRoute';
import ConnectionStatus from './components/ConnectionStatus';

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<AppRoutes />} />
        </Routes>
        <ConnectionStatus position="bottom-right" />
      </ThemeProvider>
    </Router>
  );
};

export default App;
