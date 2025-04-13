import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Departments = lazy(() => import('../pages/Departments'));
const Users = lazy(() => import('../pages/Users'));
const NotFound = lazy(() => import('../pages/NotFound'));
const TasksOverview = lazy(() => import('../pages/TasksOverview'));
const AdminRoutes = lazy(() => import('./AdminRoutes'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));

const ProvincesPage = lazy(() => import('../pages/ProvincesPage'));

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
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
        <Route
          path="/admin/*"
          element={
            <PrivateRoute>
              <AdminRoutes />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;