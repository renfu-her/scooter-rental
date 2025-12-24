
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, User, Menu } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import AIChatAssistant from './AIChatAssistant';

const SidebarItem: React.FC<{ item: any; isOpenByDefault?: boolean; sidebarOpen: boolean }> = ({ 
  item, 
  isOpenByDefault = false,
  sidebarOpen 
}) => {
  const [isOpen, setIsOpen] = useState(isOpenByDefault);
  const location = useLocation();

  // 當側邊欄關閉時，強制關閉子選單收合狀態
  useEffect(() => {
    if (!sidebarOpen) {
      setIsOpen(false);
    }
  }, [sidebarOpen]);

  const hasChildren = item.children && item.children.length > 0;
  const isActive = location.pathname === item.path || (item.children && item.children.some((c: any) => c.path === location.pathname));

  const content = (
    <div className={`flex items-center transition-all duration-300 ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 rounded-xl ${
      location.pathname === item.path ? 'bg-orange-100 text-orange-600 font-bold' : 'text-gray-600 hover:bg-gray-100'
    }`}>
      <div className="flex-shrink-0">{item.icon}</div>
      {sidebarOpen && <span className="text-sm whitespace-nowrap animate-in fade-in duration-300">{item.title}</span>}
    </div>
  );

  if (!hasChildren) {
    return (
      <Link to={item.path} title={!sidebarOpen ? item.title : ''}>
        {content}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => sidebarOpen && setIsOpen(!isOpen)}
        className={`w-full flex items-center transition-all duration-300 ${sidebarOpen ? 'justify-between px-4' : 'justify-center px-0'} py-3 rounded-xl ${
          isActive ? 'text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-100'
        }`}
        title={!sidebarOpen ? item.title : ''}
      >
        <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : ''}`}>
          <div className="flex-shrink-0">{item.icon}</div>
          {sidebarOpen && <span className="text-sm whitespace-nowrap animate-in fade-in duration-300">{item.title}</span>}
        </div>
        {sidebarOpen && (isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />)}
      </button>
      
      {/* 子選單僅在展開且 sidebarOpen 時顯示 */}
      {sidebarOpen && isOpen && (
        <div className="pl-11 space-y-1 animate-in slide-in-from-top-1 duration-200">
          {item.children.map((child: any) => (
            <Link
              key={child.path}
              to={child.path}
              className={`block px-4 py-2 text-xs rounded-lg transition-colors ${
                location.pathname === child.path ? 'text-orange-600 bg-orange-50 font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-30 shadow-sm`}>
        {/* Logo 區域 */}
        <div className={`p-4 flex items-center transition-all duration-300 ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-orange-100 flex-shrink-0">
            蘭
          </div>
          {sidebarOpen && (
            <span className="text-lg font-black text-gray-800 whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
              蘭光租賃
            </span>
          )}
        </div>
        
        {/* 導覽列表 */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2 scrollbar-hide">
          {NAV_ITEMS.map((item, idx) => (
            <SidebarItem 
              key={idx} 
              item={item} 
              isOpenByDefault={idx === 0} 
              sidebarOpen={sidebarOpen} 
            />
          ))}
        </nav>

        {/* 使用者資訊區域 */}
        <div className="p-4 border-t border-gray-50 bg-gray-50/30">
          <div className={`flex items-center transition-all duration-300 ${sidebarOpen ? 'space-x-3' : 'justify-center'} p-2`}>
            <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 text-gray-400">
              <User size={18} />
            </div>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
                <p className="text-xs font-black text-gray-800 truncate">管理員 Admin</p>
                <button className="text-[10px] text-red-400 font-bold hover:text-red-600 transition-colors uppercase tracking-tighter">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-20">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-orange-600 transition-all active:scale-90"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center space-x-4">
             <div className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 shadow-sm shadow-orange-50">
               Version 1.0.4 PRO
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#fafafa]">
          <Outlet />
        </div>

        <AIChatAssistant />
      </main>
    </div>
  );
};

export default DashboardLayout;
