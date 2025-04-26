import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LoadingScreen from '../components/LoadingScreen';
import AuthGuard from '../guards/AuthGuard';
import RoleBasedGuard from '../guards/RoleBasedGuard';

// Lazy load pages
const Login = lazy(() => import('../pages/Login'));
// const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Profile = lazy(() => import('../pages/Profile'));
const Tasks = lazy(() => import('../pages/Tasks'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Import AdminRoutes
import AdminRoutes from './AdminRoutes';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Router>
        <Routes>
          {/* Guest routes */}
          <Route path="/login" element={<Login />} />
          {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}

          {/* Authenticated routes */}
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/tasks" element={<AuthGuard><Tasks /></AuthGuard>} />

          {/* Admin routes */}
          <Route 
            path="/admin/*" 
            element={
              <AuthGuard>
                <RoleBasedGuard allowedRoles={['admin']}>
                  <AdminRoutes />
                </RoleBasedGuard>
              </AuthGuard>
            }
          />
          
          {/* Fallback routes */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </Suspense>
  );
};

export default AppRoutes; 