
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import { ROUTE_PERMISSIONS } from './constants';

// Lazy load page components for code-splitting
const OrdersPage = React.lazy(() => import('./pages/OrdersPage'));
const PartnersPage = React.lazy(() => import('./pages/PartnersPage'));
const StoresPage = React.lazy(() => import('./pages/StoresPage'));
const ScootersPage = React.lazy(() => import('./pages/ScootersPage'));
const ScooterModelsPage = React.lazy(() => import('./pages/ScooterModelsPage'));
const ScooterTypesPage = React.lazy(() => import('./pages/ScooterTypesPage'));
const FinesPage = React.lazy(() => import('./pages/FinesPage'));
const AccessoriesPage = React.lazy(() => import('./pages/AccessoriesPage'));
const AdminsPage = React.lazy(() => import('./pages/AdminsPage'));
const BannersPage = React.lazy(() => import('./pages/BannersPage'));
const RentalPlansPage = React.lazy(() => import('./pages/RentalPlansPage'));
const GuidelinesPage = React.lazy(() => import('./pages/GuidelinesPage'));
const ContactInfosPage = React.lazy(() => import('./pages/ContactInfosPage'));
const LocationsPage = React.lazy(() => import('./pages/LocationsPage'));
const GuesthousesPage = React.lazy(() => import('./pages/GuesthousesPage'));
const BookingsPage = React.lazy(() => import('./pages/BookingsPage'));
const HomeImagesPage = React.lazy(() => import('./pages/HomeImagesPage'));
const EnvironmentImagesPage = React.lazy(() => import('./pages/EnvironmentImagesPage'));
const ShuttleImagesPage = React.lazy(() => import('./pages/ShuttleImagesPage'));

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

// 權限保護路由組件
const PermissionRoute: React.FC<{ children: React.ReactElement; path: string }> = ({ children, path }) => {
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

  // 檢查路由權限
  const requiredPermission = ROUTE_PERMISSIONS[path];
  
  // 如果沒有設定權限，所有角色都可以使用
  if (requiredPermission === null) {
    return children;
  }

  // super_admin 可以使用所有路由
  if (user.role === 'super_admin') {
    return children;
  }

  // 檢查特定權限
  if (requiredPermission === 'super_admin') {
    // 只有 super_admin 可以使用
    if (user.role !== 'super_admin') {
      return <Navigate to="/orders" replace />;
    }
  }

  if (requiredPermission === 'can_manage_stores') {
    // 需要授權商店管理
    if (!user.can_manage_stores) {
      return <Navigate to="/orders" replace />;
    }
  }

  if (requiredPermission === 'can_manage_content') {
    // 需要授權網站內容管理
    if (!user.can_manage_content) {
      return <Navigate to="/orders" replace />;
    }
  }

  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter basename="/backend">
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
              <PermissionRoute path="/stores">
                <Suspense fallback={<LoadingFallback />}>
                  <StoresPage />
                </Suspense>
              </PermissionRoute>
            } />
            <Route path="scooters" element={
              <Suspense fallback={<LoadingFallback />}>
                <ScootersPage />
              </Suspense>
            } />
            <Route path="scooter-models" element={
              <Suspense fallback={<LoadingFallback />}>
                <ScooterModelsPage />
              </Suspense>
            } />
            <Route path="scooter-types" element={
              <Suspense fallback={<LoadingFallback />}>
                <ScooterTypesPage />
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
              <PermissionRoute path="/admins">
                <Suspense fallback={<LoadingFallback />}>
                  <AdminsPage />
                </Suspense>
              </PermissionRoute>
            } />
            <Route path="banners" element={
              <PermissionRoute path="/banners">
                <Suspense fallback={<LoadingFallback />}>
                  <BannersPage />
                </Suspense>
              </PermissionRoute>
            } />
            <Route path="rental-plans" element={
              <PermissionRoute path="/rental-plans">
                <Suspense fallback={<LoadingFallback />}>
                  <RentalPlansPage />
                </Suspense>
              </PermissionRoute>
            } />
            <Route path="guidelines" element={
              <PermissionRoute path="/guidelines">
                <Suspense fallback={<LoadingFallback />}>
                  <GuidelinesPage />
                </Suspense>
              </PermissionRoute>
            } />
            <Route path="contact-infos" element={
              <PermissionRoute path="/contact-infos">
                <Suspense fallback={<LoadingFallback />}>
                  <ContactInfosPage />
                </Suspense>
              </PermissionRoute>
            } />
            <Route path="locations" element={
              <PermissionRoute path="/locations">
                <Suspense fallback={<LoadingFallback />}>
                  <LocationsPage />
                </Suspense>
              </PermissionRoute>
            } />
            <Route path="guesthouses" element={
              <PermissionRoute path="/guesthouses">
                <Suspense fallback={<LoadingFallback />}>
                  <GuesthousesPage />
                </Suspense>
              </PermissionRoute>
            } />
            <Route path="bookings" element={
              <PermissionRoute path="/bookings">
                <Suspense fallback={<LoadingFallback />}>
                  <BookingsPage />
                </Suspense>
              </PermissionRoute>
            } />
            <Route path="home-images" element={
              <PermissionRoute path="/home-images">
                <Suspense fallback={<LoadingFallback />}>
                  <HomeImagesPage />
                </Suspense>
              </PermissionRoute>
            } />
            <Route path="environment-images" element={
              <PermissionRoute path="/environment-images">
                <Suspense fallback={<LoadingFallback />}>
                  <EnvironmentImagesPage />
                </Suspense>
              </PermissionRoute>
            } />
            <Route path="shuttle-images" element={
              <PermissionRoute path="/shuttle-images">
                <Suspense fallback={<LoadingFallback />}>
                  <ShuttleImagesPage />
                </Suspense>
              </PermissionRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;
