import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';
import AdminRoute from '../components/AdminRoute';
import LeadershipRoute from '../components/LeadershipRoute';
import Dashboard from '../pages/Dashboard';
// Direct import critical components to avoid lazy loading issues
import Login from '../pages/Login';

// For other components, use lazy loading with error handling
const lazyLoad = (importPromise: Promise<any>) => {
  return React.lazy(() => importPromise.catch(error => {
    console.error('Failed to lazy load component:', error);
    return { default: () => (
      <div className='text-center p-4 text-red-500'>
        Failed to load component. Please check your connection and refresh the page.
      </div>
    )};
  }));
};

const Departments = lazyLoad(import('../pages/Departments'));
const Users = lazyLoad(import('../pages/Users'));
const NotFound = lazyLoad(import('../pages/NotFound'));
const TaskOverview = lazyLoad(import('../components/dashboard/TaskOverview'));
// const AdminRoutes = lazyLoad(import('./AdminRoutes'));
// const ForgotPassword = lazyLoad(import('../pages/ForgotPassword')); // Commented out - file doesn't exist
const ProvincesPage = lazyLoad(import('../pages/ProvincesPage'));
const SettingsPage = lazyLoad(import("../pages/Settings"));
const ProfilePage = lazyLoad(import("../pages/Profile"));
const ResetPasswordRequest = lazyLoad(import('../components/auth/ResetPasswordRequest'));
const ResetPasswordForm = lazyLoad(import('../components/auth/ResetPasswordForm'));
const Unauthorized = lazyLoad(import('../pages/Unauthorized'));

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

// Define roles constants for readability
const ROLES = {
  USER: 'User',
  LEADERSHIP: 'Leadership',
  ADMIN: 'Administrator',
  SUPER_ADMIN: 'Super Admin'
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div className='flex justify-center items-center h-screen'><p>Loading page...</p></div>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ResetPasswordRequest />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Authenticated Routes */}
        <Route path="/" element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>} />

        {/* Routes for User, Leadership, Admin */}
        <Route
          path="/dashboard"
          element={<PrivateRoute allowedRoles={[ROLES.USER, ROLES.LEADERSHIP, ROLES.ADMIN, ROLES.SUPER_ADMIN]}><Dashboard /></PrivateRoute>}
        />
        <Route
          path="/departments"
          element={<PrivateRoute allowedRoles={[ROLES.USER, ROLES.LEADERSHIP, ROLES.ADMIN, ROLES.SUPER_ADMIN]}><Departments /></PrivateRoute>}
        />
        <Route
          path="/users"
          element={<PrivateRoute allowedRoles={[ROLES.USER, ROLES.LEADERSHIP, ROLES.ADMIN, ROLES.SUPER_ADMIN]}><Users /></PrivateRoute>}
        />
        <Route
          path="/provinces"
          element={<PrivateRoute allowedRoles={[ROLES.USER, ROLES.LEADERSHIP, ROLES.ADMIN, ROLES.SUPER_ADMIN]}><ProvincesPage /></PrivateRoute>}
        />

        {/* Routes for Leadership, Admin */}
        <Route
          path="/tasks-overview"
          element={<LeadershipRoute><TaskOverview /></LeadershipRoute>}
        />
        {/* Add other Leadership accessible routes here if they exist, e.g., Department/User Management (non-admin path) */}
        {/* Example: <Route path="/manage-departments" element={<LeadershipRoute><DepartmentCRUDPage /></LeadershipRoute>} /> */}

        {/* Routes accessible to all authenticated users */}
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        {/* Admin Only Routes */}
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

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;