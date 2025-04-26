import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../store';
import { AuthUser } from '../types/auth'; // Corrected import path

interface RoleBasedGuardProps {
  children: React.ReactNode;
  allowedRoles: string[]; // Array of roles allowed to access the route
}

const RoleBasedGuard: React.FC<RoleBasedGuardProps> = ({ children, allowedRoles }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  // If user is not loaded yet, or doesn't have a role, deny access (or show loading)
  // Consider adding a loading check similar to AuthGuard if needed
  if (!user || !user.role) {
    // Redirect to a general dashboard or an unauthorized page
    return <Navigate to="/dashboard" replace />;
  }

  // Check if the user's role is included in the allowed roles
  const hasRequiredRole = allowedRoles.includes(user.role);

  if (!hasRequiredRole) {
    // Redirect to a general dashboard or an unauthorized page
    // For admin routes, redirecting to /admin/dashboard might be better if they have *some* admin access but not for this specific page
    // However, the current setup uses this guard *after* AuthGuard, so they should be logged in.
    return <Navigate to="/dashboard" replace />; // Or create a dedicated Unauthorized page
  }

  return <>{children}</>;
};

export default RoleBasedGuard; 