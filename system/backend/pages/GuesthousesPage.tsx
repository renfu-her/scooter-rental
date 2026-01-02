import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { guesthousesApi } from '../lib/api';
import { inputClasses, labelClasses, searchInputClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface Guesthouse {
  id: number;
  name: string;
  description: string | null;
  image_path: string | null;
  link: string | null;
  sort_order: number;
  is_active: boolean;
}

const GuesthousesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuesthouse, setEditingGuesthouse] = useState<Guesthouse | null>(null);
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    link: '',
    sort_order: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchGuesthouses();
  }, [searchTerm]);

  const fetchGuesthouses = async () => {
    setLoading(true);
    try {
      const response = await guesthousesApi.list(searchTerm ? { search: searchTerm } : undefined);
      setGuesthouses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch guesthouses:', error);
      setGuesthouses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (guesthouse?: Guesthouse) => {
    if (guesthouse) {
      setEditingGuesthouse(guesthouse);
      setFormData({
        name: guesthouse.name,
        description: guesthouse.description || '',
        link: guesthouse.link || '',
        sort_order: guesthouse.sort_order,
        is_active: guesthouse.is_active,
      });
      setImagePreview(guesthouse.image_path ? `/storage/${guesthouse.image_path}` : null);
    } else {
      setEditingGuesthouse(null);
      setFormData({
        name: '',
        description: '',
        link: '',
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
    setEditingGuesthouse(null);
    setFormData({
      name: '',
      description: '',
      link: '',
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
        sort_order: parseInt(formData.sort_order.toString()),
      };

      if (editingGuesthouse) {
        await guesthousesApi.update(editingGuesthouse.id, submitData);
        if (imageFile) {
          await guesthousesApi.uploadImage(editingGuesthouse.id, imageFile);
        }
      } else {
        const response = await guesthousesApi.create(submitData);
        if (imageFile && response.data) {
          await guesthousesApi.uploadImage(response.data.id, imageFile);
        }
      }

      await fetchGuesthouses();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save guesthouse:', error);
      alert(error.message || '儲存失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此民宿推薦嗎？')) return;

    try {
      await guesthousesApi.delete(id);
      await fetchGuesthouses();
    } catch (error: any) {
      console.error('Failed to delete guesthouse:', error);
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">民宿推薦管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理官網民宿推薦資訊</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>新增民宿</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜尋民宿名稱或描述..."
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
          {guesthouses.map((guesthouse) => (
            <div key={guesthouse.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="aspect-video relative bg-gray-100 dark:bg-gray-700">
                {guesthouse.image_path ? (
                  <img
                    src={`/storage/${guesthouse.image_path}`}
                    alt={guesthouse.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="text-gray-400" size={48} />
                  </div>
                )}
                {!guesthouse.is_active && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    已停用
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{guesthouse.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {guesthouse.description || '無描述'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">排序: {guesthouse.sort_order}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(guesthouse)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(guesthouse.id)}
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
                {editingGuesthouse ? '編輯民宿推薦' : '新增民宿推薦'}
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
                <label className={labelClasses}>民宿名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: 海景民宿 A"
                />
              </div>

              <div>
                <label className={labelClasses}>描述</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={inputClasses}
                  placeholder="輸入民宿描述..."
                />
              </div>

              <div>
                <label className={labelClasses}>連結</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: https://example.com"
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

export default GuesthousesPage;
