
import React, { useState } from 'react';
import { Search, Plus, Package, Edit, Trash2, ShieldCheck, ShoppingBag, Smartphone, CloudRain, X } from 'lucide-react';

interface Accessory {
  id: string;
  name: string;
  category: '防護' | '配件' | '雨具' | '其他';
  stock: number;
  rentPrice: number;
  status: '充足' | '低庫存' | '缺貨';
}

const AccessoriesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const inputClasses = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 shadow-sm";

  const accessories: Accessory[] = [
    { id: '1', name: '全罩式安全帽', category: '防護', stock: 45, rentPrice: 100, status: '充足' },
    { id: '2', name: '半罩式安全帽', category: '防護', stock: 120, rentPrice: 50, status: '充足' },
    { id: '3', name: '通用手機架', category: '配件', stock: 8, rentPrice: 30, status: '低庫存' },
    { id: '4', name: '拋棄式雨衣', category: '雨具', stock: 0, rentPrice: 20, status: '缺貨' },
    { id: '5', name: '機車大鎖', category: '其他', stock: 30, rentPrice: 0, status: '充足' },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '防護': return <ShieldCheck className="text-blue-500" size={18} />;
      case '配件': return <Smartphone className="text-purple-500" size={18} />;
      case '雨具': return <CloudRain className="text-cyan-500" size={18} />;
      default: return <ShoppingBag className="text-gray-500" size={18} />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case '充足': return 'bg-green-100 text-green-700';
      case '低庫存': return 'bg-orange-100 text-orange-700';
      case '缺貨': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">機車配件管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理安全帽、雨具與各類加購/借用配件庫存</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>新增配件</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '配件類別', value: '4 種', color: 'border-blue-500' },
          { label: '總庫存量', value: '203 件', color: 'border-gray-500' },
          { label: '缺貨品項', value: '1 件', valueColor: 'text-red-600', color: 'border-red-500' },
          { label: '低庫存預警', value: '1 件', valueColor: 'text-orange-600', color: 'border-orange-500' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white p-5 rounded-2xl border border-gray-200 border-l-4 ${stat.color} shadow-sm transition-transform hover:-translate-y-1`}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.valueColor || 'text-gray-900'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-gray-50/30 flex justify-between items-center border-b border-gray-100">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋配件名稱或規格..." 
              className={inputClasses.replace('shadow-sm', '') + ' pl-11 shadow-none'}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-5">配件名稱</th>
                <th className="px-6 py-5">類別</th>
                <th className="px-6 py-5">目前庫存</th>
                <th className="px-6 py-5">租借單價</th>
                <th className="px-6 py-5">狀態</th>
                <th className="px-6 py-5 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accessories.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5 font-black text-gray-900 text-base">{item.name}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2 font-bold text-gray-600">
                      {getCategoryIcon(item.category)}
                      <span>{item.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-700 font-black tracking-tight">{item.stock} <span className="text-[10px] text-gray-400 font-medium">件</span></td>
                  <td className="px-6 py-5 font-bold text-gray-900">${item.rentPrice}</td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black shadow-sm ${getStatusStyle(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">新增配件設備</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">配件完整名稱</label>
                <input type="text" className={inputClasses} placeholder="例如：半罩式透氣安全帽" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">所屬類別</label>
                  <select className={inputClasses}>
                    <option>防護</option>
                    <option>配件</option>
                    <option>雨具</option>
                    <option>其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">初始庫存量</label>
                  <input type="number" className={inputClasses} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">每日加購租金 (TWD)</label>
                <input type="number" className={inputClasses} placeholder="50" />
                <p className="mt-1 text-[10px] text-gray-400 italic">若為免費提供請填寫 0</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3 rounded-b-3xl">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-white transition-all">取消</button>
              <button className="px-10 py-2.5 bg-gray-900 rounded-xl text-sm font-black text-white hover:bg-black shadow-lg active:scale-95 transition-all">建立並存檔</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessoriesPage;
