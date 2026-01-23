import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Calendar, Clock, Phone, FileText, Loader2, ChevronDown } from 'lucide-react';
import { ordersApi, scootersApi, partnersApi, storesApi } from '../lib/api';
import { useStore } from '../contexts/StoreContext';
import { inputClasses as sharedInputClasses, selectClasses as sharedSelectClasses, labelClasses, chevronDownClasses } from '../styles';

interface Order {
  id: number;
  order_number: string;
  status: string;
  tenant: string;
  appointment_date: string;
  sort_order?: number;
  start_time: string;
  end_time: string;
  expected_return_time: string | null;
  scooters: Array<{ model: string; type?: string; count: number }>;
  scooter_ids?: number[]; // 機車 ID 列表（用於編輯）
  shipping_company: string | null;
  ship_arrival_time: string | null;
  ship_return_time: string | null;
  phone: string | null;
  partner: { id: number; name: string } | null;
  store?: { id: number; name: string } | null;
  store_id?: number | null;
  payment_method: string | null;
  payment_amount: number;
  remark: string | null;
}

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: (appointmentDate?: string) => void;
  editingOrder?: Order | null;
  onYearChange?: (year: number) => void;
}

interface Scooter {
  id: number;
  plate_number: string;
  model: string;
  type: string;
  status: string;
}

interface Partner {
  id: number;
  name: string;
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

interface Store {
  id: number;
  name: string;
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({ isOpen, onClose, editingOrder, onYearChange }) => {
  const { currentStore } = useStore();
  const [availableScooters, setAvailableScooters] = useState<Scooter[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedScooterIds, setSelectedScooterIds] = useState<number[]>([]);
  const [searchPlate, setSearchPlate] = useState('');
  const [showPlateDropdown, setShowPlateDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState(false);

  const [formData, setFormData] = useState({
    partner_id: '',
    store_id: '',
    tenant: '',
    appointment_date: '',
    start_time: '',
    end_time: '',
    expected_return_time: '',
    phone: '',
    shipping_company: '',
    ship_arrival_time: '',
    ship_return_time: '',
    payment_method: '',
    payment_amount: '',
    status: '已預訂',
    remark: '',
  });
  const inputClasses = sharedInputClasses;
  const selectClasses = sharedSelectClasses;

  // 格式化日期為 YYYY-MM-DD（用於 type="date" 輸入框）
  const formatDateForInput = (dateStr: string | null): string => {
    if (!dateStr) return '';
    // 如果已經是 YYYY-MM-DD 格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // 如果是日期時間格式，提取日期部分
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 格式化日期時間為 YYYY-MM-DDTHH:mm（用於 type="datetime-local" 輸入框）
  const formatDateTimeForInput = (dateTimeStr: string | null): string => {
    if (!dateTimeStr) return '';
    // 如果已經是 YYYY-MM-DDTHH:mm 格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTimeStr)) {
      return dateTimeStr;
    }
    // 如果是其他格式，嘗試解析
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (isOpen) {
      const initializeModal = async () => {
        // 先獲取商店列表（合作商會在 fixedStoreId 確定後載入）
        await fetchStores();
        
        if (editingOrder) {
          // 編輯模式：預填表單數據，store_id 固定為訂單的 store_id
          const orderStoreId = editingOrder.store_id || editingOrder.store?.id;
          setFormData({
            partner_id: editingOrder.partner?.id.toString() || '',
            store_id: orderStoreId ? orderStoreId.toString() : '',
            tenant: editingOrder.tenant,
            appointment_date: formatDateForInput(editingOrder.appointment_date),
            start_time: formatDateForInput(editingOrder.start_time),
            end_time: formatDateForInput(editingOrder.end_time),
            expected_return_time: formatDateTimeForInput(editingOrder.expected_return_time),
            phone: editingOrder.phone || '',
            shipping_company: editingOrder.shipping_company || '',
            ship_arrival_time: formatDateTimeForInput(editingOrder.ship_arrival_time),
            ship_return_time: formatDateTimeForInput(editingOrder.ship_return_time),
            payment_method: editingOrder.payment_method || '',
            payment_amount: editingOrder.payment_amount.toString(),
            status: editingOrder.status,
            remark: editingOrder.remark || '',
          });
          // 編輯模式下，如果金額為 0，標記為未手動修改，以便自動計算
          if (editingOrder.payment_amount === 0) {
            setIsAmountManuallyEdited(false);
          } else {
            setIsAmountManuallyEdited(true); // 有金額時，標記為已手動修改（避免自動覆蓋）
          }
        } else {
          // 新增模式：重置表單，store_id 使用 currentStore（固定）
          setFormData({
            partner_id: '',
            store_id: currentStore?.id.toString() || '',
            tenant: '',
            appointment_date: '',
            start_time: '',
            end_time: '',
            expected_return_time: '',
            phone: '',
            shipping_company: '',
            ship_arrival_time: '',
            ship_return_time: '',
            payment_method: '',
            payment_amount: '',
            status: '已預訂',
            remark: '',
          });
          setSelectedScooterIds([]);
        }
        setSearchPlate('');
        setIsAmountManuallyEdited(false); // 重置手動修改標記
      };
      
      initializeModal();
    }
  }, [isOpen, editingOrder]);

  // 確定固定的 store_id（新增模式使用 currentStore，編輯模式使用訂單的 store_id）
  const fixedStoreId = editingOrder 
    ? (editingOrder.store_id || editingOrder.store?.id)
    : (currentStore?.id);

  // 當固定的 store_id 確定後，載入合作商和機車列表
  useEffect(() => {
    if (isOpen && fixedStoreId) {
      // 載入該商店的合作商列表
      fetchPartners();
      // 載入該商店的機車列表
      fetchAvailableScooters();
      // 如果是編輯模式，載入訂單中的機車
      if (editingOrder) {
        // 使用 scooter_ids 欄位（如果有的話），否則嘗試從 scooters 中提取（但 scooters 可能沒有 id）
        const scooterIds = editingOrder.scooter_ids || [];
        if (scooterIds.length > 0) {
          fetchScootersByIds(scooterIds).then(orderScooters => {
            setAvailableScooters(prev => {
              const existingIds = new Set(prev.map(s => s.id));
              const newScooters = orderScooters.filter((s: Scooter) => !existingIds.has(s.id));
              return [...prev, ...newScooters];
            });
            setSelectedScooterIds(scooterIds);
          }).catch(error => {
            console.error('Failed to fetch scooters by IDs:', error);
            // 即使載入失敗，也至少設置選中的 ID，讓用戶知道應該有機車
            setSelectedScooterIds(scooterIds);
          });
        }
      }
    }
  }, [fixedStoreId, isOpen, editingOrder]);

  const fetchAvailableScooters = async () => {
    try {
      // 根據固定的 store_id 過濾機車列表（只顯示狀態為「待出租」的機車）
      const params: any = { status: '待出租' };
      if (fixedStoreId) {
        params.store_id = fixedStoreId;
      }
      const response = await scootersApi.list(params);
      setAvailableScooters(response.data || []);
    } catch (error) {
      console.error('Failed to fetch available scooters:', error);
    }
  };

  const fetchScootersByIds = async (scooterIds: number[]): Promise<Scooter[]> => {
    try {
      // 獲取機車列表（包括已租借的），根據固定的 store_id 過濾
      const params: any = {};
      if (fixedStoreId) {
        params.store_id = fixedStoreId;
      }
      const response = await scootersApi.list(params);
      const allScooters = response.data || [];
      // 過濾出需要的機車
      const foundScooters = allScooters.filter((s: Scooter) => scooterIds.includes(s.id));
      
      // 如果有些機車沒找到，可能是因為它們在訂單中但不在列表中
      // 這種情況下，我們至少返回找到的機車
      if (foundScooters.length < scooterIds.length) {
        console.warn(`Some scooters not found: ${scooterIds.filter(id => !foundScooters.some(s => s.id === id)).join(', ')}`);
      }
      
      return foundScooters;
    } catch (error) {
      console.error('Failed to fetch scooters by IDs:', error);
      return [];
    }
  };

  const fetchPartners = async () => {
    try {
      // 根據固定的 store_id 過濾合作商列表
      const params = fixedStoreId ? { store_id: fixedStoreId } : undefined;
      const response = await partnersApi.list(params);
      // 確保載入 transfer_fees 關係
      const partnersWithFees = (response.data || []).map((partner: any) => ({
        ...partner,
        transfer_fees: partner.transfer_fees || [],
      }));
      setPartners(partnersWithFees);
      
      // 如果沒有選擇合作商，自動選擇該商店的預設合作商
      if (!formData.partner_id && partnersWithFees.length > 0) {
        const defaultPartner = partnersWithFees.find((p: any) => p.is_default_for_booking);
        if (defaultPartner) {
          setFormData(prev => ({ ...prev, partner_id: defaultPartner.id.toString() }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await storesApi.list();
      const sortedStores = (response.data || []).sort((a: Store, b: Store) => a.id - b.id);
      setStores(sortedStores);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  };

  const toggleScooter = (scooterId: number) => {
    if (selectedScooterIds.includes(scooterId)) {
      setSelectedScooterIds(selectedScooterIds.filter(id => id !== scooterId));
    } else {
      setSelectedScooterIds([...selectedScooterIds, scooterId]);
    }
  };

  // 計算選中機車相關的統計資料
  const selectedScooters = availableScooters.filter(s => selectedScooterIds.includes(s.id));
  
  // 計算選中機車按型號分組的統計（model + type）
  const modelStats = React.useMemo(() => {
    const stats: Record<string, { count: number; scooters: Scooter[]; model: string; type: string }> = {};
    selectedScooters.forEach(scooter => {
      const modelString = `${scooter.model || ''} ${scooter.type || ''}`.trim();
      if (!modelString) return;
      
      if (!stats[modelString]) {
        stats[modelString] = { count: 0, scooters: [], model: scooter.model || '', type: scooter.type || '' };
      }
      stats[modelString].count++;
      stats[modelString].scooters.push(scooter);
    });
    return stats;
  }, [selectedScooters]);

  // 計算費用函數
  const calculateAmount = React.useCallback(() => {
    // 如果沒有合作商、機車或時間，返回 0
    if (!formData.partner_id || selectedScooterIds.length === 0 || !formData.start_time || !formData.end_time) {
      return 0;
    }

    // 獲取選中的合作商
    const selectedPartner = partners.find(p => p.id.toString() === formData.partner_id);
    if (!selectedPartner || !selectedPartner.transfer_fees || selectedPartner.transfer_fees.length === 0) {
      return 0;
    }

    // 計算天數（參考後端邏輯）
    const startDate = new Date(formData.start_time + 'T00:00:00');
    const endDate = new Date(formData.end_time + 'T00:00:00');
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    
    let days = 1;
    if (!isSameDay) {
      // 跨日租：計算夜數（diffInDays）
      const diffTime = endDate.getTime() - startDate.getTime();
      days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    let totalAmount = 0;

    // 按機車型號分組計算費用
    Object.entries(modelStats).forEach(([modelString, { count, model, type }]) => {
      // 查找合作商的機車型號費用
      const transferFee = selectedPartner.transfer_fees.find((fee: any) => 
        fee.scooter_model?.name === model && fee.scooter_model?.type === type
      );

      if (transferFee) {
        const feePerUnit = isSameDay 
          ? (transferFee.same_day_transfer_fee || 0)
          : (transferFee.overnight_transfer_fee || 0);
        
        // 計算費用：金額 × 天數 × 台數
        const amount = (feePerUnit || 0) * days * count;
        totalAmount += amount;
      }
    });

    return totalAmount;
  }, [formData.partner_id, formData.start_time, formData.end_time, selectedScooterIds, partners, modelStats]);

  // 當合作商、機車選擇或時間變更時，自動計算費用
  useEffect(() => {
    // 只在沒有手動修改過金額時才自動計算
    if (!isAmountManuallyEdited && formData.partner_id && selectedScooterIds.length > 0 && formData.start_time && formData.end_time) {
      const calculatedAmount = calculateAmount();
      if (calculatedAmount > 0) {
        setFormData(prev => ({ ...prev, payment_amount: calculatedAmount.toString() }));
      }
    }
  }, [formData.partner_id, formData.start_time, formData.end_time, selectedScooterIds, calculateAmount, isAmountManuallyEdited]);

  const handleSubmit = async () => {
    if (!formData.appointment_date) {
      alert('請填寫必填欄位（預約日期）');
      return;
    }

    // 如果沒有提供金額，自動計算
    if (!formData.payment_amount || formData.payment_amount === '0') {
      const calculatedAmount = calculateAmount();
      if (calculatedAmount > 0) {
        setFormData(prev => ({ ...prev, payment_amount: calculatedAmount.toString() }));
      }
    }

    if (!formData.payment_amount || formData.payment_amount === '0') {
      alert('請填寫必填欄位（總金額）或選擇合作商、機車和時間以自動計算');
      return;
    }

    if (selectedScooterIds.length === 0) {
      alert('請至少選擇一台機車');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        partner_id: formData.partner_id || null,
        store_id: fixedStoreId || null,
        tenant: formData.tenant,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        expected_return_time: formData.expected_return_time || null,
        phone: formData.phone || null,
        shipping_company: formData.shipping_company || null,
        ship_arrival_time: formData.ship_arrival_time || null,
        ship_return_time: formData.ship_return_time || null,
        payment_method: formData.payment_method || null,
        payment_amount: parseFloat(formData.payment_amount),
        status: formData.status,
        remark: formData.remark || null,
        scooter_ids: selectedScooterIds,
      };

      if (editingOrder) {
        await ordersApi.update(editingOrder.id, orderData);
      } else {
        await ordersApi.create(orderData);
      }
      // 傳遞預約日期，用於跳轉到對應月份
      onClose(formData.appointment_date || undefined);
    } catch (error: any) {
      console.error('Failed to create order:', error);
      console.error('Error response:', error.response?.data);
      // 顯示更詳細的錯誤訊息
      let errorMessage = editingOrder ? '更新訂單失敗，請檢查輸入資料' : '建立訂單失敗，請檢查輸入資料';
      
      // 優先顯示 API 返回的錯誤訊息
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // 如果有驗證錯誤，顯示第一個錯誤
        if (errorData.errors) {
          const firstError = Object.values(errorData.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          }
        } 
        // 如果有錯誤訊息
        else if (errorData.message) {
          errorMessage = errorData.message;
          // 如果有詳細錯誤資訊，也顯示
          if (errorData.error) {
            errorMessage += `: ${errorData.error}`;
          }
        }
        // 如果有 error 欄位
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } 
      // 如果沒有 response，使用 error.message
      else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredScooters = availableScooters.filter(s => 
    s.plate_number.toLowerCase().includes(searchPlate.toLowerCase())
  );

  // 按車牌號排序選中的機車
  const sortedSelectedScooters = React.useMemo(() => {
    return [...selectedScooters].sort((a, b) => a.plate_number.localeCompare(b.plate_number));
  }, [selectedScooters]);

  // 計算總台數（由各型號台數加總）
  const totalCount = React.useMemo(() => {
    return Object.values(modelStats).reduce((sum, stat) => sum + stat.count, 0);
  }, [modelStats]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 確保點擊的是 backdrop 本身，而不是子元素
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick} />
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => {
          // 只有當點擊的是模態框背景時才阻止冒泡
          // 不要阻止 select 和其他交互元素的事件
          if (e.target === e.currentTarget) {
            e.stopPropagation();
          }
        }}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            {editingOrder ? '編輯租借訂單' : '新增租借訂單'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">合作商選擇</label>
                <div className="relative">
                  <select 
                    className={selectClasses}
                    value={formData.partner_id}
                    onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                  >
                    <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">請選擇合作商（非必選）</option>
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{partner.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className={chevronDownClasses} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">商店選擇</label>
                <div className="relative">
                  <input
                    type="text"
                    className={`${inputClasses} bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed`}
                    value={fixedStoreId ? stores.find(s => s.id === fixedStoreId)?.name || '未知商店' : '未選擇商店'}
                    readOnly
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">商店選擇已固定，無法修改</p>
              </div>

              <div>
                <label className={labelClasses}>承租人資訊</label>
                <input 
                  type="text" 
                  className={inputClasses} 
                  placeholder="輸入承租人全名"
                  value={formData.tenant}
                  onChange={(e) => setFormData({ ...formData, tenant: e.target.value })}
                />
              </div>

              <div>
                <label className={`${labelClasses} flex items-center`}>
                  <Calendar size={14} className="mr-1.5" /> 預約日期 <span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  type="date" 
                  required
                  className={inputClasses}
                  value={formData.appointment_date}
                  onChange={(e) => {
                    const dateStr = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      appointment_date: dateStr
                    }));
                    // 通知父組件年份改變
                    if (onYearChange && dateStr) {
                      const year = new Date(dateStr).getFullYear();
                      onYearChange(year);
                    }
                  }}
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${labelClasses} flex items-center`}>
                    <Clock size={14} className="mr-1.5" /> 開始時間
                  </label>
                  <input 
                    type="date" 
                    className={inputClasses}
                    value={formData.start_time}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, start_time: e.target.value }));
                    }}
                    onKeyDown={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    min={formData.appointment_date || undefined}
                  />
                </div>
                <div>
                  <label className={`${labelClasses} flex items-center`}>
                    <Clock size={14} className="mr-1.5" /> 結束時間
                  </label>
                  <input 
                    type="date" 
                    className={inputClasses}
                    value={formData.end_time}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, end_time: e.target.value }));
                    }}
                    onKeyDown={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    min={formData.start_time || formData.appointment_date || undefined}
                  />
                </div>
              </div>

              <div>
                <label className={`${labelClasses} flex items-center`}>
                  <Clock size={14} className="mr-1.5" /> 預計還車時間
                </label>
                <input 
                  type="datetime-local" 
                  className={inputClasses}
                  value={formData.expected_return_time}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, expected_return_time: e.target.value }));
                  }}
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  min={formData.end_time ? `${formData.end_time}T00:00` : undefined}
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
                <label className={labelClasses}>航運公司</label>
                <div className="relative">
                  <select 
                    className={selectClasses}
                    value={formData.shipping_company}
                    onChange={(e) => setFormData({ ...formData, shipping_company: e.target.value })}
                  >
                    <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">請選擇</option>
                    <option value="泰富" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">泰富</option>
                    <option value="藍白" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">藍白</option>
                    <option value="聯營" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">聯營</option>
                    <option value="大福" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">大福</option>
                    <option value="公船" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">公船</option>
                  </select>
                  <ChevronDown size={18} className={chevronDownClasses} />
                </div>
              </div>

              <div>
                <label className={labelClasses}>船班時間（來）</label>
                <input 
                  type="datetime-local" 
                  className={inputClasses}
                  value={formData.ship_arrival_time}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, ship_arrival_time: e.target.value }));
                  }}
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                />
              </div>

              <div>
                <label className={labelClasses}>船班時間（回）</label>
                <input 
                  type="datetime-local" 
                  className={inputClasses}
                  value={formData.ship_return_time}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, ship_return_time: e.target.value }));
                  }}
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  min={formData.ship_arrival_time || undefined}
                />
              </div>

              <div>
                <label className={labelClasses}>付款方式</label>
                <div className="relative">
                  <select 
                    className={selectClasses}
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  >
                    <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">請選擇</option>
                    <option value="現金" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">現金</option>
                    <option value="月結" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">月結</option>
                    <option value="日結" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">日結</option>
                    <option value="匯款" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">匯款</option>
                    <option value="刷卡" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">刷卡</option>
                    <option value="行動支付" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">行動支付</option>
                  </select>
                  <ChevronDown size={18} className={chevronDownClasses} />
                </div>
              </div>

              <div>
                <label className={`${labelClasses} flex items-center`}>
                  <FileText size={14} className="mr-1.5" /> 總金額 <span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  type="number" 
                  className={inputClasses}
                  placeholder="NT$"
                  value={formData.payment_amount}
                  onChange={(e) => {
                    setFormData({ ...formData, payment_amount: e.target.value });
                    setIsAmountManuallyEdited(true); // 標記為手動修改
                  }}
                />
              </div>

              <div>
                <label className={labelClasses}>訂單狀態 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    className={selectClasses}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="已預訂" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">已預訂</option>
                    <option value="進行中" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">進行中</option>
                    <option value="待接送" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">待接送</option>
                    <option value="已完成" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">已完成</option>
                    <option value="在合作商" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">在合作商</option>
                  </select>
                  <ChevronDown size={18} className={chevronDownClasses} />
                </div>
              </div>

              <div>
                <label className={labelClasses}>備註</label>
                <textarea 
                  className={inputClasses}
                  rows={3}
                  placeholder="可讓我們打字..."
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  租借機車選取 <span className="text-orange-600 ml-1 font-black">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="輸入車牌號搜尋..." 
                    className={`${inputClasses} pl-11`}
                    value={searchPlate}
                    onChange={(e) => {
                      setSearchPlate(e.target.value);
                      setShowPlateDropdown(true);
                    }}
                    onFocus={() => setShowPlateDropdown(true)}
                  />
                  {showPlateDropdown && filteredScooters.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {filteredScooters.map(s => {
                        const isSelected = selectedScooterIds.includes(s.id);
                        return (
                          <div 
                            key={s.id}
                            className={`px-5 py-3 flex items-center justify-between cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 ${
                              isSelected 
                                ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' 
                                : 'hover:bg-orange-50 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => {
                              toggleScooter(s.id);
                              setShowPlateDropdown(false);
                              setSearchPlate('');
                            }}
                          >
                            <div>
                              <span className={`text-sm font-bold ${
                                isSelected 
                                  ? 'text-orange-700 dark:text-orange-300' 
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {s.plate_number}
                              </span>
                              <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded font-bold ${
                                isSelected
                                  ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}>
                                {s.type}
                              </span>
                            </div>
                            <span className={`text-xs ${
                              isSelected
                                ? 'text-orange-600 dark:text-orange-400 font-medium'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {s.model}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 p-5 bg-gray-50/50 dark:bg-gray-700/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 min-h-[140px]">
                  {selectedScooters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-6 text-gray-400 dark:text-gray-500">
                      <Search size={32} className="opacity-10 mb-2" />
                      <p className="text-xs">目前尚未選擇任何機車</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 顯示選中的車牌號（按車牌號排序） */}
                      <div className="flex flex-wrap gap-2">
                        {sortedSelectedScooters.map(s => (
                          <span key={s.id} className="inline-flex items-center px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-sm">
                            {s.plate_number}
                            <button 
                              className="ml-2 hover:text-white/70 transition-colors" 
                              onClick={() => toggleScooter(s.id)}
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                      
                      {/* 顯示各型號統計 */}
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                        {Object.entries(modelStats).map(([modelString, { count, model, type }]) => (
                          <div key={modelString} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{modelString}</span>
                            <span className="text-orange-600 dark:text-orange-400 font-bold">{count}台</span>
                          </div>
                        ))}
                        
                        {/* 顯示總台數 */}
                        <div className="pt-2 mt-2 border-t border-gray-300 dark:border-gray-500 flex items-center justify-between">
                          <span className="text-gray-800 dark:text-gray-200 font-bold">總計</span>
                          <span className="text-orange-600 dark:text-orange-400 font-black text-base">{totalCount}台</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-end space-x-4 sticky bottom-0 z-10">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-10 py-2.5 bg-gray-900 dark:bg-gray-700 rounded-xl text-sm font-black text-white hover:bg-black dark:hover:bg-gray-600 shadow-lg transition-all disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                {editingOrder ? '更新中...' : '建立中...'}
              </>
            ) : (
              editingOrder ? '更新訂單' : '新增訂單'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOrderModal;
