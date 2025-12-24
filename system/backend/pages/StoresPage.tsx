import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, MapPin, Phone, Building, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { storesApi } from '../lib/api';

interface Store {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  manager: string;
  photo_path: string | null;
}

const StoresPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const inputClasses = "w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200 shadow-sm";

  useEffect(() => {
    fetchStores();
  }, [searchTerm]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const response = await storesApi.list(searchTerm ? { search: searchTerm } : undefined);
      setStores(response.data || []);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        address: store.address || '',
        phone: store.phone || '',
        manager: store.manager,
      });
      setPhotoPreview(store.photo_path || null);
    } else {
      setEditingStore(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        manager: '',
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStore(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      manager: '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingStore) {
        await storesApi.update(editingStore.id, formData);
        if (photoFile) {
          await storesApi.uploadPhoto(editingStore.id, photoFile);
        }
      } else {
        const response = await storesApi.create(formData);
        if (photoFile) {
          const storeId = editingStore ? editingStore.id : (response.data?.data?.id || response.data?.id);
          if (storeId) {
            await storesApi.uploadPhoto(storeId, photoFile);
          }
        }
      }
      handleCloseModal();
      fetchStores();
    } catch (error) {
      console.error('Failed to save store:', error);
      alert('儲存失敗，請檢查輸入資料');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此商店嗎？')) return;
    try {
      await storesApi.delete(id);
      fetchStores();
    } catch (error) {
      console.error('Failed to delete store:', error);
      alert('刪除失敗');
    }
  };

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

  return (
    <div className="p-6 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">商店管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理各分店資訊</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>新增商店</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50 flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋商店名稱、地址..." 
              className={inputClasses.replace('shadow-sm', '') + ' pl-11 shadow-none'}
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
                  <th className="px-6 py-5">店面照片</th>
                  <th className="px-6 py-5">商店名稱</th>
                  <th className="px-6 py-5">商店地址</th>
                  <th className="px-6 py-5">聯絡電話</th>
                  <th className="px-6 py-5">商店主管</th>
                  <th className="px-6 py-5 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      目前沒有商店資料
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="w-20 h-12 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                        {store.photo_path ? (
                          <img src={store.photo_path} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-gray-900 dark:text-gray-100 text-base">{store.name}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium">{store.address || '-'}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium tracking-wide">{store.phone || '-'}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-black">{store.manager}</td>
                    <td className="px-6 py-5 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(store)}
                        className="p-2 hover:bg-orange-50 rounded-xl text-orange-600 transition-all font-bold"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(store.id)}
                        className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-all font-bold"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Store Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingStore ? '編輯商店' : '建立商店'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center">
                    <Building size={14} className="mr-1.5" /> 商店名稱 <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={inputClasses} 
                    required 
                    placeholder="例如：琉球總店"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center">
                    <MapPin size={14} className="mr-1.5" /> 商店地址
                  </label>
                  <input 
                    type="text" 
                    className={inputClasses} 
                    placeholder="完整的店址"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center">
                    <Phone size={14} className="mr-1.5" /> 聯絡電話
                  </label>
                  <input 
                    type="tel" 
                    className={inputClasses} 
                    placeholder="09XX-XXX-XXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    商店主管 <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={inputClasses} 
                    required
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">店面形象照片</label>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-10 text-center bg-gray-50/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 hover:border-orange-400 transition-all group cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                   <div className="flex flex-col items-center">
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <ImageIcon size={32} className="text-gray-400 dark:text-gray-500 group-hover:text-orange-500 transition-colors" />
                      </div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">拖放檔案，或者 <span className="text-orange-600 dark:text-orange-400">點擊瀏覽</span></p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">建議比例 16:9, 最高支援 10MB JPG/PNG</p>
                      {photoPreview && (
                        <img src={photoPreview} alt="Preview" className="mt-4 max-w-full max-h-48 rounded-lg" />
                      )}
                   </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end space-x-3 rounded-b-3xl">
              <button onClick={handleCloseModal} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-all">取消</button>
              <button onClick={handleSubmit} className="px-10 py-2.5 bg-gray-900 dark:bg-gray-700 rounded-xl text-sm font-black text-white hover:bg-black dark:hover:bg-gray-600 shadow-lg active:scale-95 transition-all">
                {editingStore ? '確認更新' : '確認建立'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresPage;

