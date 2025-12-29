import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Search, Bike, Edit3, Trash2, X, Loader2, MoreHorizontal, ChevronDown } from 'lucide-react';
import { scootersApi, storesApi } from '../lib/api';
import { inputClasses, selectClasses, labelClasses, searchInputClasses, chevronDownClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface Scooter {
  id: number;
  store_id: number;
  store?: { id: number; name: string };
  plate_number: string;
  model: string;
  type: string;
  color: string | null;
  status: string;
  photo_path: string | null;
}

interface Store {
  id: number;
  name: string;
}

const ScootersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScooter, setEditingScooter] = useState<Scooter | null>(null);
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    store_id: '',
    plate_number: '',
    model: '',
    type: '白牌',
    color: '',
    status: '待出租',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchScooters();
    fetchStores();
  }, [statusFilter, searchTerm]);

  const fetchScooters = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const response = await scootersApi.list(Object.keys(params).length > 0 ? params : undefined);
      // API returns { data: [...] }, api.get() returns the whole JSON object
      // So response.data is the array
      const scootersData = response.data || [];
      console.log('Fetched scooters:', scootersData); // Debug log
      setScooters(Array.isArray(scootersData) ? scootersData : []);
    } catch (error) {
      console.error('Failed to fetch scooters:', error);
      setScooters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await storesApi.list();
      setStores(response.data || []);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  };

  const handleOpenModal = (scooter?: Scooter) => {
    if (scooter) {
      setEditingScooter(scooter);
      setFormData({
        store_id: String(scooter.store_id),
        plate_number: scooter.plate_number,
        model: scooter.model,
        type: scooter.type,
        color: scooter.color || '',
        status: scooter.status,
      });
      setPhotoPreview(scooter.photo_path || null);
    } else {
      setEditingScooter(null);
      setFormData({
        store_id: '',
        plate_number: '',
        model: '',
        type: '白牌',
        color: '',
        status: '待出租',
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingScooter(null);
    setFormData({
      store_id: '',
      plate_number: '',
      model: '',
      type: '白牌',
      color: '',
      status: '待出租',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.store_id || !formData.plate_number || !formData.model) {
      alert('請填寫必填欄位');
      return;
    }

    try {
      const data = {
        ...formData,
        store_id: parseInt(formData.store_id),
        color: formData.color || null,
      };

      if (editingScooter) {
        await scootersApi.update(editingScooter.id, data);
        if (photoFile) {
          await scootersApi.uploadPhoto(editingScooter.id, photoFile);
        }
      } else {
        const response = await scootersApi.create(data);
        if (photoFile) {
          const scooterId = editingScooter ? editingScooter.id : (response.data?.data?.id || response.data?.id);
          if (scooterId) {
            await scootersApi.uploadPhoto(scooterId, photoFile);
          }
        }
      }
      handleCloseModal();
      fetchScooters();
    } catch (error: any) {
      console.error('Failed to save scooter:', error);
      // 顯示具體的驗證錯誤訊息
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.entries(errors).map(([field, messages]: [string, any]) => {
          const translatedMessages = messages.map((msg: string) => {
            // 翻譯常見的驗證錯誤訊息
            if (msg.includes('already been taken')) {
              if (field === 'plate_number') return '此車牌號碼已被使用';
              return `${field} 已被使用`;
            }
            if (msg.includes('required')) {
              if (field === 'store_id') return '請選擇所屬商店';
              if (field === 'plate_number') return '請輸入車牌號碼';
              if (field === 'model') return '請輸入機車型號';
              return `${field} 為必填欄位`;
            }
            if (msg.includes('does not exist')) {
              if (field === 'store_id') return '所選擇的商店不存在';
              return `${field} 不存在`;
            }
            return msg;
          });
          return translatedMessages.join(', ');
        }).join('\n');
        alert(`儲存失敗：\n${errorMessages}`);
      } else if (error?.response?.data?.message) {
        alert(`儲存失敗：${error.response.data.message}`);
      } else {
        alert('儲存失敗，請檢查輸入資料');
      }
    }
  };

  const toggleDropdown = (scooterId: number) => {
    if (openDropdownId === scooterId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[scooterId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8, // mt-2 = 8px
          right: window.innerWidth - rect.right,
        });
      }
      setOpenDropdownId(scooterId);
    }
  };

  const handleEdit = (scooter: Scooter) => {
    handleOpenModal(scooter);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此機車嗎？此操作無法復原。')) {
      return;
    }
    try {
      await scootersApi.delete(id);
      fetchScooters();
    } catch (error) {
      console.error('Failed to delete scooter:', error);
      alert('刪除失敗，請稍後再試。');
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  // 點擊外部關閉下拉菜單（通過遮罩層處理）
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const statusCounts = {
    all: scooters.length,
    '待出租': scooters.filter(s => s.status === '待出租').length,
    '出租中': scooters.filter(s => s.status === '出租中').length,
    '保養中': scooters.filter(s => s.status === '保養中').length,
  };

  // 計算各機車型號的統計
  const modelStatistics = React.useMemo(() => {
    const stats: Record<string, { total: number; colors: Record<string, number> }> = {};
    
    scooters.forEach(scooter => {
      if (!stats[scooter.model]) {
        stats[scooter.model] = { total: 0, colors: {} };
      }
      stats[scooter.model].total++;
      
      const color = scooter.color || '無顏色';
      if (!stats[scooter.model].colors[color]) {
        stats[scooter.model].colors[color] = 0;
      }
      stats[scooter.model].colors[color]++;
    });
    
    return stats;
  }, [scooters]);

  return (
    <div className="p-6 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">機車管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理車隊清單、保養狀態與車型分類</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>新增機車</span>
        </button>
      </div>

      {/* 機車型號統計 */}
      {Object.keys(modelStatistics).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(modelStatistics).map(([model, stats]) => (
            <div key={model} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 border-l-4 border-orange-500 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                {model}
              </p>
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-3">
                總台數: {stats.total} 台
              </p>
              <div className="space-y-1">
                {Object.entries(stats.colors).map(([color, count]) => (
                  <div key={color} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{color}</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{count} 台</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 bg-gray-50/30 dark:bg-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100 dark:border-gray-700">
           <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
             <button 
               onClick={() => setStatusFilter('')}
               className={`px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                 !statusFilter ? 'bg-orange-600 text-white shadow-sm shadow-orange-100' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
               }`}
             >
               全部 {statusCounts.all}
             </button>
             <button 
               onClick={() => setStatusFilter('待出租')}
               className={`px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                 statusFilter === '待出租' ? 'bg-orange-600 text-white shadow-sm shadow-orange-100' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
               }`}
             >
               待出租 {statusCounts['待出租']}
             </button>
             <button 
               onClick={() => setStatusFilter('出租中')}
               className={`px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                 statusFilter === '出租中' ? 'bg-orange-600 text-white shadow-sm shadow-orange-100' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
               }`}
             >
               出租中 {statusCounts['出租中']}
             </button>
             <button 
               onClick={() => setStatusFilter('保養中')}
               className={`px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                 statusFilter === '保養中' ? 'bg-orange-600 text-white shadow-sm shadow-orange-100' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
               }`}
             >
               保養中 {statusCounts['保養中']}
             </button>
           </div>
           <div className="relative w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋車牌、型號..." 
              className={searchInputClasses}
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
                  <th className="px-6 py-5">機車照片</th>
                  <th className="px-6 py-5">車牌號碼</th>
                  <th className="px-6 py-5">機車型號</th>
                  <th className="px-6 py-5">車款類型</th>
                  <th className="px-6 py-5">顏色</th>
                  <th className="px-6 py-5">所屬商店</th>
                  <th className="px-6 py-5">狀態</th>
                  <th className="px-6 py-5 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scooters.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      目前沒有機車資料
                    </td>
                  </tr>
                ) : (
                  scooters.map((scooter) => (
                    <tr key={scooter.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 group transition-colors">
                      <td className="px-6 py-5">
                        <div className="w-20 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-inner">
                          {scooter.photo_path ? (
                            <img 
                              src={scooter.photo_path} 
                              alt="機車照片" 
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => {
                                setImageViewerUrl(scooter.photo_path);
                                setImageViewerOpen(true);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                              <Bike size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-black text-gray-900 dark:text-gray-100">{scooter.plate_number}</td>
                      <td className="px-6 py-5 text-gray-700 dark:text-gray-300 font-bold">{scooter.model}</td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${
                          scooter.type === '白牌' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                          scooter.type === '電輔車' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          'bg-green-50 text-green-600 border-green-100'
                        }`}>
                          {scooter.type}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium">{scooter.color || '-'}</td>
                      <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium">{scooter.store?.name || '-'}</td>
                      <td className="px-6 py-5">
                         <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black shadow-sm ${
                           scooter.status === '待出租' ? 'bg-green-100 text-green-700' :
                           scooter.status === '出租中' ? 'bg-blue-100 text-blue-700' :
                           'bg-orange-100 text-orange-700'
                         }`}>
                           {scooter.status}
                         </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="relative">
                          <button 
                            ref={(el) => { buttonRefs.current[scooter.id] = el; }}
                            onClick={() => toggleDropdown(scooter.id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">新增機車設備</h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                 <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>
                    所屬商店 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      className={selectClasses}
                      value={formData.store_id}
                      onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                    >
                      <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">請選擇</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{store.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className={chevronDownClasses} />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>
                    車牌號碼 <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={inputClasses} 
                    placeholder="例如: ABC-1234"
                    value={formData.plate_number}
                    onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    機車型號 <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={inputClasses} 
                    placeholder="例如: ES-2000"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    車款顏色 <span className="text-gray-400 dark:text-gray-500 font-normal">(非必填)</span>
                  </label>
                  <input 
                    type="text" 
                    className={inputClasses} 
                    placeholder="例如: 消光黑"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    車款類型 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      className={selectClasses}
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="白牌" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">白牌 (Heavy)</option>
                      <option value="綠牌" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">綠牌 (Light)</option>
                      <option value="電輔車" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">電輔車 (E-Bike)</option>
                    </select>
                    <ChevronDown size={18} className={chevronDownClasses} />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>
                    初始狀態 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      className={selectClasses}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="待出租" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">待出租</option>
                      <option value="出租中" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">出租中</option>
                      <option value="保養中" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">保養中</option>
                    </select>
                    <ChevronDown size={18} className={chevronDownClasses} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">機車外觀照片</label>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-10 bg-gray-50/50 dark:bg-gray-700/30 flex flex-col items-center justify-center hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50/10 dark:hover:bg-gray-700/50 cursor-pointer transition-all group relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                   <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                     <Bike size={32} className="text-gray-400 dark:text-gray-500 group-hover:text-orange-500 transition-colors" />
                   </div>
                   <p className="text-sm font-bold text-gray-700 dark:text-gray-300">點擊或拖放照片至此</p>
                   <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">建議解析度 1280x720 以上的清晰照片</p>
                   {photoPreview && (
                     <img 
                       src={photoPreview} 
                       alt="Preview" 
                       className="mt-4 max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                       onClick={(e) => {
                         e.stopPropagation();
                         setImageViewerUrl(photoPreview);
                         setImageViewerOpen(true);
                       }}
                     />
                   )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3 rounded-b-2xl">
              <button onClick={handleCloseModal} className={modalCancelButtonClasses}>取消</button>
              <button onClick={handleSubmit} className={modalSubmitButtonClasses}>
                {editingScooter ? '確認更新' : '完成建立'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 下拉菜單使用 fixed 定位，避免被表格 overflow 裁剪 */}
      {openDropdownId !== null && dropdownPosition && scooters.find(s => s.id === openDropdownId) && (
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
          >
            {(() => {
              const scooter = scooters.find(s => s.id === openDropdownId);
              if (!scooter) return null;
              return (
                <>
                  <button
                    onClick={() => handleEdit(scooter)}
                    className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Edit3 size={16} className="text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium">編輯</span>
                  </button>
                  <button
                    onClick={() => handleDelete(scooter.id)}
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

      {/* 圖片放大查看器 */}
      {imageViewerOpen && imageViewerUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90" onClick={() => setImageViewerOpen(false)}>
          <button 
            onClick={() => setImageViewerOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={24} />
          </button>
          <img 
            src={imageViewerUrl} 
            alt="Full size" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ScootersPage;
