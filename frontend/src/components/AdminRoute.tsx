import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState } from '../store';

interface AdminRouteProps {
  children: React.ReactElement;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // Check if user exists and role string is Administrator or Super Admin (case-insensitive)
  const isAdmin = user?.role && 
                   typeof user.role === 'string' && 
                   (user.role.toUpperCase() === 'ADMINISTRATOR' || user.role.toUpperCase() === 'SUPER ADMIN');

  if (!isAdmin) {
    console.warn(`Non-admin user (Role: ${user?.role}) attempted to access admin route.`);
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // AdminRoute now only checks the role. AppRoutes should ensure PrivateRoute handles authentication.
  return children;
};

export default AdminRoute; 