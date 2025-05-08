import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Optional array of allowed role names (case-insensitive)
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // 1. Check Authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Role if allowedRoles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role && typeof user.role === 'string' ? user.role.toUpperCase() : '';
    const isAllowed = allowedRoles.map(role => role.toUpperCase()).includes(userRole);

    if (!isAllowed) {
      console.warn(`User (Role: ${user?.role}) attempted to access route restricted to roles: ${allowedRoles.join(', ')}`);
      // Redirect users without the required role to the dashboard (or an unauthorized page)
      return <Navigate to="/dashboard" state={{ from: location }} replace />;
    }
  }

  // If authenticated and (no roles specified or role is allowed), render children
  return <>{children}</>;
};

export default PrivateRoute; 