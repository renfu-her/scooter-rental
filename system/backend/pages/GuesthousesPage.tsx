import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { guesthousesApi } from '../lib/api';
import { inputClasses, labelClasses, searchInputClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';
import CKEditorComponent from '../components/CKEditor';

interface Guesthouse {
  id: number;
  name: string;
  description: string | null;
  short_description: string | null;
  image_path: string | null;
  images: string[] | null;
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
    short_description: '',
    link: '',
    sort_order: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
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
        short_description: guesthouse.short_description || '',
        link: guesthouse.link || '',
        sort_order: guesthouse.sort_order,
        is_active: guesthouse.is_active,
      });
      setImagePreview(guesthouse.image_path ? `/storage/${guesthouse.image_path}` : null);
      setExistingImages(guesthouse.images && Array.isArray(guesthouse.images) ? guesthouse.images.map(img => `/storage/${img}`) : []);
    } else {
      setEditingGuesthouse(null);
      setFormData({
        name: '',
        description: '',
        short_description: '',
        link: '',
        sort_order: 0,
        is_active: true,
      });
      setImagePreview(null);
      setExistingImages([]);
    }
    setImageFile(null);
    setImageFiles([]);
    setImagePreviews([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGuesthouse(null);
    setFormData({
      name: '',
      description: '',
      short_description: '',
      link: '',
      sort_order: 0,
      is_active: true,
    });
    setImageFile(null);
    setImagePreview(null);
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
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
        if (imageFiles.length > 0) {
          await guesthousesApi.uploadImages(editingGuesthouse.id, imageFiles);
        }
      } else {
        const response = await guesthousesApi.create(submitData);
        if (imageFile && response.data) {
          await guesthousesApi.uploadImage(response.data.id, imageFile);
        }
        if (imageFiles.length > 0 && response.data) {
          await guesthousesApi.uploadImages(response.data.id, imageFiles);
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

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles([...imageFiles, ...files]);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImagePreview = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imagePath: string) => {
    if (!editingGuesthouse) return;
    if (!confirm('確定要刪除此圖片嗎？')) return;
    
    try {
      // Extract the path without /storage/ prefix
      const path = imagePath.replace('/storage/', '');
      await guesthousesApi.deleteImage(editingGuesthouse.id, path);
      setExistingImages(existingImages.filter(img => img !== imagePath));
      await fetchGuesthouses();
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      alert(error.message || '刪除圖片失敗');
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
      ) : guesthouses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">目前沒有民宿推薦</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">圖片</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">名稱</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">簡短說明</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">連結</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">排序</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">狀態</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {guesthouses.map((guesthouse) => (
                  <tr key={guesthouse.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      {guesthouse.image_path ? (
                        <div className="w-20 h-12 rounded overflow-hidden">
                          <img
                            src={`/storage/${guesthouse.image_path}`}
                            alt={guesthouse.name}
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
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{guesthouse.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{guesthouse.short_description || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {guesthouse.link ? (
                        <a href={guesthouse.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          {guesthouse.link}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{guesthouse.sort_order}</span>
                    </td>
                    <td className="px-6 py-4">
                      {guesthouse.is_active ? (
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
                <label className={labelClasses}>簡短說明</label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className={inputClasses}
                  placeholder="輸入簡短說明..."
                  maxLength={255}
                />
              </div>

              <div>
                <label className={labelClasses}>描述</label>
                <div className="mt-1">
                  <CKEditorComponent
                    value={formData.description}
                    onChange={(data) => setFormData({ ...formData, description: data })}
                    placeholder="輸入民宿描述..."
                  />
                </div>
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

              <div>
                <label className={labelClasses}>多張圖片（可上傳多張，最多 10 張）</label>
                <div className="space-y-4">
                  {/* 現有圖片 */}
                  {existingImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt={`Existing ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(img)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 新上傳的圖片預覽 */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => removeImagePreview(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 上傳區域 */}
                  <div className={uploadAreaBaseClasses}>
                    <div className="text-center">
                      <ImageIcon className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-500">點擊或拖放多張圖片到此處</p>
                      <p className="text-xs text-gray-400 mt-1">可選擇多張圖片（最多 10 張）</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
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
