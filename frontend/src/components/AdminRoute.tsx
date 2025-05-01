import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState } from '../store';
import PrivateRoute from './PrivateRoute'; // Assuming PrivateRoute handles general authentication

interface AdminRouteProps {
  children: React.ReactElement;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // Check if user exists and if their role is ADMIN (case-insensitive)
  const isAdmin = user && typeof user.role === 'string' && user.role.toUpperCase() === 'ADMIN';

  if (!isAdmin) {
    // If not an admin, redirect to dashboard or a specific 'unauthorized' page
    // Optionally pass the original location state for redirection after login
    console.warn('Non-admin user attempted to access admin route.');
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // If user is admin, render the child component wrapped in PrivateRoute for auth check
  // Note: If PrivateRoute already handles the redirect for non-auth users, 
  // this nested structure might be slightly redundant, but ensures both checks.
  return <PrivateRoute>{children}</PrivateRoute>;
};

export default AdminRoute; 