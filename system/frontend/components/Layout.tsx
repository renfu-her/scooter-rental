
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo, NAV_ITEMS } from '../constants';
import { Calendar, Search, MessageCircle, ChevronRight, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col relative">
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

            <a href="https://lin.ee/7Fr9eko" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-[#1a1a1a] text-white px-5 py-3 rounded-full hover:bg-black transition-all group">
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
                    <p>地址：<a href="https://www.google.com.tw/maps/search/%E5%B1%8F%E6%9D%B1%E7%B8%A3%E7%90%89%E7%90%83%E9%84%89%E7%9B%B8%E5%9F%94%E8%B7%AF86%E4%B9%8B5" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors">屏東縣琉球鄉相埔路86之5</a></p>
                    <p className="mt-2">LINE ID：<a href="https://lin.ee/7Fr9eko" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors">@623czmsm</a></p>
                    <p className="mt-2">電話：<a href="tel:0911306011" className="hover:text-teal-600 transition-colors">0911306011</a></p>
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
