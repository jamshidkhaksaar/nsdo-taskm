import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import Departments from './pages/Departments';
import Users from './pages/Users';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import ActivityLogs from './pages/admin/ActivityLogs';
import SystemSettings from './pages/admin/SystemSettings';
import BackupRestore from './pages/admin/BackupRestore';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute>
                <UserManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <PrivateRoute>
                <DepartmentManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/activity-logs"
            element={
              <PrivateRoute>
                <ActivityLogs />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <PrivateRoute>
                <SystemSettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/backup"
            element={
              <PrivateRoute>
                <BackupRestore />
              </PrivateRoute>
            }
          />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/boards/:boardId"
            element={
              <PrivateRoute>
                <BoardView />
              </PrivateRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <PrivateRoute>
                <Departments />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            }
          />
          {/* Catch-all route to redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
