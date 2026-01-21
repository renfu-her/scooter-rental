import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { rentalPlansApi, storesApi } from '../lib/api';
import { inputClasses, labelClasses, searchInputClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses, selectClasses, chevronDownClasses } from '../styles';

interface RentalPlan {
  id: number;
  model: string;
  price: number;
  image_path: string | null;
  sort_order: number;
  is_active: boolean;
  store_id?: number | null;
  store?: { id: number; name: string; notice?: string | null } | null;
}

interface Store {
  id: number;
  name: string;
  notice?: string | null;
}

const RentalPlansPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RentalPlan | null>(null);
  const [plans, setPlans] = useState<RentalPlan[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');
  const [formData, setFormData] = useState({
    model: '',
    price: '',
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

  // 當 selectedStoreId 改變時，確保它被設置
  useEffect(() => {
    if (stores.length > 0 && selectedStoreId === '') {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  useEffect(() => {
    fetchPlans();
  }, [searchTerm, selectedStoreId]);

  const fetchStores = async () => {
    try {
      const response = await storesApi.list();
      const sortedStores = (response.data || []).sort((a: Store, b: Store) => a.id - b.id);
      setStores(sortedStores);
      // 如果有很多店家，預設選擇第一個店家
      if (sortedStores.length > 0 && selectedStoreId === '') {
        setSelectedStoreId(sortedStores[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      // 根據選擇的店家過濾
      if (selectedStoreId) {
        params.store_id = selectedStoreId;
      }
      const response = await rentalPlansApi.list(params);
      setPlans(response.data || []);
    } catch (error) {
      console.error('Failed to fetch rental plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan?: RentalPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        model: plan.model,
        price: plan.price.toString(),
        sort_order: plan.sort_order,
        is_active: plan.is_active,
        store_id: plan.store_id?.toString() || selectedStoreId?.toString() || '',
      });
      setImagePreview(plan.image_path ? `/storage/${plan.image_path}` : null);
    } else {
      setEditingPlan(null);
      setFormData({
        model: '',
        price: '',
        sort_order: 0,
        is_active: true,
        store_id: selectedStoreId?.toString() || '',
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
      setFormData({
        model: '',
        price: '',
        sort_order: 0,
        is_active: true,
        store_id: selectedStoreId?.toString() || '',
      });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        sort_order: parseInt(formData.sort_order.toString()),
        store_id: formData.store_id ? parseInt(formData.store_id.toString()) : (selectedStoreId ? parseInt(selectedStoreId.toString()) : null),
      };

      if (editingPlan) {
        await rentalPlansApi.update(editingPlan.id, submitData);
        if (imageFile) {
          await rentalPlansApi.uploadImage(editingPlan.id, imageFile);
        }
      } else {
        const response = await rentalPlansApi.create(submitData);
        if (imageFile && response.data) {
          await rentalPlansApi.uploadImage(response.data.id, imageFile);
        }
      }

      await fetchPlans();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save rental plan:', error);
      alert(error.message || '儲存失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此租車方案嗎？')) return;

    try {
      await rentalPlansApi.delete(id);
      await fetchPlans();
    } catch (error: any) {
      console.error('Failed to delete rental plan:', error);
      alert(error.message || '刪除失敗');
    }
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

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">租車方案管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理官網租車方案資訊</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>新增方案</span>
        </button>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜尋型號或店家..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={searchInputClasses}
          />
        </div>
        <div className="relative min-w-[200px]">
          {stores.length === 0 ? (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400">
              沒有店家
            </div>
          ) : (
            <>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : '')}
                className={selectClasses}
              >
                {stores.map(store => (
                  <option key={store.id} value={store.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{store.name}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">目前沒有租車方案</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">商店</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">圖片</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">型號</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">價格</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">排序</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">狀態</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{plan.store?.name || '沒有店家'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {plan.image_path ? (
                        <div className="w-20 h-12 rounded overflow-hidden">
                          <img
                            src={`/storage/${plan.image_path}`}
                            alt={plan.model}
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
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{plan.model}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-orange-600">${Math.floor(plan.price)} / 24H</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{plan.sort_order}</span>
                    </td>
                    <td className="px-6 py-4">
                      {plan.is_active ? (
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
                          onClick={() => handleOpenModal(plan)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingPlan ? '編輯租車方案' : '新增租車方案'}
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
                <label className={labelClasses}>型號 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: VIVA MIX 白牌"
                />
              </div>

              <div>
                <label className={labelClasses}>價錢 <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: 800"
                />
              </div>

              <div>
                <label className={labelClasses}>排序</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className={labelClasses}>啟用</span>
                </label>
              </div>

              <div>
                <label className={labelClasses}>圖片</label>
                <div className={uploadAreaBaseClasses}>
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
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

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={modalCancelButtonClasses}
                  disabled={uploading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className={modalSubmitButtonClasses}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : '儲存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalPlansPage;
