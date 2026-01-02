import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { rentalPlansApi } from '../lib/api';
import { inputClasses, labelClasses, searchInputClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface RentalPlan {
  id: number;
  model: string;
  price: number;
  image_path: string | null;
  sort_order: number;
  is_active: boolean;
}

const RentalPlansPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RentalPlan | null>(null);
  const [plans, setPlans] = useState<RentalPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    model: '',
    price: '',
    sort_order: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [searchTerm]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await rentalPlansApi.list(searchTerm ? { search: searchTerm } : undefined);
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
      });
      setImagePreview(plan.image_path ? `/storage/${plan.image_path}` : null);
    } else {
      setEditingPlan(null);
      setFormData({
        model: '',
        price: '',
        sort_order: 0,
        is_active: true,
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

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜尋型號..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={searchInputClasses}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="aspect-video relative bg-gray-100 dark:bg-gray-700">
                {plan.image_path ? (
                  <img
                    src={`/storage/${plan.image_path}`}
                    alt={plan.model}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="text-gray-400" size={48} />
                  </div>
                )}
                {!plan.is_active && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    已停用
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">{plan.model}</h3>
                <p className="text-2xl font-bold text-orange-600 mb-4">${plan.price}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">排序: {plan.sort_order}</span>
                  <div className="flex space-x-2">
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
                </div>
              </div>
            </div>
          ))}
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
                <label className={labelClasses}>型號 *</label>
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
                <label className={labelClasses}>價錢 *</label>
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
