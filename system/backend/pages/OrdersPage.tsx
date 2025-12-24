
import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, FileText, ChevronLeft, ChevronRight, MoreHorizontal, Bike, X, TrendingUp } from 'lucide-react';
import { Order, OrderStatus, ShippingCompany, PaymentMethod } from '../types';
import AddOrderModal from '../components/AddOrderModal';

// Mock Data
const MOCK_PARTNERS = ['蘭光', '臺北01出租店', '墾丁店', '澎湖旗艦'];

const MOCK_ORDERS: Order[] = Array.from({ length: 250 }).map((_, i) => ({
  id: `ORD-${2025000 + i}`,
  status: [OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED, OrderStatus.RESERVED][i % 3],
  tenant: `承租人 ${i + 1}`,
  appointmentDate: `2025-01-${(i % 28) + 1}`,
  startTime: `2025-01-${(i % 28) + 1} 09:00`,
  endTime: `2025-01-${(i % 28) + 1} 18:00`,
  expectedReturnTime: `2025-01-${(i % 28) + 1} 18:30`,
  scooters: [
    { model: 'ES-2000', count: Math.floor(Math.random() * 2) + 1 },
    { model: 'EB-500', count: Math.floor(Math.random() * 3) }
  ].filter(s => s.count > 0),
  shippingInfo: {
    company: [ShippingCompany.TAIFU, ShippingCompany.BLUEWHITE][i % 2],
    arrival: '2025-01-15 08:30',
    return: '2025-01-16 17:30'
  },
  phone: `0912345${i.toString().padStart(3, '0')}`,
  partner: MOCK_PARTNERS[i % MOCK_PARTNERS.length],
  payment: {
    method: PaymentMethod.CASH,
    amount: (Math.floor(Math.random() * 5) + 3) * 100
  },
  remark: i % 5 === 0 ? '需要兩頂安全帽' : ''
}));

const StatsModal: React.FC<{ isOpen: boolean; onClose: () => void; stats: any }> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-600" />
            合作商單月詳細統計
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-bold mb-1">全平台總業績</p>
                <p className="text-2xl font-black text-blue-800">${stats.totalAmount.toLocaleString()}</p>
             </div>
             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-600 font-bold mb-1">全平台總車次</p>
                <p className="text-2xl font-black text-orange-800">{stats.totalCount} 次</p>
             </div>
          </div>
          <div className="space-y-3">
             <p className="text-sm font-bold text-gray-700">各店業績分佈</p>
             <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {Object.entries(stats.partnerStats).map(([partner, data]: [any, any]) => (
                  <div key={partner} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        {partner.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{partner}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">${data.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{data.count} 台租借</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
           <p className="text-xs text-gray-400 italic">統計週期：2025/01/01 - 2025/01/31</p>
        </div>
      </div>
    </div>
  );
};

const OrdersPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2025-01');
  const [searchTerm, setSearchTerm] = useState('');

  // Statistics
  const stats = useMemo(() => {
    const partnerStats: Record<string, { count: number; amount: number }> = {};
    let totalCount = 0;
    let totalAmount = 0;

    MOCK_ORDERS.forEach(order => {
      const p = order.partner;
      const bikes = order.scooters.reduce((acc, s) => acc + s.count, 0);
      const amt = order.payment.amount;

      if (!partnerStats[p]) partnerStats[p] = { count: 0, amount: 0 };
      partnerStats[p].count += bikes;
      partnerStats[p].amount += amt;

      totalCount += bikes;
      totalAmount += amt;
    });

    return { partnerStats, totalCount, totalAmount };
  }, [MOCK_ORDERS]);

  return (
    <div className="p-6 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">訂單管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理與統計全平台租賃訂單 (每月上限 200 組一頁)</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-xl border border-gray-200 p-1 flex items-center shadow-sm">
             <select 
              className="bg-transparent border-none focus:ring-0 text-sm px-4 py-2 cursor-pointer outline-none font-medium text-gray-600"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
             >
                <option value="2025-01">2025年 1月</option>
                <option value="2024-12">2024年 12月</option>
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
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs text-gray-500 mb-1">合作商單月統計</p>
              <button 
                onClick={() => setIsStatsModalOpen(true)}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                點擊彈出詳細視窗
              </button>
           </div>
           <Filter size={24} className="text-blue-200" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs text-gray-500 mb-1">單月總台數</p>
              <p className="text-xl font-bold text-gray-800">{stats.totalCount} 台</p>
           </div>
           <Bike size={24} className="text-orange-200" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs text-gray-500 mb-1">單月總金額</p>
              <p className="text-xl font-bold text-gray-800">${stats.totalAmount.toLocaleString()}</p>
           </div>
           <FileText size={24} className="text-green-200" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋承租人、電話或訂單號..." 
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 px-2">
            <span>顯示 1 - 200 之第 200 筆</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
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
              {MOCK_ORDERS.slice(0, 15).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 group transition-colors">
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      order.status === OrderStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-600' :
                      order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold text-gray-900">{order.tenant}</td>
                  <td className="px-4 py-4 text-gray-500">{order.appointmentDate}</td>
                  <td className="px-4 py-4 text-gray-500">{order.startTime}</td>
                  <td className="px-4 py-4 text-gray-500">{order.endTime}</td>
                  <td className="px-4 py-4 text-gray-500 font-bold">{order.expectedReturnTime}</td>
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
                    <div className="text-gray-700 font-bold mb-1">{order.shippingInfo.company}</div>
                    <div className="text-gray-400">來: {order.shippingInfo.arrival}</div>
                    <div className="text-gray-400">回: {order.shippingInfo.return}</div>
                  </td>
                  <td className="px-4 py-4 text-gray-500 font-medium">{order.phone}</td>
                  <td className="px-4 py-4 text-orange-600 font-bold">{order.partner}</td>
                  <td className="px-4 py-4">
                    <div className="text-xs text-gray-400 mb-0.5">{order.payment.method}</div>
                    <div className="font-black text-gray-900">${order.payment.amount}</div>
                  </td>
                  <td className="px-4 py-4 text-gray-400 max-w-[150px] truncate">{order.remark || '-'}</td>
                  <td className="px-4 py-4 text-center">
                    <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div className="text-sm text-gray-500 font-medium">
            本月總計: <span className="font-bold text-orange-600">{stats.totalCount} 台</span>, 
            總金額: <span className="font-bold text-green-600">${stats.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2.5 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-30 transition-all shadow-sm" disabled>
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center space-x-1">
              <button className="w-10 h-10 rounded-xl bg-orange-600 text-white text-sm font-bold shadow-sm shadow-orange-200">1</button>
              <button className="w-10 h-10 rounded-xl hover:bg-white text-sm text-gray-500 font-medium transition-all">2</button>
            </div>
            <button className="p-2.5 border border-gray-200 rounded-xl hover:bg-white transition-all shadow-sm">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <AddOrderModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <StatsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} stats={stats} />
    </div>
  );
};

export default OrdersPage;
