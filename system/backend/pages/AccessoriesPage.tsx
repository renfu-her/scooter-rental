import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Package, Edit3, Trash2, ShieldCheck, ShoppingBag, Smartphone, CloudRain, X, Loader2, MoreHorizontal } from 'lucide-react';
import { accessoriesApi } from '../lib/api';

interface Accessory {
  id: number;
  name: string;
  category: '防護' | '配件' | '雨具' | '其他';
  stock: number;
  rent_price: number;
  status: '充足' | '低庫存' | '缺貨';
}

interface Statistics {
  total_categories: number;
  total_items: number;
  total_stock: number;
  out_of_stock: number;
  low_stock: number;
  categories: Record<string, number>;
}

const AccessoriesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [formData, setFormData] = useState({
    name: '',
    category: '防護' as '防護' | '配件' | '雨具' | '其他',
    stock: '',
    rent_price: '',
  });

  const inputClasses = "w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200 shadow-sm";
  
  // Select 專用樣式（確保選項在 dark 模式下清楚可見）
  const selectClasses = "w-full px-4 py-2.5 pr-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-gray-900 dark:text-gray-100 appearance-none cursor-pointer shadow-sm";

  useEffect(() => {
    fetchAccessories();
    fetchStatistics();
  }, [searchTerm]);

  useEffect(() => {
    const handleScroll = () => {
      if (openDropdownId !== null) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [openDropdownId]);

  const fetchAccessories = async () => {
    setLoading(true);
    try {
      const response = await accessoriesApi.list(searchTerm ? { search: searchTerm } : undefined);
      const accessoriesData = response.data?.data || response.data || [];
      setAccessories(Array.isArray(accessoriesData) ? accessoriesData : []);
    } catch (error) {
      console.error('Failed to fetch accessories:', error);
      setAccessories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await accessoriesApi.statistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleOpenModal = (accessory?: Accessory) => {
    if (accessory) {
      setEditingAccessory(accessory);
      setFormData({
        name: accessory.name,
        category: accessory.category,
        stock: String(accessory.stock),
        rent_price: String(accessory.rent_price),
      });
    } else {
      setEditingAccessory(null);
      setFormData({
        name: '',
        category: '防護',
        stock: '',
        rent_price: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccessory(null);
    setFormData({
      name: '',
      category: '防護',
      stock: '',
      rent_price: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.stock || formData.rent_price === '') {
      alert('請填寫必填欄位');
      return;
    }

    try {
      const data = {
        name: formData.name,
        category: formData.category,
        stock: parseInt(formData.stock),
        rent_price: parseFloat(formData.rent_price),
      };

      if (editingAccessory) {
        await accessoriesApi.update(editingAccessory.id, data);
      } else {
        await accessoriesApi.create(data);
      }
      handleCloseModal();
      fetchAccessories();
      fetchStatistics();
    } catch (error) {
      console.error('Failed to save accessory:', error);
      alert('儲存失敗，請檢查輸入資料');
    }
  };

  const toggleDropdown = (id: number) => {
    if (openDropdownId === id) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[id];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          right: window.innerWidth - rect.right + window.scrollX,
        });
        setOpenDropdownId(id);
      }
    }
  };

  const handleEdit = (accessory: Accessory) => {
    setOpenDropdownId(null);
    setDropdownPosition(null);
    handleOpenModal(accessory);
  };

  const handleDelete = async (id: number) => {
    setOpenDropdownId(null);
    setDropdownPosition(null);
    if (!confirm('確定要刪除此配件嗎？')) return;
    try {
      await accessoriesApi.delete(id);
      fetchAccessories();
      fetchStatistics();
    } catch (error) {
      console.error('Failed to delete accessory:', error);
      alert('刪除失敗');
    }
  };

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
    <div className="p-6 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">機車配件管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理安全帽、雨具與各類加購/借用配件庫存</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>新增配件</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '配件類別', value: `${statistics?.total_categories || 0} 種`, color: 'border-blue-500' },
          { label: '總庫存量', value: `${statistics?.total_stock || 0} 件`, color: 'border-gray-500' },
          { label: '缺貨品項', value: `${statistics?.out_of_stock || 0} 件`, valueColor: 'text-red-600', color: 'border-red-500' },
          { label: '低庫存預警', value: `${statistics?.low_stock || 0} 件`, valueColor: 'text-orange-600', color: 'border-orange-500' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 border-l-4 ${stat.color} shadow-sm transition-transform hover:-translate-y-1`}>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.valueColor || 'text-gray-900 dark:text-gray-100'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 bg-gray-50/30 dark:bg-gray-800/50 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋配件名稱或規格..." 
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200 shadow-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider text-[11px]">
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
                {accessories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      目前沒有配件資料
                    </td>
                  </tr>
                ) : (
                  accessories.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-5 font-black text-gray-900 dark:text-gray-100 text-base">{item.name}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2 font-bold text-gray-600">
                          {getCategoryIcon(item.category)}
                          <span>{item.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-gray-700 dark:text-gray-300 font-black tracking-tight">{item.stock} <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">件</span></td>
                      <td className="px-6 py-5 font-bold text-gray-900 dark:text-gray-100">${item.rent_price}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black shadow-sm ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="relative">
                          <button 
                            ref={(el) => { buttonRefs.current[item.id] = el; }}
                            onClick={() => toggleDropdown(item.id)}
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
      </div>

      {/* 操作下拉菜單使用 fixed 定位，避免被表格 overflow 裁剪 */}
      {openDropdownId !== null && dropdownPosition && accessories.find(a => a.id === openDropdownId) && (
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
              const accessory = accessories.find(a => a.id === openDropdownId);
              if (!accessory) return null;
              return (
                <>
                  <button
                    onClick={() => handleEdit(accessory)}
                    className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Edit3 size={16} className="text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium">編輯</span>
                  </button>
                  <button
                    onClick={() => handleDelete(accessory.id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg relative animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingAccessory ? '編輯配件設備' : '新增配件設備'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">配件完整名稱 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className={inputClasses} 
                  placeholder="例如：半罩式透氣安全帽"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">所屬類別 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      className={selectClasses}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    >
                      <option value="防護" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">防護</option>
                      <option value="配件" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">配件</option>
                      <option value="雨具" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">雨具</option>
                      <option value="其他" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">其他</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">初始庫存量 <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    className={inputClasses} 
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">每日加購租金 (TWD) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  className={inputClasses} 
                  placeholder="50"
                  value={formData.rent_price}
                  onChange={(e) => setFormData({ ...formData, rent_price: e.target.value })}
                />
                <p className="mt-1 text-[10px] text-gray-400 italic">若為免費提供請填寫 0</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end space-x-3 rounded-b-3xl">
              <button onClick={handleCloseModal} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-all">取消</button>
              <button onClick={handleSubmit} className="px-10 py-2.5 bg-gray-900 dark:bg-gray-700 rounded-xl text-sm font-black text-white hover:bg-black dark:hover:bg-gray-600 shadow-lg active:scale-95 transition-all">
                {editingAccessory ? '確認更新' : '建立並存檔'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessoriesPage;
