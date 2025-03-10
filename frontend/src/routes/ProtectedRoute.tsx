import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { refreshAccessToken, isTokenExpired } from '../utils/authUtils';
import { CircularProgress, Box } from '@mui/material';

export const protectedRoutes = [
  '/dashboard',
  '/departments',
  '/users',
  '/profile',
  '/settings',
  // Add other protected routes here
];

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(isAuthenticated);

  useEffect(() => {
    const checkAuthentication = async () => {
      // If already authenticated according to Redux, we're good
      if (isAuthenticated && token && !isTokenExpired(token)) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // If we have a token but it's expired, try to refresh
      if (token && isTokenExpired(token)) {
        try {
          console.log("Token expired, attempting to refresh...");
          const newToken = await refreshAccessToken();
          if (newToken) {
            console.log("Token refreshed successfully");
            setIsAuthorized(true);
          } else {
            console.log("Token refresh failed");
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error("Failed to refresh token:", error);
          setIsAuthorized(false);
        }
      } else if (!token) {
        // No token at all
        setIsAuthorized(false);
      }
      
      setIsChecking(false);
    };

    checkAuthentication();
  }, [token, isAuthenticated, location.pathname]);

  if (isChecking) {
    // Show loading indicator while checking authentication
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthorized) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 