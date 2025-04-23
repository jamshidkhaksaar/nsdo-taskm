import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AppRoutes } from './routes';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ProtectedRoute from './routes/ProtectedRoute';
import DepartmentsPage from './pages/Departments';
import UsersPage from './pages/Users';
import ProvincesPage from './pages/ProvincesPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import React, { Suspense } from 'react';

// Explicitly import Login for fallback
import Login from './pages/Login';

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route path="/login" element={<Suspense fallback={<div>Loading login page...</div>}><Login /></Suspense>} />
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
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/provinces" element={<ProvincesPage />} />
          <Route path="*" element={<AppRoutes />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
};

export default App;

