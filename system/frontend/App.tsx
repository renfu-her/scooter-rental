
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import About from './pages/About';
import RentalPlans from './pages/RentalPlans';
import Guidelines from './pages/Guidelines';
import Booking from './pages/Booking';
import Location from './pages/Location';
import Guesthouses from './pages/Guesthouses';
import GuesthouseDetail from './pages/GuesthouseDetail';
import Contact from './pages/Contact';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          {/* Default entry point */}
          <Route path="/" element={<Home />} />
          
          {/* User defined navigation structure */}
          <Route path="/about" element={<About />} /> {/* 關於我們 */}
          <Route path="/rental" element={<RentalPlans />} /> {/* 租車方案 maps to rental */}
          <Route path="/guidelines" element={<Guidelines />} /> {/* 租車須知 */}
          <Route path="/booking" element={<Booking />} /> {/* 線上預約 */}
          <Route path="/location" element={<Location />} /> {/* 交通位置 */}
          <Route path="/guesthouses" element={<Guesthouses />} /> {/* 民宿推薦 */}
          <Route path="/guesthouses/:id" element={<GuesthouseDetail />} /> {/* 民宿詳細頁面 */}
          <Route path="/contact" element={<Contact />} /> {/* 聯絡我們 */}
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/about" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
