import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { locationsApi, storesApi } from '../lib/api';
import { useStore } from '../contexts/StoreContext';
import { inputClasses, labelClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses, selectClasses } from '../styles';

interface Location {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  hours: string | null;
  description: string | null;
  image_path: string | null;
  map_embed: string | null;
  sort_order: number;
  is_active: boolean;
  store_id?: number | null;
  store?: { id: number; name: string } | null;
}

interface Store {
  id: number;
  name: string;
}

const LocationsPage: React.FC = () => {
  const { currentStore } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<number | ''>('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    hours: '',
    description: '',
    map_embed: '',
    sort_order: 0,
    is_active: true,
    store_id: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [selectedStoreFilter]);

  const fetchStores = async () => {
    try {
      const response = await storesApi.list();
      setStores(response.data || []);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const params: any = {};
      const storeId = selectedStoreFilter || currentStore?.id;
      if (storeId) params.store_id = storeId;
      const response = await locationsApi.list(params);
      setLocations(response.data || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name || '',
        address: location.address || '',
        phone: location.phone || '',
        hours: location.hours || '',
        description: location.description || '',
        map_embed: location.map_embed || '',
        sort_order: location.sort_order || 0,
        is_active: location.is_active ?? true,
        store_id: location.store_id?.toString() || currentStore?.id.toString() || '',
      });
      setImagePreview(location.image_path ? `/storage/${location.image_path}` : null);
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        hours: '',
        description: '',
        map_embed: '',
        sort_order: 0,
        is_active: true,
        store_id: currentStore?.id.toString() || '',
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，防止觸發 file input
    e.preventDefault(); // 阻止默認行為
    if (!confirm('確定要刪除此圖片嗎？')) return;

    if (editingLocation && editingLocation.image_path) {
      try {
        setUploading(true);
        // 更新 location，將 image_path 設為 null
        const response = await locationsApi.update(editingLocation.id, {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          hours: formData.hours,
          description: formData.description,
          map_embed: formData.map_embed,
          image_path: null,
          sort_order: parseInt(formData.sort_order.toString()),
          is_active: formData.is_active,
        });
        // 更新本地狀態
        setImagePreview(null);
        setImageFile(null);
        // 更新編輯中的 location
        if (response.data) {
          setEditingLocation(response.data);
        }
        // 重新獲取資料列表
        await fetchLocations();
      } catch (error: any) {
        console.error('Failed to delete image:', error);
        alert(error.message || '刪除圖片失敗');
      } finally {
        setUploading(false);
      }
    } else {
      // 如果是新上傳的圖片（還沒儲存），直接清除預覽
      setImagePreview(null);
      setImageFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const submitData = {
        ...formData,
        sort_order: parseInt(formData.sort_order.toString()),
        store_id: formData.store_id || currentStore?.id || null,
      };

      if (editingLocation) {
        await locationsApi.update(editingLocation.id, submitData);
        if (imageFile) {
          await locationsApi.uploadImage(editingLocation.id, imageFile);
        }
      } else {
        const response = await locationsApi.create(submitData);
        if (imageFile && response.data) {
          await locationsApi.uploadImage(response.data.id, imageFile);
        }
      }

      await fetchLocations();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save location:', error);
      alert(error.message || '儲存失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此門市據點嗎？')) return;

    try {
      await locationsApi.delete(id);
      await fetchLocations();
    } catch (error: any) {
      console.error('Failed to delete location:', error);
      alert(error.message || '刪除失敗');
    }
  };

  if (loading) {
    return (
      <div className="px-6 pb-6 pt-0 dark:text-gray-100">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">門市據點管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理官網門市據點資訊</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={18} />
          新增門市據點
        </button>
      </div>

      <div className="mb-6">
        <div className="relative min-w-[200px] max-w-[300px]">
          <select
            value={selectedStoreFilter}
            onChange={(e) => setSelectedStoreFilter(e.target.value ? Number(e.target.value) : '')}
            className={selectClasses}
          >
            <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">所有商店</option>
            {stores.map(store => (
              <option key={store.id} value={store.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{store.name}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">目前沒有門市據點</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">圖片</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">門市名稱</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">地址</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">電話</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">營業時間</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">商店</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">排序</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">狀態</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {locations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      {location.image_path ? (
                        <div className="w-20 h-12 rounded overflow-hidden">
                          <img
                            src={`/storage/${location.image_path}`}
                            alt={location.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <ImageIcon className="text-gray-400" size={20} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{location.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{location.address || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{location.phone || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{location.hours || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{location.store?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{location.sort_order}</span>
                    </td>
                    <td className="px-6 py-4">
                      {location.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          啟用
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          停用
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(location)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingLocation ? '編輯門市據點' : '新增門市據點'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className={labelClasses}>商店選擇</label>
                <div className="relative">
                  <select 
                    className={selectClasses}
                    value={formData.store_id}
                    onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                  >
                    <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">請選擇商店（非必選）</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{store.name}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              <div>
                <label className={labelClasses}>門市名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: 蘭光電動機車小琉球店"
                />
              </div>

              <div>
                <label className={labelClasses}>地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: 屏東縣琉球鄉相埔路86之5"
                />
              </div>

              <div>
                <label className={labelClasses}>電話</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: 08-861-2345"
                />
              </div>

              <div>
                <label className={labelClasses}>營業時間</label>
                <input
                  type="text"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: 每日 08:00 - 18:00"
                />
              </div>

              <div>
                <label className={labelClasses}>描述 (HTML)</label>
                <textarea
                  rows={8}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={inputClasses}
                  placeholder="輸入 HTML 描述內容..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  支援 HTML 格式，可使用 HTML 標籤進行格式化
                </p>
              </div>

              <div>
                <label className={labelClasses}>Google 地圖嵌入代碼</label>
                <textarea
                  rows={4}
                  value={formData.map_embed}
                  onChange={(e) => setFormData({ ...formData, map_embed: e.target.value })}
                  className={inputClasses}
                  placeholder="貼上 Google Maps 的 iframe 嵌入代碼"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  從 Google Maps 取得嵌入地圖的 iframe 代碼，直接貼上即可
                </p>
              </div>

              <div>
                <label className={labelClasses}>圖片</label>
                <div className={uploadAreaBaseClasses}>
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 z-10 hover:bg-red-600 transition-colors"
                        title="刪除圖片"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-500">點擊或拖放圖片到此處</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>排序</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className={inputClasses}
                    min="0"
                  />
                </div>
                <div>
                  <label className={labelClasses}>狀態</label>
                  <select
                    value={formData.is_active ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                    className={inputClasses}
                  >
                    <option value="1">啟用</option>
                    <option value="0">停用</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={modalCancelButtonClasses}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className={modalSubmitButtonClasses}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <span>{editingLocation ? '更新' : '新增'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationsPage;
