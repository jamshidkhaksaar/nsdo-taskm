import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import {
  Login,
  Dashboard,
  Departments,
  Users,
  NotFound,
} from './pages';
import {
  AdminDashboard,
  UserManagement,
  DepartmentManagement,
  ActivityLogs,
  SystemSettings,
  BackupRestore,
} from './pages/admin';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

const App: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Protected Route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
  };

  // Admin Route wrapper
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const isAdmin = user?.role === 'admin' || localStorage.getItem('user_role') === 'admin';
    return isAuthenticated && isAdmin ? (
      <>{children}</>
    ) : (
      <Navigate to="/dashboard" />
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/departments"
          element={<ProtectedRoute><Departments /></ProtectedRoute>}
        />
        <Route
          path="/users"
          element={<ProtectedRoute><Users /></ProtectedRoute>}
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={<AdminRoute><AdminDashboard /></AdminRoute>}
        />
        <Route
          path="/admin/users"
          element={<AdminRoute><UserManagement /></AdminRoute>}
        />
        <Route
          path="/admin/departments"
          element={<AdminRoute><DepartmentManagement /></AdminRoute>}
        />
        <Route
          path="/admin/activity-logs"
          element={<AdminRoute><ActivityLogs /></AdminRoute>}
        />
        <Route
          path="/admin/settings"
          element={<AdminRoute><SystemSettings /></AdminRoute>}
        />
        <Route
          path="/admin/backup"
          element={<AdminRoute><BackupRestore /></AdminRoute>}
        />

        {/* Redirect root to dashboard */}
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
