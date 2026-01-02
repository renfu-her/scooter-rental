import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { locationApi } from '../lib/api';
import { inputClasses, labelClasses, uploadAreaBaseClasses, modalSubmitButtonClasses } from '../styles';

interface Location {
  id: number;
  title: string | null;
  address: string | null;
  phone: string | null;
  hours: string | null;
  description: string | null;
  image_path: string | null;
  map_url: string | null;
}

const LocationPage: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    phone: '',
    hours: '',
    description: '',
    map_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    setLoading(true);
    try {
      const response = await locationApi.get();
      if (response.data) {
        setLocation(response.data);
        setFormData({
          title: response.data.title || '',
          address: response.data.address || '',
          phone: response.data.phone || '',
          hours: response.data.hours || '',
          description: response.data.description || '',
          map_url: response.data.map_url || '',
        });
        setImagePreview(response.data.image_path ? `/storage/${response.data.image_path}` : null);
      }
    } catch (error) {
      console.error('Failed to fetch location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await locationApi.update(formData);
      if (imageFile) {
        setUploadingImage(true);
        await locationApi.uploadImage(imageFile);
        setUploadingImage(false);
        setImageFile(null);
      }
      await fetchLocation();
      alert('儲存成功');
    } catch (error: any) {
      console.error('Failed to save location:', error);
      alert(error.message || '儲存失敗');
    } finally {
      setSaving(false);
      setUploadingImage(false);
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">交通位置管理</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理官網交通位置資訊</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-6">
        <div>
          <label className={labelClasses}>標題</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={inputClasses}
            placeholder="例如: 蘭光租賃中心"
          />
        </div>

        <div>
          <label className={labelClasses}>地址</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className={inputClasses}
            placeholder="例如: 臺北市中正路 123 號"
          />
        </div>

        <div>
          <label className={labelClasses}>電話</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={inputClasses}
            placeholder="例如: 02-2345-5555"
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
          <label className={labelClasses}>描述</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={inputClasses}
            placeholder="輸入詳細描述..."
          />
        </div>

        <div>
          <label className={labelClasses}>地圖 URL</label>
          <input
            type="text"
            value={formData.map_url}
            onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
            className={inputClasses}
            placeholder="Google Maps embed URL 或 iframe URL"
          />
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
                    setImagePreview(location?.image_path ? `/storage/${location.image_path}` : null);
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

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            className={modalSubmitButtonClasses}
            disabled={saving || uploadingImage}
          >
            {saving || uploadingImage ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Save size={18} />
                <span>儲存</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationPage;
