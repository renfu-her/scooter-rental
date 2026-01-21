
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, User, Menu, Sun, Moon, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import StoreSelector from './StoreSelector';

const SidebarItem: React.FC<{ item: any; isOpenByDefault?: boolean; sidebarOpen: boolean; theme: 'light' | 'dark' }> = ({ 
  item, 
  isOpenByDefault = false,
  sidebarOpen,
  theme
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
      location.pathname === item.path 
        ? theme === 'dark' ? 'bg-orange-900/30 text-orange-400 font-bold' : 'bg-orange-100 text-orange-600 font-bold'
        : theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
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
          isActive 
            ? theme === 'dark' ? 'text-gray-100 font-medium' : 'text-gray-900 font-medium'
            : theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
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
                location.pathname === child.path 
                  ? theme === 'dark' ? 'text-orange-400 bg-orange-900/20 font-bold' : 'text-orange-600 bg-orange-50 font-bold'
                  : theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-all duration-300 flex flex-col z-30 shadow-sm`}>
        {/* 漢堡菜單按鈕 */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className={`w-full p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300 hover:text-orange-400' : 'hover:bg-gray-50 text-gray-400 hover:text-orange-600'}`}
          >
            <Menu size={20} />
          </button>
        </div>
        
        {/* Logo 區域 */}
        <div className={`p-4 flex items-center transition-all duration-300 ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
          <img 
            src="/favicon.png" 
            alt="蘭光電動機車 Logo" 
            className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
          />
          {sidebarOpen && (
            <span className={`text-lg font-black whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
              蘭光電動機車
            </span>
          )}
        </div>
        
        {/* 導覽列表 */}
        <nav className="flex-1 overflow-y-auto px-3 pt-6 pb-0 space-y-2 scrollbar-hide">
          {NAV_ITEMS.map((item, idx) => (
            <SidebarItem 
              key={idx} 
              item={item} 
              isOpenByDefault={idx === 0} 
              sidebarOpen={sidebarOpen}
              theme={theme}
            />
          ))}
        </nav>

        {/* 商店選擇器 */}
        <StoreSelector theme={theme} sidebarOpen={sidebarOpen} />

        {/* 切換深淺模式按鈕 */}
        <div className={`px-3 pb-3 ${sidebarOpen ? '' : 'px-2'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full p-2.5 rounded-xl transition-all flex items-center ${sidebarOpen ? 'justify-start space-x-3 px-3' : 'justify-center'} ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-600'}`}
            title={theme === 'dark' ? '切換為淺色模式' : '切換為深色模式'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {sidebarOpen && (
              <span className="text-sm font-medium animate-in fade-in duration-300">
                {theme === 'dark' ? '切換淺色模式' : '切換深色模式'}
              </span>
            )}
          </button>
        </div>

        {/* 使用者資訊區域 */}
        {user && (
          <div className={`p-4 pt-4 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/30'}`}>
            <div className={`flex items-center transition-all duration-300 ${sidebarOpen ? 'space-x-3' : 'justify-center'} p-2`}>
              <div className={`w-9 h-9 rounded-xl ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'} border shadow-sm flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`}>
                <User size={18} />
              </div>
              {sidebarOpen && (
                <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
                  <p className={`text-xs font-black truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{user.name}</p>
                  <button 
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    className={`text-[10px] font-bold hover:text-red-600 transition-colors uppercase tracking-tighter ${theme === 'dark' ? 'text-red-500' : 'text-red-400'}`}
                  >
                    登出
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-gray-900' : 'bg-[#fafafa]'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
