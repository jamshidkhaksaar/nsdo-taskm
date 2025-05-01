import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';
import AdminRoute from '../components/AdminRoute';
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

// Lazy load Admin components
const AdminDashboard = lazyLoad(import('../pages/admin/AdminDashboard'));
const UserManagement = lazyLoad(import('../pages/admin/UserManagement'));
const RBACManagement = lazyLoad(import('../pages/admin/rbac')); // Assuming rbac/index.ts exports the component
const DepartmentManagement = lazyLoad(import('../pages/admin/DepartmentManagement'));
const ProvinceManagement = lazyLoad(import('../pages/admin/ProvinceManagement'));
const ActivityLogs = lazyLoad(import('../pages/admin/ActivityLogs'));
const RecycleBin = lazyLoad(import('../pages/admin/RecycleBin'));
const SystemSettings = lazyLoad(import('../pages/admin/SystemSettings'));
const BackupRestore = lazyLoad(import('../pages/admin/BackupRestore'));
const EmailConfiguration = lazyLoad(import('../pages/admin/EmailConfiguration'));

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

        {/* Admin Routes - Protected by AdminRoute */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="/admin/rbac" element={<AdminRoute><RBACManagement /></AdminRoute>} />
        <Route path="/admin/departments" element={<AdminRoute><DepartmentManagement /></AdminRoute>} />
        <Route path="/admin/provinces" element={<AdminRoute><ProvinceManagement /></AdminRoute>} />
        <Route path="/admin/activity-logs" element={<AdminRoute><ActivityLogs /></AdminRoute>} />
        <Route path="/admin/recycle-bin" element={<AdminRoute><RecycleBin /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><SystemSettings /></AdminRoute>} />
        <Route path="/admin/backup" element={<AdminRoute><BackupRestore /></AdminRoute>} />
        <Route path="/admin/email-config" element={<AdminRoute><EmailConfiguration /></AdminRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;