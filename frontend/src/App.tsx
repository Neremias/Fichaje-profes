import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FullPageSpinner } from './components/ui/Spinner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { useAuth } from './hooks/useAuth';

const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const FicharPage = lazy(() => import('./pages/Fichar/FicharPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const TeachersPage = lazy(() => import('./pages/Teachers/TeachersPage'));
const SchedulesPage = lazy(() => import('./pages/Schedules/SchedulesPage'));
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage'));
const CatalogPage = lazy(() => import('./pages/Catalog/CatalogPage'));
const SecretaryPage = lazy(() => import('./pages/Secretary/SecretaryPage'));
const QRDisplayPage = lazy(() => import('./pages/QR/QRDisplayPage'));
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'));

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/fichar" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chequeoprofesor" element={<QRDisplayPage />} />

        {/* Teacher-only */}
        <Route
          path="/fichar"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <FicharPage />
            </ProtectedRoute>
          }
        />

        {/* Admin area — wrapped in AppLayout */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/schedules" element={<SchedulesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/secretary" element={<SecretaryPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
