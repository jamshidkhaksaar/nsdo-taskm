import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';
import Dashboard from '../pages/Dashboard';
// Direct import critical components to avoid lazy loading issues
import Login from '../pages/Login';

// For other components, use lazy loading with error handling
const lazyLoad = (importPromise) => {
  return React.lazy(() => importPromise.catch(error => {
    console.error('Failed to lazy load component:', error);
    return { default: () => <div>Failed to load component. Please refresh the page.</div> };
  }));
};

const Departments = lazyLoad(import('../pages/Departments'));
const Users = lazyLoad(import('../pages/Users'));
const NotFound = lazyLoad(import('../pages/NotFound'));
const TasksOverview = lazyLoad(import('../pages/TasksOverview'));
// const AdminRoutes = lazyLoad(import('./AdminRoutes'));
// const ForgotPassword = lazyLoad(import('../pages/ForgotPassword')); // Commented out - file doesn't exist
const ProvincesPage = lazyLoad(import('../pages/ProvincesPage'));
const SettingsPage = lazyLoad(import("../pages/Settings"));
const ProfilePage = lazyLoad(import("../pages/Profile"));

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<Navigate to="/login" />} /> {/* Temporarily redirect */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
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
        <Route
          path="/tasks-overview"
          element={
            <PrivateRoute>
              <TasksOverview />
            </PrivateRoute>
          }
        />
        <Route
          path="/provinces"
          element={
            <PrivateRoute>
              <ProvincesPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;