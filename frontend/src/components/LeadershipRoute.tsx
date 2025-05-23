import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState } from '../store';

interface LeadershipRouteProps {
  children: React.ReactElement;
}

const LeadershipRoute: React.FC<LeadershipRouteProps> = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // First, ensure user is authenticated (like PrivateRoute)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user exists and has Leadership, Administrator, Super Admin, or admin role (case-insensitive)
  const userRoleUpper = user?.role && typeof user.role === 'string' ? user.role.toUpperCase() : '';
  const isAllowed = ['LEADERSHIP', 'ADMINISTRATOR', 'SUPER ADMIN', 'ADMIN'].includes(userRoleUpper);

  if (!isAllowed) {
    console.warn(`User (Role: ${user?.role}) without Leadership/Admin access attempted to access route.`);
    // Redirect non-leadership/admin users to the dashboard
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // If authenticated and has the required role, render the children
  return children;
};

export default LeadershipRoute;
