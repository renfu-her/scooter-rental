import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, X, Loader2, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { shuttleImagesApi } from '../lib/api';
import { labelClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface ShuttleImage {
  id: number;
  image_path: string;
  sort_order: number;
}

const ShuttleImagesPage: React.FC = () => {
  const [images, setImages] = useState<ShuttleImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await shuttleImagesApi.list();
      const fetchedImages = response.data || [];
      
      // 檢查是否有重複的排序值，如果有則重新分配
      const sortOrders = fetchedImages.map(img => img.sort_order);
      const hasDuplicates = sortOrders.length !== new Set(sortOrders).size;
      
      if (hasDuplicates && fetchedImages.length > 0) {
        // 重新分配排序值：0, 1, 2, 3...
        const updates = fetchedImages.map((img, index) => 
          shuttleImagesApi.update(img.id, { sort_order: index })
        );
        await Promise.all(updates);
        // 重新獲取列表
        const updatedResponse = await shuttleImagesApi.list();
        setImages(updatedResponse.data || []);
      } else {
        setImages(fetchedImages);
      }
    } catch (error) {
      console.error('Failed to fetch shuttle images:', error);
      setImages([]);
    } finally {
      setLoading(false);
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

  const handleRemovePreview = () => {
    setImageFile(null);
    setImagePreview(null);
    setSortOrder(0);
  };

  const handleUpload = async () => {
    if (!imageFile) return;

    setUploading(true);
    try {
      // 自動設置排序值為當前最大排序值 + 1
      let finalSortOrder = sortOrder;
      if (images.length > 0) {
        const maxSortOrder = Math.max(...images.map(img => img.sort_order));
        finalSortOrder = maxSortOrder + 1;
      }
      await shuttleImagesApi.create(imageFile, finalSortOrder);
      await fetchImages();
      handleRemovePreview();
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      alert(error.message || '上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這張圖片嗎？')) return;

    try {
      await shuttleImagesApi.delete(id);
      await fetchImages();
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      alert(error.message || '刪除失敗');
    }
  };

  const handleUpdateSortOrder = async (id: number, newSortOrder: number) => {
    try {
      await shuttleImagesApi.update(id, { sort_order: newSortOrder });
    } catch (error: any) {
      console.error('Failed to update sort order:', error);
      alert(error.message || '更新順序失敗');
      throw error;
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const image = images[index];
    const prevImage = images[index - 1];
    // 交換排序值
    const tempSortOrder = image.sort_order;
    await handleUpdateSortOrder(image.id, prevImage.sort_order);
    await handleUpdateSortOrder(prevImage.id, tempSortOrder);
    // 重新獲取列表以更新顯示
    await fetchImages();
  };

  const handleMoveDown = async (index: number) => {
    if (index === images.length - 1) return;
    const image = images[index];
    const nextImage = images[index + 1];
    // 交換排序值
    const tempSortOrder = image.sort_order;
    await handleUpdateSortOrder(image.id, nextImage.sort_order);
    await handleUpdateSortOrder(nextImage.id, tempSortOrder);
    // 重新獲取列表以更新顯示
    await fetchImages();
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">專車接送圖片管理</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理租車須知頁面專車接送展示圖片，可新增、刪除和調整順序</p>
      </div>

      {/* 新增圖片區域 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">新增圖片</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col h-full">
              <label className={labelClasses}>圖片 *</label>
              
              <div className="mt-4 flex flex-col flex-1 min-h-0">
                <div className="flex-shrink-0 mb-4">
                  <div className={`${uploadAreaBaseClasses} min-h-[320px]`}>
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <img src={imagePreview} alt="Preview" className="w-full h-full max-h-80 object-cover rounded" />
                      </div>
                    ) : (
                      <div className="text-center h-full flex flex-col items-center justify-center">
                        <ImageIcon className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-500">點擊或拖放圖片到此處</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2 mt-auto flex-shrink-0">
                  {imageFile && (
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className={modalSubmitButtonClasses}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          上傳中...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          上傳圖片
                        </>
                      )}
                    </button>
                  )}
                  {imageFile && (
                    <button
                      onClick={handleRemovePreview}
                      disabled={uploading}
                      className={modalCancelButtonClasses}
                    >
                      <X size={18} />
                      取消
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClasses}>排序</label>
                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">數字越小越靠前</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 圖片列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">圖片列表</h2>
          {images.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              目前沒有圖片，請新增圖片
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <div key={image.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="relative mb-4">
                    <img
                      src={`/storage/${image.image_path}`}
                      alt="Shuttle image"
                      className="w-full h-64 object-cover rounded"
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">排序</p>
                      <p className="text-sm text-gray-800 dark:text-gray-100">{image.sort_order}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp size={16} className="mx-auto" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === images.length - 1}
                        className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown size={16} className="mx-auto" />
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShuttleImagesPage;
