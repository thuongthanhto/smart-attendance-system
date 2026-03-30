import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Role } from '@smart-attendance/shared';
import { useAuthStore } from './stores/auth.store';
import AuthGuard from './components/guards/AuthGuard';
import RoleGuard from './components/guards/RoleGuard';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Branches from './pages/Branches';
import Attendance from './pages/Attendance';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }
      >
        <Route
          path="/dashboard"
          element={
            <RoleGuard roles={[Role.ADMIN, Role.MANAGER]}>
              <Dashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/employees"
          element={
            <RoleGuard roles={[Role.ADMIN, Role.MANAGER]}>
              <Employees />
            </RoleGuard>
          }
        />
        <Route
          path="/branches"
          element={
            <RoleGuard roles={[Role.ADMIN, Role.MANAGER]}>
              <Branches />
            </RoleGuard>
          }
        />
        <Route
          path="/attendance"
          element={
            <RoleGuard roles={[Role.ADMIN, Role.MANAGER]}>
              <Attendance />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
