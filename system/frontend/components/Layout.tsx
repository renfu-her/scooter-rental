
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo, NAV_ITEMS } from '../constants';
import { Calendar, Search, MessageCircle, ChevronRight, Menu, X, Megaphone, Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const location = useLocation();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col relative">
      {/* Visual Image Banner */}
      {showBanner && (
        <div className="relative w-full h-16 md:h-20 overflow-hidden group z-[100]">
          {/* Banner Background Image */}
          <img 
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2000" 
            className="absolute inset-0 w-full h-full object-cover filter brightness-50 contrast-125"
            alt="Promotion Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/40 to-black/20"></div>
          
          <div className="relative h-full max-w-7xl mx-auto flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white border border-white/30">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-teal-300 font-bold">Limited Offer</span>
                <p className="text-xs md:text-base text-white font-bold tracking-wide">
                  蘭光租賃開幕慶盛大展開！<span className="text-yellow-400">線上預約即享 8 折</span>，把握登島美好時光。
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <Link to="/booking" className="hidden md:block bg-white text-black px-6 py-1.5 rounded-full text-sm font-black hover:bg-teal-500 hover:text-white transition-all shadow-lg transform active:scale-95">
                立即預約
              </Link>
              <button 
                onClick={() => setShowBanner(false)}
                className="text-white/60 hover:text-white p-1 transition-colors"
                aria-label="Close banner"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#fcfcfc] border-r border-gray-100 p-8 z-50">
          <div className="flex flex-col items-center mb-12 border border-black rounded-[50px] py-10 px-4 bg-white shadow-sm">
            <Link to="/" className="mb-10">
              <Logo />
            </Link>
            <nav className="flex flex-col items-center space-y-5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-[15px] font-medium transition-colors hover:text-teal-600 ${
                    location.pathname === item.path ? 'text-teal-600 font-bold' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3 mt-auto">
            <Link to="/booking" className="flex items-center justify-between bg-[#1a1a1a] text-white px-5 py-3 rounded-full hover:bg-black transition-all group">
              <div className="flex items-center gap-3">
                <Calendar size={18} />
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">線上預約</span>
                  <span className="text-[10px] opacity-70 italic">reserve</span>
                </div>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link to="/booking" className="flex items-center justify-between bg-[#1a1a1a] text-white px-5 py-3 rounded-full hover:bg-black transition-all group">
              <div className="flex items-center gap-3">
                <Search size={18} />
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">預約查詢</span>
                  <span className="text-[10px] opacity-70 italic">inquire</span>
                </div>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <a href="https://line.me" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-[#1a1a1a] text-white px-5 py-3 rounded-full hover:bg-black transition-all group">
              <div className="flex items-center gap-3">
                <MessageCircle size={18} />
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">LINE @</span>
                </div>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </aside>

        {/* Header - Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-[60]">
          <Link to="/">
            <Logo />
          </Link>
          <button onClick={toggleMobileMenu} className="p-2">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-white z-[55] flex flex-col p-8 md:hidden pt-24">
            <nav className="flex flex-col space-y-6 text-center">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={toggleMobileMenu}
                  className="text-xl font-bold text-gray-800"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-4">
              <Link to="/booking" onClick={toggleMobileMenu} className="block w-full text-center bg-black text-white py-4 rounded-full font-bold">線上預約</Link>
              <Link to="/location" onClick={toggleMobileMenu} className="block w-full text-center border border-black py-4 rounded-full font-bold">聯絡我們</Link>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden relative">
          <div className="w-full">
            {children}
          </div>

          {/* Footer Content */}
          <footer className="bg-white py-12 px-6 md:px-12 border-t border-gray-100">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex flex-col items-center md:items-start">
                  <Logo />
                  <div className="mt-4 text-sm text-gray-500 text-center md:text-left">
                    <p>地址：臺北市中正路 123 號</p>
                    <p>信箱：info-demo@gmail.com</p>
                    <p>電話：02-2345-5555</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-black hover:text-white transition-all"><i className="lucide-facebook w-5 h-5"></i></a>
                  <a href="#" className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-black hover:text-white transition-all"><i className="lucide-instagram w-5 h-5"></i></a>
                  <a href="#" className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-black hover:text-white transition-all"><i className="lucide-message-circle w-5 h-5"></i></a>
                </div>
            </div>
            <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-100 text-[10px] text-gray-400 text-center uppercase tracking-widest flex flex-col md:flex-row justify-between items-center gap-2">
                <p>Copyright © 2025 蘭光租賃中心 All Rights Reserved.</p>
                <p>Design by AI Architect</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;
