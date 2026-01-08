import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { homeImagesApi } from '../lib/api';
import { labelClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface HomeImage {
  id: number;
  key: string;
  image_path: string | null;
  alt_text: string | null;
}

const IMAGE_LABELS: Record<string, string> = {
  hero_image: '首頁 Hero 區塊圖片（右側大圖）',
  featured_image_1: '首頁精選圖片 1',
  featured_image_2: '首頁精選圖片 2',
  featured_image_3: '首頁精選圖片 3',
  featured_image_4: '首頁精選圖片 4',
};

const DEFAULT_IMAGES: Record<string, string> = {
  hero_image: 'https://picsum.photos/seed/hero/1200/800',
  featured_image_1: 'https://picsum.photos/seed/view1/600/800',
  featured_image_2: 'https://picsum.photos/seed/view2/600/800',
  featured_image_3: 'https://picsum.photos/seed/view3/600/800',
  featured_image_4: 'https://picsum.photos/seed/view4/600/800',
};

const HomeImagesPage: React.FC = () => {
  const [homeImages, setHomeImages] = useState<Record<string, HomeImage>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [imageFiles, setImageFiles] = useState<Record<string, File | null>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string | null>>({});

  useEffect(() => {
    fetchHomeImages();
  }, []);

  const fetchHomeImages = async () => {
    setLoading(true);
    try {
      const response = await homeImagesApi.list();
      const images = response.data || {};
      setHomeImages(images);
      
      // Set previews for existing images
      const previews: Record<string, string | null> = {};
      Object.keys(images).forEach((key) => {
        const img = images[key];
        previews[key] = img.image_path ? `/storage/${img.image_path}` : null;
      });
      setImagePreviews(previews);
    } catch (error) {
      console.error('Failed to fetch home images:', error);
      setHomeImages({});
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFiles(prev => ({ ...prev, [key]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (key: string) => {
    setImageFiles(prev => ({ ...prev, [key]: null }));
    setImagePreviews(prev => {
      const newPreviews = { ...prev };
      // If there's an existing image, keep it; otherwise remove preview
      if (homeImages[key]?.image_path) {
        newPreviews[key] = `/storage/${homeImages[key].image_path}`;
      } else {
        newPreviews[key] = null;
      }
      return newPreviews;
    });
  };

  const handleUpload = async (key: string) => {
    const file = imageFiles[key];
    if (!file) return;

    setUploading(prev => ({ ...prev, [key]: true }));
    try {
      await homeImagesApi.uploadImage(key, file);
      await fetchHomeImages();
      setImageFiles(prev => ({ ...prev, [key]: null }));
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      alert(error.message || '上傳失敗');
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const getImageSrc = (key: string): string => {
    if (imagePreviews[key]) {
      return imagePreviews[key]!;
    }
    if (homeImages[key]?.image_path) {
      return `/storage/${homeImages[key].image_path}`;
    }
    return DEFAULT_IMAGES[key] || '';
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

  const imageKeys = ['hero_image', 'featured_image_1', 'featured_image_2', 'featured_image_3', 'featured_image_4'];

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">首頁圖片管理</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理首頁的 5 張圖片，如果沒有上傳圖片則使用預設圖片</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 space-y-8">
          {imageKeys.map((key) => {
            const image = homeImages[key];
            const hasNewImage = imageFiles[key] !== null;
            const isUploading = uploading[key] || false;
            const currentImageSrc = getImageSrc(key);

            return (
              <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-8 last:border-b-0 last:pb-0">
                <label className={labelClasses}>{IMAGE_LABELS[key]}</label>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 圖片預覽 */}
                  <div>
                    <div className={uploadAreaBaseClasses}>
                      {currentImageSrc ? (
                        <div className="relative">
                          <img src={currentImageSrc} alt={IMAGE_LABELS[key]} className="max-h-64 mx-auto rounded" />
                          {hasNewImage && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              新圖片
                            </div>
                          )}
                          {!homeImages[key]?.image_path && (
                            <div className="absolute bottom-2 left-2 bg-gray-500 text-white text-xs px-2 py-1 rounded">
                              預設圖片
                            </div>
                          )}
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
                        onChange={(e) => handleImageChange(key, e)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                      />
                    </div>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex flex-col justify-center space-y-4">
                    {hasNewImage && (
                      <button
                        onClick={() => handleUpload(key)}
                        disabled={isUploading}
                        className={modalSubmitButtonClasses}
                      >
                        {isUploading ? (
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
                    {hasNewImage && (
                      <button
                        onClick={() => handleRemoveImage(key)}
                        disabled={isUploading}
                        className={modalCancelButtonClasses}
                      >
                        <X size={18} />
                        取消
                      </button>
                    )}
                    {!hasNewImage && homeImages[key]?.image_path && (
                      <button
                        onClick={() => {
                          setImagePreviews(prev => ({ ...prev, [key]: null }));
                          setImageFiles(prev => ({ ...prev, [key]: null }));
                        }}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        更換圖片
                      </button>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {homeImages[key]?.image_path
                        ? '已上傳自訂圖片'
                        : '目前使用預設圖片'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomeImagesPage;
