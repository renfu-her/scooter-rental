import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, FileText, ChevronLeft, ChevronRight, MoreHorizontal, Bike, X, TrendingUp, Loader2, Edit3, Trash2, ChevronDown } from 'lucide-react';
import { OrderStatus } from '../types';
import AddOrderModal from '../components/AddOrderModal';
import { ordersApi } from '../lib/api';

interface Order {
  id: number;
  order_number: string;
  status: string;
  tenant: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  expected_return_time: string | null;
  scooters: Array<{ model: string; count: number }>;
  shipping_company: string | null;
  ship_arrival_time: string | null;
  ship_return_time: string | null;
  phone: string | null;
  partner: { id: number; name: string } | null;
  payment_method: string | null;
  payment_amount: number;
  remark: string | null;
}

interface Statistics {
  partner_stats: Record<string, { count: number; amount: number }>;
  total_count: number;
  total_amount: number;
  month: string;
}

const StatsModal: React.FC<{ isOpen: boolean; onClose: () => void; stats: Statistics | null }> = ({ isOpen, onClose, stats }) => {
  if (!isOpen || !stats) return null;
  
  const startDate = new Date(stats.month + '-01');
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
            合作商單月詳細統計
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">全平台總業績</p>
                <p className="text-2xl font-black text-blue-800 dark:text-blue-300">${stats.total_amount.toLocaleString()}</p>
             </div>
             <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1">全平台總車次</p>
                <p className="text-2xl font-black text-orange-800 dark:text-orange-300">{stats.total_count} 台</p>
             </div>
          </div>
          <div className="space-y-3">
             <p className="text-sm font-bold text-gray-700 dark:text-gray-300">各店業績分佈</p>
             <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                {Object.entries(stats.partner_stats).map(([partner, data], index) => {
                  // 生成隨機顏色（不重複）
                  const colors = [
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
                    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
                  ];
                  const colorClass = colors[index % colors.length];
                  
                  return (
                    <div key={partner} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center text-xs font-bold`}>
                          {partner.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{partner}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">${data.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{data.count} 台租借</p>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-700">
           <p className="text-xs text-gray-400 dark:text-gray-500 italic">
             統計週期：{startDate.getFullYear()}/{String(startDate.getMonth() + 1).padStart(2, '0')}/01 - {endDate.getFullYear()}/{String(endDate.getMonth() + 1).padStart(2, '0')}/{endDate.getDate()}
           </p>
        </div>
      </div>
    </div>
  );
};

const OrdersPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getMonth() + 1;
  });
  
  // 計算 selectedMonth 字符串（用於 API）
  const selectedMonthString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [monthsWithOrders, setMonthsWithOrders] = useState<number[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<number | null>(null);
  const [statusDropdownPosition, setStatusDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const statusDropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const statusButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});


  // Fetch available years from API
  const fetchYears = async () => {
    try {
      const response = await ordersApi.getYears();
      const years = response.data || [];
      setAvailableYears(years);
      
      // 如果當前選中的年份不在列表中，且列表不為空，則選擇第一個年份
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error('Failed to fetch years:', error);
      // 如果 API 失敗，至少顯示當前年份
      setAvailableYears([selectedYear]);
    }
  };

  // Fetch months with orders for selected year
  const fetchMonthsWithOrders = async (year: number) => {
    try {
      const response = await ordersApi.getMonthsByYear(year);
      setMonthsWithOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch months with orders:', error);
      setMonthsWithOrders([]);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    fetchMonthsWithOrders(selectedYear);
  }, [selectedYear]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await ordersApi.list({
          month: selectedMonthString,
          search: searchTerm || undefined,
          page: currentPage,
        });
        // API 返回結構: { data: [...], meta: {...} }
        // response 本身就是 { data: [...], meta: {...} }
        console.log('API Response:', response);
        const ordersData = response.data || [];
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        if (response.meta) {
          setTotalPages(response.meta.last_page);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [selectedYear, selectedMonth, searchTerm, currentPage]);


  // 滾動時關閉狀態下拉選單
  useEffect(() => {
    const handleScroll = () => {
      if (openStatusDropdownId !== null) {
        setOpenStatusDropdownId(null);
        setStatusDropdownPosition(null);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openStatusDropdownId]);

  // Fetch statistics
  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await ordersApi.statistics(selectedMonthString);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear, selectedMonth]);

  // 點擊外部關閉下拉菜單（現在通過遮罩層處理）
  // 滾動時關閉下拉菜單
  useEffect(() => {
    const handleScroll = () => {
      if (openDropdownId !== null) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openDropdownId]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentPage(1);
    fetchMonthsWithOrders(year);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setCurrentPage(1);
  };

  // 獲取可選的年份列表（從 API 獲取）
  const getAvailableYears = () => {
    // 確保當前選中的年份也在列表中（即使 API 沒有返回）
    const yearsSet = new Set(availableYears);
    yearsSet.add(selectedYear);
    
    // 轉換為數組並排序
    const years = Array.from(yearsSet).sort((a, b) => a - b);
    
    // 如果沒有年份，至少顯示當前年份
    return years.length > 0 ? years : [selectedYear];
  };

  // 獲取可選的月份列表（固定 1-12 月）
  const getAvailableMonths = () => {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsAddModalOpen(true);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleDelete = async (orderId: number) => {
    if (!confirm('確定要刪除此訂單嗎？此操作無法復原。')) {
      return;
    }

    try {
      await ordersApi.delete(orderId);
      // 重新載入訂單列表
      const response = await ordersApi.list({
        month: selectedMonthString,
        search: searchTerm || undefined,
        page: currentPage,
      });
      const ordersData = response.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      if (response.meta) {
        setTotalPages(response.meta.last_page);
      }
      fetchStatistics();
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      // 如果是 404 錯誤（訂單不存在），只顯示警告
      if (error.response?.status === 404) {
        alert('訂單不存在或已被刪除。');
      } else {
        alert('刪除訂單失敗，請稍後再試。');
      }
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const toggleDropdown = (orderId: number) => {
    if (openDropdownId === orderId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[orderId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8, // mt-2 = 8px
          right: window.innerWidth - rect.right,
        });
      }
      setOpenDropdownId(orderId);
    }
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDate = (date: string) => {
    return date;
  };

  return (
    <div className="p-6 max-w-full dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">訂單管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理與統計全平台租賃訂單 (每月上限 200 組一頁)</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 flex items-center shadow-sm">
             <select 
              className="bg-transparent border-none focus:ring-0 text-sm px-4 py-2 cursor-pointer outline-none font-medium text-gray-600 dark:text-gray-300"
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
             >
                {getAvailableYears().map(year => (
                  <option key={year} value={year}>{year} 年</option>
                ))}
             </select>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 flex items-center shadow-sm">
             <select 
              className="bg-transparent border-none focus:ring-0 text-sm px-4 py-2 cursor-pointer outline-none font-medium text-gray-600 dark:text-gray-300"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
             >
                {getAvailableMonths().map(month => (
                  <option 
                    key={month} 
                    value={month}
                    style={monthsWithOrders.includes(month) ? { backgroundColor: '#fed7aa' } : {}}
                  >
                    {month} 月
                  </option>
                ))}
             </select>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
          >
            <Plus size={18} />
            <span>新增訂單</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">合作商單月統計</p>
              <button 
                onClick={() => setIsStatsModalOpen(true)}
                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 transition-colors"
              >
                點擊彈出詳細視窗
              </button>
           </div>
           <Filter size={24} className="text-blue-200 dark:text-blue-600" />
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">單月總台數</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {statsLoading ? <Loader2 size={20} className="animate-spin" /> : (stats?.total_count || 0)} 台
              </p>
           </div>
           <Bike size={24} className="text-orange-200" />
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">單月總金額</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {statsLoading ? <Loader2 size={20} className="animate-spin" /> : `$${(stats?.total_amount || 0).toLocaleString()}`}
              </p>
           </div>
           <FileText size={24} className="text-green-200" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋承租人、電話或訂單號..." 
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 px-2">
            <span>顯示 {orders.length} 筆</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-orange-600" />
            <p className="mt-4 text-gray-500">載入中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                <tr>
                  <th className="px-4 py-4">狀態</th>
                  <th className="px-4 py-4">承租人</th>
                  <th className="px-4 py-4">預約日期</th>
                  <th className="px-4 py-4">租借開始</th>
                  <th className="px-4 py-4">租借結束</th>
                  <th className="px-4 py-4">預計還車</th>
                  <th className="px-4 py-4">租借機車 (款x台)</th>
                  <th className="px-4 py-4">航運(來/回)</th>
                  <th className="px-4 py-4">連絡電話</th>
                  <th className="px-4 py-4">合作商</th>
                  <th className="px-4 py-4">方式/金額</th>
                  <th className="px-4 py-4">備註</th>
                  <th className="px-4 py-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      目前沒有訂單資料
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 group transition-colors">
                    <td className="px-4 py-4">
                      <div className="relative">
                        <button
                          ref={(el) => { statusButtonRefs.current[order.id] = el; }}
                          onClick={() => {
                            if (openStatusDropdownId === order.id) {
                              setOpenStatusDropdownId(null);
                              setStatusDropdownPosition(null);
                            } else {
                              const button = statusButtonRefs.current[order.id];
                              if (button) {
                                const rect = button.getBoundingClientRect();
                                setStatusDropdownPosition({
                                  top: rect.bottom + window.scrollY + 4,
                                  left: rect.left + window.scrollX,
                                });
                              }
                              setOpenStatusDropdownId(order.id);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                            order.status === '進行中' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                            order.status === '已完成' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                            order.status === '已預訂' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' :
                            order.status === '待接送' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                            order.status === '在合作商' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' :
                            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                          }`}
                        >
                          <span>{order.status}</span>
                          <ChevronDown size={14} className={`transition-transform ${openStatusDropdownId === order.id ? 'rotate-180' : ''}`} />
                        </button>
                        
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-gray-900 dark:text-gray-100">{order.tenant}</td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400">{formatDate(order.appointment_date)}</td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400">{formatDateTime(order.start_time)}</td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400">{formatDateTime(order.end_time)}</td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400 font-bold">{formatDateTime(order.expected_return_time)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {order.scooters.map((s, idx) => (
                          <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded-lg text-[10px] w-fit font-medium text-gray-700">
                            {s.model} x {s.count}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs leading-tight">
                      {order.shipping_company && (
                        <>
                          <div className="text-gray-700 font-bold mb-1">{order.shipping_company}</div>
                          {order.ship_arrival_time && (
                            <div className="text-gray-400">來: {formatDateTime(order.ship_arrival_time)}</div>
                          )}
                          {order.ship_return_time && (
                            <div className="text-gray-400">回: {formatDateTime(order.ship_return_time)}</div>
                          )}
                        </>
                      )}
                      {!order.shipping_company && '-'}
                    </td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400 font-medium">{order.phone || '-'}</td>
                    <td className="px-4 py-4 text-orange-600 dark:text-orange-400 font-bold">{order.partner?.name || '-'}</td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{order.payment_method || '-'}</div>
                      <div className="font-black text-gray-900 dark:text-gray-100">${order.payment_amount.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-400 dark:text-gray-500 max-w-[150px] truncate">{order.remark || '-'}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="relative">
                        <button 
                          ref={(el) => { buttonRefs.current[order.id] = el; }}
                          onClick={() => toggleDropdown(order.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 dark:text-gray-500 transition-colors"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/50">
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            本月總計: <span className="font-bold text-orange-600 dark:text-orange-400">{stats?.total_count || 0} 台</span>, 
            總金額: <span className="font-bold text-green-600 dark:text-green-400">${(stats?.total_amount || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold shadow-sm transition-all ${
                      page === currentPage
                        ? 'bg-orange-600 text-white shadow-orange-200'
                        : 'hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <AddOrderModal 
        isOpen={isAddModalOpen} 
        editingOrder={editingOrder}
        onYearChange={(year) => {
          if (year && year !== selectedYear) {
            setSelectedYear(year);
          }
        }}
        onClose={async (appointmentDate) => {
          setIsAddModalOpen(false);
          setEditingOrder(null);
          
          // 重新獲取年份列表（因為可能有新的年份）
          await fetchYears();
          
          // 如果有預約日期，跳轉到該月份
          let monthChanged = false;
          if (appointmentDate) {
            const [year, month] = appointmentDate.split('-').map(Number);
            if (year && month) {
              if (year !== selectedYear || month !== selectedMonth) {
                setSelectedYear(year);
                setSelectedMonth(month);
                setCurrentPage(1);
                fetchMonthsWithOrders(year);
                monthChanged = true;
              }
            }
          }
          
          // 如果月份沒有改變，手動刷新訂單列表和統計
          if (!monthChanged) {
            try {
              const response = await ordersApi.list({
                month: selectedMonthString,
                search: searchTerm || undefined,
                page: currentPage,
              });
              const ordersData = response.data || [];
              setOrders(Array.isArray(ordersData) ? ordersData : []);
              if (response.meta) {
                setTotalPages(response.meta.last_page);
              }
              fetchStatistics();
            } catch (error) {
              console.error('Failed to refresh orders:', error);
            }
          }
          // 如果月份改變了，useEffect 會自動觸發刷新
        }} 
      />
      <StatsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} stats={stats} />
      
      {/* 狀態下拉選單使用 fixed 定位，避免被表格 overflow 裁剪 */}
      {openStatusDropdownId !== null && statusDropdownPosition && orders.find(o => o.id === openStatusDropdownId) && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setOpenStatusDropdownId(null);
              setStatusDropdownPosition(null);
            }}
          />
          <div 
            className="fixed bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[120px] overflow-hidden backdrop-blur-sm"
            style={{
              top: `${statusDropdownPosition.top}px`,
              left: `${statusDropdownPosition.left}px`,
            }}
            ref={(el) => { if (openStatusDropdownId) statusDropdownRefs.current[openStatusDropdownId] = el; }}
          >
            {(() => {
              const order = orders.find(o => o.id === openStatusDropdownId);
              if (!order) return null;
              return (
                <>
                  {['已預訂', '進行中', '待接送', '已完成', '在合作商'].map((status) => (
                    <button
                      key={status}
                      onClick={async () => {
                        if (status !== order.status) {
                          try {
                            // 使用專門的狀態更新 API
                            await ordersApi.updateStatus(order.id, status);
                            // 重新載入訂單列表
                            const response = await ordersApi.list({
                              month: selectedMonthString,
                              search: searchTerm || undefined,
                              page: currentPage,
                            });
                            const ordersData = response.data || [];
                            setOrders(Array.isArray(ordersData) ? ordersData : []);
                            if (response.meta) {
                              setTotalPages(response.meta.last_page);
                            }
                            fetchStatistics();
                          } catch (error) {
                            console.error('Failed to update order status:', error);
                            alert('更新狀態失敗，請稍後再試。');
                          }
                        }
                        setOpenStatusDropdownId(null);
                        setStatusDropdownPosition(null);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                        status === order.status
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* 操作下拉菜單使用 fixed 定位，避免被表格 overflow 裁剪 */}
      {openDropdownId !== null && dropdownPosition && orders.find(o => o.id === openDropdownId) && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setOpenDropdownId(null);
              setDropdownPosition(null);
            }}
          />
          <div 
            className="fixed w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
            ref={(el) => { if (openDropdownId) dropdownRefs.current[openDropdownId] = el; }}
          >
            {(() => {
              const order = orders.find(o => o.id === openDropdownId);
              if (!order) return null;
              return (
                <>
                  <button
                    onClick={() => handleEdit(order)}
                    className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Edit3 size={16} className="text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium">編輯</span>
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium">刪除</span>
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
};

export default OrdersPage;
