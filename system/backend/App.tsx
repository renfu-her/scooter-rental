
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import OrdersPage from './pages/OrdersPage';
import PartnersPage from './pages/PartnersPage';
import ScootersPage from './pages/ScootersPage';
import FinesPage from './pages/FinesPage';
import BannersPage from './pages/BannersPage';
import AccessoriesPage from './pages/AccessoriesPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/orders" replace />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="partners" element={<PartnersPage />} />
          <Route path="scooters" element={<ScootersPage />} />
          <Route path="fines" element={<FinesPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="accessories" element={<AccessoriesPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
