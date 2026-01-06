
import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';

// Lazy load page components for code-splitting
const OrdersPage = React.lazy(() => import('./pages/OrdersPage'));
const PartnersPage = React.lazy(() => import('./pages/PartnersPage'));
const StoresPage = React.lazy(() => import('./pages/StoresPage'));
const ScootersPage = React.lazy(() => import('./pages/ScootersPage'));
const FinesPage = React.lazy(() => import('./pages/FinesPage'));
const AccessoriesPage = React.lazy(() => import('./pages/AccessoriesPage'));
const AdminsPage = React.lazy(() => import('./pages/AdminsPage'));
const BannersPage = React.lazy(() => import('./pages/BannersPage'));
const RentalPlansPage = React.lazy(() => import('./pages/RentalPlansPage'));
const GuidelinesPage = React.lazy(() => import('./pages/GuidelinesPage'));
const LocationsPage = React.lazy(() => import('./pages/LocationsPage'));
const GuesthousesPage = React.lazy(() => import('./pages/GuesthousesPage'));
const BookingsPage = React.lazy(() => import('./pages/BookingsPage'));

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
      <p className="mt-4 text-gray-500 dark:text-gray-400">載入中...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/orders" replace />} />
            <Route path="orders" element={
              <Suspense fallback={<LoadingFallback />}>
                <OrdersPage />
              </Suspense>
            } />
            <Route path="partners" element={
              <Suspense fallback={<LoadingFallback />}>
                <PartnersPage />
              </Suspense>
            } />
            <Route path="stores" element={
              <Suspense fallback={<LoadingFallback />}>
                <StoresPage />
              </Suspense>
            } />
            <Route path="scooters" element={
              <Suspense fallback={<LoadingFallback />}>
                <ScootersPage />
              </Suspense>
            } />
            <Route path="fines" element={
              <Suspense fallback={<LoadingFallback />}>
                <FinesPage />
              </Suspense>
            } />
            <Route path="accessories" element={
              <Suspense fallback={<LoadingFallback />}>
                <AccessoriesPage />
              </Suspense>
            } />
            <Route path="admins" element={
              <Suspense fallback={<LoadingFallback />}>
                <AdminsPage />
              </Suspense>
            } />
            <Route path="banners" element={
              <Suspense fallback={<LoadingFallback />}>
                <BannersPage />
              </Suspense>
            } />
            <Route path="rental-plans" element={
              <Suspense fallback={<LoadingFallback />}>
                <RentalPlansPage />
              </Suspense>
            } />
            <Route path="guidelines" element={
              <Suspense fallback={<LoadingFallback />}>
                <GuidelinesPage />
              </Suspense>
            } />
            <Route path="locations" element={
              <Suspense fallback={<LoadingFallback />}>
                <LocationsPage />
              </Suspense>
            } />
            <Route path="guesthouses" element={
              <Suspense fallback={<LoadingFallback />}>
                <GuesthousesPage />
              </Suspense>
            } />
            <Route path="bookings" element={
              <Suspense fallback={<LoadingFallback />}>
                <BookingsPage />
              </Suspense>
            } />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
