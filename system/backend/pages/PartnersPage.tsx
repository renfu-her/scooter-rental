import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit3, Trash2, MapPin, Phone, Building, Image as ImageIcon, X, Loader2, MoreHorizontal } from 'lucide-react';
import { partnersApi } from '../lib/api';
import { inputClasses, labelClasses, searchInputClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface Partner {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  tax_id: string | null;
  manager: string | null;
  photo_path: string | null;
  color: string | null;
}

const PartnersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    tax_id: '',
    manager: '',
    color: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, [searchTerm]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const response = await partnersApi.list(searchTerm ? { search: searchTerm } : undefined);
      // API returns { data: [...] }, api.get() returns the whole JSON object
      // So response.data is the array
      setPartners(response.data || []);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name,
        address: partner.address || '',
        phone: partner.phone || '',
        tax_id: partner.tax_id || '',
        manager: partner.manager || '',
        color: partner.color || '',
      });
      setPhotoPreview(partner.photo_path || null);
    } else {
      setEditingPartner(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        tax_id: '',
        manager: '',
        color: '',
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      tax_id: '',
      manager: '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingPartner) {
        await partnersApi.update(editingPartner.id, formData);
        if (photoFile) {
          await partnersApi.uploadPhoto(editingPartner.id, photoFile);
        }
      } else {
        const response = await partnersApi.create(formData);
        if (photoFile) {
          const partnerId = editingPartner ? editingPartner.id : (response.data?.data?.id || response.data?.id);
          if (partnerId) {
            await partnersApi.uploadPhoto(partnerId, photoFile);
          }
        }
      }
      handleCloseModal();
      fetchPartners();
    } catch (error: any) {
      console.error('Failed to save partner:', error);
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
    if (!confirm('確定要刪除此合作商嗎？')) return;
    try {
      await partnersApi.delete(id);
      fetchPartners();
    } catch (error) {
      console.error('Failed to delete partner:', error);
      alert('刪除失敗');
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleEdit = (partner: Partner) => {
    handleOpenModal(partner);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const toggleDropdown = (partnerId: number) => {
    if (openDropdownId === partnerId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[partnerId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          right: window.innerWidth - rect.right,
        });
      }
      setOpenDropdownId(partnerId);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">合作商管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理各租賃門市與合作店家資訊</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>新增合作商</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50 flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋合作商名稱、地址或統編..." 
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
                  <th className="px-6 py-5">合作商名稱</th>
                  <th className="px-6 py-5">合作商地址</th>
                  <th className="px-6 py-5">聯絡電話</th>
                  <th className="px-6 py-5">合作商統編</th>
                  <th className="px-6 py-5">商店主管</th>
                  <th className="px-6 py-5 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      目前沒有合作商資料
                    </td>
                  </tr>
                ) : (
                  partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="w-20 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-inner">
                        {partner.photo_path ? (
                          <img 
                            src={partner.photo_path} 
                            alt={partner.name} 
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setImageViewerUrl(partner.photo_path);
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
                    <td className="px-6 py-5 font-black text-gray-900 dark:text-gray-100 text-base">{partner.name}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium">{partner.address || '-'}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium tracking-wide">{partner.phone || '-'}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-bold">{partner.tax_id || '-'}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-black">{partner.manager || '-'}</td>
                    <td className="px-6 py-5 text-center">
                      <div className="relative">
                        <button 
                          ref={(el) => { buttonRefs.current[partner.id] = el; }}
                          onClick={() => toggleDropdown(partner.id)}
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

      {/* Add/Edit Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingPartner ? '編輯合作商' : '建立合作商'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={`${labelClasses} flex items-center`}>
                    <Building size={14} className="mr-1.5" /> 合作商名稱 <span className="text-red-500 ml-1">*</span>
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
                    <MapPin size={14} className="mr-1.5" /> 合作商地址
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
                    合作商統編
                  </label>
                  <input 
                    type="text" 
                    className={inputClasses}
                    placeholder="8位數字統編"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClasses}>
                    商店主管
                  </label>
                  <input 
                    type="text" 
                    className={inputClasses}
                    placeholder=""
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClasses}>
                    顯示顏色
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={formData.color || '#6B7280'}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-16 h-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                        title="選擇顏色"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.color || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // 驗證 hex 顏色格式
                            if (value === '' || /^#[0-9A-Fa-f]{6}$/.test(value)) {
                              setFormData({ ...formData, color: value });
                            }
                          }}
                          placeholder="#6B7280"
                          className={`${inputClasses} font-mono text-sm`}
                          maxLength={7}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          輸入 hex 顏色值（例如：#FF5733）
                        </p>
                      </div>
                    </div>
                  </div>
                  {formData.color && (
                    <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">預覽：</p>
                      <p className="text-base font-bold" style={{ color: formData.color }}>
                        合作商名稱範例文字
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className={`${labelClasses} mb-3`}>店面形象照片</label>
                <div className={uploadAreaBaseClasses}>
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
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="mt-4 max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageViewerUrl(photoPreview);
                            setImageViewerOpen(true);
                          }}
                        />
                      )}
                   </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end space-x-3 rounded-b-3xl flex-shrink-0">
              <button onClick={handleCloseModal} className={modalCancelButtonClasses}>取消</button>
              <button onClick={handleSubmit} className={modalSubmitButtonClasses}>
                {editingPartner ? '確認更新' : '確認建立'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 操作下拉菜單使用 fixed 定位，避免被表格 overflow 裁剪 */}
      {openDropdownId !== null && dropdownPosition && partners.find(p => p.id === openDropdownId) && (
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
              const partner = partners.find(p => p.id === openDropdownId);
              if (!partner) return null;
              return (
                <>
                  <button
                    onClick={() => handleEdit(partner)}
                    className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Edit3 size={16} className="text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium">編輯</span>
                  </button>
                  <button
                    onClick={() => handleDelete(partner.id)}
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

export default PartnersPage;
