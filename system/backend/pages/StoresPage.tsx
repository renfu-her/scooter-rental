import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit3, Trash2, MapPin, Phone, Building, Image as ImageIcon, X, Loader2, MoreHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { storesApi } from '../lib/api';
import { inputClasses, labelClasses, searchInputClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface EnvironmentImage {
  id: number;
  image_path: string;
  sort_order: number;
}

interface Store {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  manager: string;
  photo_path: string | null;
  notice: string | null;
  environment_images?: EnvironmentImage[];
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
    notice: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [shouldDeletePhoto, setShouldDeletePhoto] = useState(false);
  const [environmentImages, setEnvironmentImages] = useState<EnvironmentImage[]>([]);
  const [uploadingEnvironmentImage, setUploadingEnvironmentImage] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
  const environmentImageInputRef = useRef<HTMLInputElement>(null);

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
        notice: store.notice || '',
      });
      setPhotoPreview(store.photo_path || null);
      setShouldDeletePhoto(false);
      setEnvironmentImages(store.environment_images || []);
    } else {
      setEditingStore(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        manager: '',
        notice: '',
      });
      setPhotoPreview(null);
      setEnvironmentImages([]);
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
        notice: '',
      });
    setPhotoFile(null);
    setPhotoPreview(null);
    setShouldDeletePhoto(false);
    setEnvironmentImages([]);
  };

  const handleSubmit = async () => {
    try {
      if (editingStore) {
        // 如果要刪除圖片，發送 photo_path: null
        if (shouldDeletePhoto && !photoFile) {
          await storesApi.update(editingStore.id, { ...formData, photo_path: null });
        } else {
          await storesApi.update(editingStore.id, formData);
          if (photoFile) {
            await storesApi.uploadPhoto(editingStore.id, photoFile);
          }
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
    } catch (error: any) {
      console.error('Failed to save store:', error);
      // 顯示具體的驗證錯誤訊息
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join('\n');
        alert(`儲存失敗：\n${errorMessages}`);
      } else if (error?.response?.data?.message) {
        alert(`儲存失敗：${error.response.data.message}`);
      } else {
        alert('儲存失敗，請檢查輸入資料');
      }
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
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleEdit = (store: Store) => {
    handleOpenModal(store);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const toggleDropdown = (storeId: number) => {
    if (openDropdownId === storeId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[storeId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          right: window.innerWidth - rect.right,
        });
      }
      setOpenDropdownId(storeId);
    }
  };

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
      setShouldDeletePhoto(false); // 選擇新圖片時清除刪除標記
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    // 如果是編輯模式且有現有圖片，標記為要刪除
    if (editingStore && editingStore.photo_path) {
      setShouldDeletePhoto(true);
    }
  };

  const handleEnvironmentImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!editingStore) {
      alert('請先建立商店後再上傳環境圖片');
      return;
    }

    setUploadingEnvironmentImage(true);
    try {
      const file = files[0];
      const maxSortOrder = environmentImages.length > 0 
        ? Math.max(...environmentImages.map(img => img.sort_order))
        : -1;
      const response = await storesApi.uploadEnvironmentImage(
        editingStore.id,
        file,
        maxSortOrder + 1
      );
      
      const newImage: EnvironmentImage = {
        id: response.data.id,
        image_path: response.data.image_path,
        sort_order: response.data.sort_order,
      };
      setEnvironmentImages([...environmentImages, newImage].sort((a, b) => a.sort_order - b.sort_order));
      
      // 重置 input
      if (environmentImageInputRef.current) {
        environmentImageInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Failed to upload environment image:', error);
      alert(error?.response?.data?.message || '上傳環境圖片失敗');
    } finally {
      setUploadingEnvironmentImage(false);
    }
  };

  const handleDeleteEnvironmentImage = async (imageId: number) => {
    if (!editingStore) return;
    
    if (!confirm('確定要刪除此環境圖片嗎？')) return;

    try {
      await storesApi.deleteEnvironmentImage(editingStore.id, imageId);
      setEnvironmentImages(environmentImages.filter(img => img.id !== imageId));
    } catch (error: any) {
      console.error('Failed to delete environment image:', error);
      alert(error?.response?.data?.message || '刪除環境圖片失敗');
    }
  };

  const handleMoveEnvironmentImage = async (imageId: number, direction: 'up' | 'down') => {
    if (!editingStore) return;

    const currentIndex = environmentImages.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= environmentImages.length) return;

    const newImages = [...environmentImages];
    const [movedImage] = newImages.splice(currentIndex, 1);
    newImages.splice(newIndex, 0, movedImage);

    // 更新排序
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      sort_order: index,
    }));

    try {
      await storesApi.updateEnvironmentImageOrder(editingStore.id, imageId, updatedImages[currentIndex].sort_order);
      // 同時更新另一個圖片的排序
      const otherImageId = newImages[newIndex].id;
      await storesApi.updateEnvironmentImageOrder(editingStore.id, otherImageId, updatedImages[newIndex].sort_order);
      
      setEnvironmentImages(updatedImages);
    } catch (error: any) {
      console.error('Failed to update environment image order:', error);
      alert(error?.response?.data?.message || '更新排序失敗');
    }
  };

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
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
                  <th className="px-6 py-5">店面照片</th>
                  <th className="px-6 py-5">商店名稱</th>
                  <th className="px-6 py-5">商店地址</th>
                  <th className="px-6 py-5">聯絡電話</th>
                  <th className="px-6 py-5">商店主管</th>
                  <th className="px-6 py-5 text-center">操作</th>
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
                      <div className="w-20 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-inner">
                        {store.photo_path ? (
                          <img 
                            src={store.photo_path} 
                            alt={store.name} 
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setImageViewerUrl(store.photo_path);
                              setImageViewerOpen(true);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-gray-900 dark:text-gray-100 text-base">{store.name}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium">{store.address || '-'}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium tracking-wide">{store.phone || '-'}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-black">{store.manager}</td>
                    <td className="px-6 py-5 text-center">
                      <div className="relative">
                        <button 
                          ref={(el) => { buttonRefs.current[store.id] = el; }}
                          onClick={() => toggleDropdown(store.id)}
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

      {/* Add/Edit Store Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingStore ? '編輯商店' : '建立商店'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={`${labelClasses} flex items-center`}>
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
                  <label className={`${labelClasses} flex items-center`}>
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
                  <label className={`${labelClasses} flex items-center`}>
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
                  <label className={labelClasses}>
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
                <label className={labelClasses}>
                  注意事項
                </label>
                <textarea
                  rows={4}
                  className={inputClasses}
                  placeholder="輸入該商店的注意事項..."
                  value={formData.notice}
                  onChange={(e) => setFormData({ ...formData, notice: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  每個商店可以有一個專屬的注意事項
                </p>
              </div>
              <div>
                <label className={`${labelClasses} mb-3`}>店面形象照片</label>
                <div className={uploadAreaBaseClasses}>
                  {photoPreview ? (
                    <div className="relative">
                      <img src={photoPreview} alt="Preview" className="max-h-48 mx-auto rounded" />
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
                    onChange={handlePhotoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className={`${labelClasses} mb-3`}>環境圖片</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  可以上傳多張環境圖片，用於展示商店環境
                </p>
                {editingStore ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      {environmentImages.map((img, index) => (
                        <div key={img.id} className="relative group">
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <img
                              src={img.image_path}
                              alt={`環境圖片 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleMoveEnvironmentImage(img.id, 'up')}
                                disabled={index === 0}
                                className={`p-2 rounded-full bg-white/90 hover:bg-white transition-colors ${
                                  index === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="上移"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEnvironmentImage(img.id)}
                                className="p-2 rounded-full bg-red-500/90 hover:bg-red-600 text-white transition-colors"
                                title="刪除"
                              >
                                <X size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveEnvironmentImage(img.id, 'down')}
                                disabled={index === environmentImages.length - 1}
                                className={`p-2 rounded-full bg-white/90 hover:bg-white transition-colors ${
                                  index === environmentImages.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="下移"
                              >
                                <ArrowDown size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={uploadAreaBaseClasses}>
                      {uploadingEnvironmentImage ? (
                        <div className="text-center py-8">
                          <Loader2 className="mx-auto text-orange-600 animate-spin mb-2" size={24} />
                          <p className="text-sm text-gray-500">上傳中...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="mx-auto text-gray-400 mb-2" size={32} />
                          <p className="text-sm text-gray-500">點擊或拖放圖片到此處上傳環境圖片</p>
                        </div>
                      )}
                      <input
                        ref={environmentImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEnvironmentImageChange}
                        disabled={uploadingEnvironmentImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      請先建立商店後再上傳環境圖片
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end space-x-3 rounded-b-3xl flex-shrink-0">
              <button onClick={handleCloseModal} className={modalCancelButtonClasses}>取消</button>
              <button onClick={handleSubmit} className={modalSubmitButtonClasses}>
                {editingStore ? '確認更新' : '確認建立'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 操作下拉菜單使用 fixed 定位，避免被表格 overflow 裁剪 */}
      {openDropdownId !== null && dropdownPosition && stores.find(s => s.id === openDropdownId) && (
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
              const store = stores.find(s => s.id === openDropdownId);
              if (!store) return null;
              return (
                <>
                  <button
                    onClick={() => handleEdit(store)}
                    className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Edit3 size={16} className="text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium">編輯</span>
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
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

export default StoresPage;

