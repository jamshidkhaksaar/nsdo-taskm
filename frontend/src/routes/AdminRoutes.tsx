import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  AdminDashboard,
  UserManagement,
  DepartmentManagement,
  ActivityLogs,
  SystemSettings,
  BackupRestore,
} from '../pages/admin';

const AdminRoutes: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Check if user is admin
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="departments" element={<DepartmentManagement />} />
      <Route path="activity-logs" element={<ActivityLogs />} />
      <Route path="settings" element={<SystemSettings />} />
      <Route path="backup" element={<BackupRestore />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default AdminRoutes; 