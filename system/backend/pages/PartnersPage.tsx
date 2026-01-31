import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit3, Trash2, MapPin, Phone, Building, Image as ImageIcon, X, Loader2, MoreHorizontal, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { partnersApi, scooterModelsApi } from '../lib/api';
import { useStore } from '../contexts/StoreContext';
import { inputClasses, selectClasses, labelClasses, searchInputClasses, chevronDownClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface Partner {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  tax_id: string | null;
  manager: string | null;
  photo_path: string | null;
  color: string | null;
  is_default_for_booking?: boolean;
  default_shipping_company?: string | null;
  store_id?: number | null;
  store?: { id: number; name: string } | null;
  transfer_fees?: Array<{
    scooter_model_id: number;
    scooter_model?: {
      id: number;
      name: string;
      type: string;
    };
    same_day_transfer_fee: number | null;
    overnight_transfer_fee: number | null;
  }>;
}

interface ScooterModel {
  id: number;
  name: string;
  type: string;
  label?: string;
  sort_order?: number;
}

const PartnersPage: React.FC = () => {
  const { currentStore, stores, setCurrentStore } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [scooterModels, setScooterModels] = useState<ScooterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    tax_id: '',
    manager: '',
    color: '',
    store_id: '',
    is_default_for_booking: false,
    transfer_fees: [] as Array<{
      scooter_model_id: number;
      same_day_transfer_fee: string;
      overnight_transfer_fee: string;
    }>,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [shouldDeletePhoto, setShouldDeletePhoto] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    // 當商店切換時，重置搜尋，避免在其他商店搜尋後切回來導致列表過濾後為空或非預期狀態
    setSearchTerm('');
    fetchPartners();
    fetchScooterModels();
  }, [currentStore]);

  useEffect(() => {
      fetchPartners();
  }, [searchTerm]);

  const fetchScooterModels = async () => {
    try {
      const response = await scooterModelsApi.list();
      setScooterModels(response.data || []);
    } catch (error) {
      console.error('Failed to fetch scooter models:', error);
    }
  };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      // 始終根據 currentStore 過濾合作商列表
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (currentStore) {
        params.store_id = currentStore.id;
      } else {
        // 如果沒有選擇商店，返回空列表
        setPartners([]);
        setLoading(false);
        return;
      }
      const response = await partnersApi.list(params);
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
      // 將 transfer_fees 轉換為表單格式
      // 先建立一個 map 來儲存現有的費用
      const existingFeesMap = new Map(
        (partner.transfer_fees || []).map(fee => [
          fee.scooter_model_id,
          {
            same_day_transfer_fee: fee.same_day_transfer_fee?.toString() || '',
            overnight_transfer_fee: fee.overnight_transfer_fee?.toString() || '',
          }
        ])
      );
      
      // 為所有機車型號建立費用記錄（如果沒有則為空）
      const transferFees = scooterModels.length > 0
        ? scooterModels.map(model => ({
            scooter_model_id: model.id,
            same_day_transfer_fee: existingFeesMap.get(model.id)?.same_day_transfer_fee || '',
            overnight_transfer_fee: existingFeesMap.get(model.id)?.overnight_transfer_fee || '',
          }))
        : [];
      
      // 編輯模式：store_id 固定為合作商的 store_id
      const fixedStoreId = partner.store_id ? String(partner.store_id) : (currentStore ? String(currentStore.id) : '');
      
      setFormData({
        name: partner.name,
        address: partner.address || '',
        phone: partner.phone || '',
        tax_id: partner.tax_id || '',
        manager: partner.manager || '',
        color: partner.color || '',
        store_id: fixedStoreId,
        is_default_for_booking: partner.is_default_for_booking || false,
        transfer_fees: transferFees,
      });
      setPhotoPreview(partner.photo_path || null);
      setShouldDeletePhoto(false);
    } else {
      setEditingPartner(null);
      // 初始化所有機車型號的費用為空
      const initialTransferFees = scooterModels.length > 0 
        ? scooterModels.map(model => ({
            scooter_model_id: model.id,
            same_day_transfer_fee: '',
            overnight_transfer_fee: '',
          }))
        : [];
      
      // 新增模式：store_id 固定為 currentStore
      const fixedStoreId = currentStore ? String(currentStore.id) : '';
      
      setFormData({
        name: '',
        address: '',
        phone: '',
        tax_id: '',
        manager: '',
        color: '',
        store_id: fixedStoreId,
        is_default_for_booking: false,
        transfer_fees: initialTransferFees,
      });
      setPhotoPreview(null);
      setShouldDeletePhoto(false);
    }
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
    const initialTransferFees = scooterModels.length > 0
      ? scooterModels.map(model => ({
          scooter_model_id: model.id,
          same_day_transfer_fee: '',
          overnight_transfer_fee: '',
        }))
      : [];
    setFormData({
      name: '',
      address: '',
      phone: '',
      tax_id: '',
      manager: '',
      color: '',
      store_id: '',
      is_default_for_booking: false,
      transfer_fees: initialTransferFees,
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setShouldDeletePhoto(false);
  };

  const handleSubmit = async () => {
    try {
      // 準備提交數據，將費用欄位轉換為正整數或 null
      const transferFees = formData.transfer_fees.map(fee => ({
        scooter_model_id: fee.scooter_model_id,
        same_day_transfer_fee: fee.same_day_transfer_fee ? parseInt(fee.same_day_transfer_fee, 10) : null,
        overnight_transfer_fee: fee.overnight_transfer_fee ? parseInt(fee.overnight_transfer_fee, 10) : null,
      }));
      
      const submitData: any = {
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        tax_id: formData.tax_id || null,
        manager: formData.manager || null,
        color: formData.color || null,
        store_id: formData.store_id ? parseInt(formData.store_id) : null,
        is_default_for_booking: formData.is_default_for_booking,
        transfer_fees: transferFees,
      };
      
      if (editingPartner) {
        // 如果要刪除圖片，發送 photo_path: null
        if (shouldDeletePhoto && !photoFile) {
          await partnersApi.update(editingPartner.id, { ...submitData, photo_path: null });
        } else {
          await partnersApi.update(editingPartner.id, submitData);
          if (photoFile) {
            await partnersApi.uploadPhoto(editingPartner.id, photoFile);
          }
        }
      } else {
        const response = await partnersApi.create(submitData);
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

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === partners.length - 1)
    ) {
      return;
    }

    const newPartners = [...partners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items
    [newPartners[index], newPartners[targetIndex]] = [newPartners[targetIndex], newPartners[index]];
    
    // Optimistic update
    setPartners(newPartners);

    try {
      const ids = newPartners.map(p => p.id);
      await partnersApi.reorder(ids);
    } catch (error) {
      console.error('Failed to reorder partners:', error);
      // Revert on error
      fetchPartners();
      alert('排序更新失敗');
    }
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
      setShouldDeletePhoto(false); // 選擇新圖片時清除刪除標記
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
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50 flex flex-col gap-4">
          {/* 第一行：搜尋 */}
          <div className="flex justify-between items-center">
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
          {/* 第二行：顯示當前商店（只讀） */}
          {currentStore && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                店家：
              </label>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {currentStore.name}
              </span>
            </div>
          )}
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
                  <th className="px-6 py-5">顯示顏色</th>
                  <th className="px-6 py-5">合作商地址</th>
                  <th className="px-6 py-5">聯絡電話</th>
                  <th className="px-6 py-5">合作商統編</th>
                  <th className="px-6 py-5">商店主管</th>
                  <th className="px-6 py-5">所屬商店</th>
                  <th className="px-6 py-5 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
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
                    <td className="px-6 py-5 font-black text-base">
                      {partner.color ? (
                        <span style={{ color: partner.color }}>{partner.name}</span>
                      ) : (
                        <span className="text-gray-900 dark:text-gray-100">{partner.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {partner.color ? (
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                            style={{ backgroundColor: partner.color }}
                            title={partner.color}
                          />
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{partner.color}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">未設定</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium">{partner.address || '-'}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium tracking-wide">{partner.phone || '-'}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-bold">{partner.tax_id || '-'}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-black">{partner.manager || '-'}</td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium">{partner.store?.name || '-'}</td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* 只有在沒有搜尋且有多筆資料時才顯示排序按鈕 */}
                        {!searchTerm && partners.length > 1 && (
                          <>
                            <button
                              onClick={() => handleReorder(partners.indexOf(partner), 'up')}
                              disabled={partners.indexOf(partner) === 0}
                              className={`p-1.5 rounded-lg transition-colors ${
                                partners.indexOf(partner) === 0
                                  ? 'text-gray-300 cursor-not-allowed opacity-50'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                              }`}
                              title="上移"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => handleReorder(partners.indexOf(partner), 'down')}
                              disabled={partners.indexOf(partner) === partners.length - 1}
                              className={`p-1.5 rounded-lg transition-colors ${
                                partners.indexOf(partner) === partners.length - 1
                                  ? 'text-gray-300 cursor-not-allowed opacity-50'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                              }`}
                              title="下移"
                            >
                              <ArrowDown size={16} />
                            </button>
                          </>
                        )}
                        <div className="relative">
                          <button 
                            ref={(el) => { buttonRefs.current[partner.id] = el; }}
                            onClick={() => toggleDropdown(partner.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 dark:text-gray-500 transition-colors"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </div>
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
                <div>
                  <label className={`${labelClasses} flex items-center`}>
                    <Building size={14} className="mr-1.5" /> 所屬商店
                  </label>
                  <input
                    type="text"
                    className={`${inputClasses} bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed`}
                    value={formData.store_id ? stores.find(s => s.id === parseInt(formData.store_id))?.name || '未知商店' : '未選擇商店'}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">所屬商店已固定，無法修改</p>
                </div>
                <div>
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
                  <label className={`${labelClasses} text-base font-bold mb-3`}>
                    調車費用設定（按機車型號）
                  </label>
                  <div className="space-y-4">
                    {[...scooterModels].sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0)).map((model) => {
                      const feeIndex = formData.transfer_fees.findIndex(
                        f => f.scooter_model_id === model.id
                      );
                      const fee = feeIndex >= 0 ? formData.transfer_fees[feeIndex] : {
                        scooter_model_id: model.id,
                        same_day_transfer_fee: '',
                        overnight_transfer_fee: '',
                      };
                      
                      const updateFee = (field: 'same_day_transfer_fee' | 'overnight_transfer_fee', value: string) => {
                        const newTransferFees = [...formData.transfer_fees];
                        if (feeIndex >= 0) {
                          newTransferFees[feeIndex] = { ...newTransferFees[feeIndex], [field]: value };
                        } else {
                          newTransferFees.push({
                            scooter_model_id: model.id,
                            same_day_transfer_fee: field === 'same_day_transfer_fee' ? value : '',
                            overnight_transfer_fee: field === 'overnight_transfer_fee' ? value : '',
                          });
                        }
                        setFormData({ ...formData, transfer_fees: newTransferFees });
                      };
                      
                      return (
                        <div key={model.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/50">
                          <div className="mb-3">
                            <span className="font-bold text-gray-900 dark:text-gray-100">{model.name}</span>
                            <span className="ml-2 px-2 py-1 rounded-lg text-[10px] font-black border bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                              {model.type}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`${labelClasses} text-sm`}>當日調車費用</label>
                              <input 
                                type="number" 
                                className={inputClasses}
                                placeholder="0"
                                min="0"
                                step="1"
                                value={fee.same_day_transfer_fee}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || /^\d+$/.test(value)) {
                                    updateFee('same_day_transfer_fee', value);
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <label className={`${labelClasses} text-sm`}>跨日調車費用</label>
                              <input 
                                type="number" 
                                className={inputClasses}
                                placeholder="0"
                                min="0"
                                step="1"
                                value={fee.overnight_transfer_fee}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || /^\d+$/.test(value)) {
                                    updateFee('overnight_transfer_fee', value);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                <div className="col-span-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default_for_booking}
                      onChange={(e) => setFormData({ ...formData, is_default_for_booking: e.target.checked })}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <span className={labelClasses}>設為預設線上預約合作商</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-8">
                    勾選後，此合作商將成為前台線上預約的預設合作商。當設置一個合作商為預設時，其他合作商的自動取消預設狀態。
                  </p>
                </div>
              </div>
              <div>
                <label className={`${labelClasses} mb-3`}>店面形象照片</label>
                <div className={uploadAreaBaseClasses}>
                  {photoPreview ? (
                    <div className="relative">
                      <img src={photoPreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                      <button
                        type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoPreview(null);
                            setPhotoFile(null);
                            // 如果是編輯模式且有現有圖片，標記為要刪除
                            if (editingPartner && editingPartner.photo_path) {
                              setShouldDeletePhoto(true);
                            }
                          }}
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
