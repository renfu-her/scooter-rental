import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Calendar, Clock, Phone, FileText, Loader2, ChevronDown } from 'lucide-react';
import { ordersApi, scootersApi, partnersApi } from '../lib/api';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import flatpickr from 'flatpickr';
import { MandarinTraditional } from 'flatpickr/dist/l10n/zh-tw.js';
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
  scooters: Array<{ id: number; model: string; count: number }>;
  shipping_company: string | null;
  ship_arrival_time: string | null;
  ship_return_time: string | null;
  phone: string | null;
  partner: { id: number; name: string } | null;
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
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({ isOpen, onClose, editingOrder, onYearChange }) => {
  const [availableScooters, setAvailableScooters] = useState<Scooter[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedScooterIds, setSelectedScooterIds] = useState<number[]>([]);
  const [searchPlate, setSearchPlate] = useState('');
  const [showPlateDropdown, setShowPlateDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    partner_id: '',
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

  // Flatpickr 設定（繁體中文）
  // 為每個日期欄位創建獨立的配置對象，確保每個日曆都是獨立的
  const getDateOptions = React.useCallback(() => ({
    locale: MandarinTraditional,
    dateFormat: 'Y-m-d',
    allowInput: true,
    static: true, // 每個實例使用靜態定位，避免共享日曆
  }), []);

  const getDatetimeOptions = React.useCallback(() => ({
    locale: MandarinTraditional,
    dateFormat: 'Y-m-d H:i',
    enableTime: true,
    time_24hr: true,
    allowInput: true,
    static: true, // 每個實例使用靜態定位，避免共享日曆
  }), []);

  useEffect(() => {
    if (isOpen) {
      const initializeModal = async () => {
        // 先獲取可用機車和合作商
        await Promise.all([
          fetchAvailableScooters(),
          fetchPartners()
        ]);
        
        if (editingOrder) {
          // 編輯模式：預填表單數據並獲取訂單詳情以獲取機車 ID
          const formatDateTime = (dateTime: string | null) => {
            if (!dateTime) return '';
            const date = new Date(dateTime);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          };
          
          const formatDateOnly = (dateTime: string | null) => {
            if (!dateTime) return '';
            // 如果包含時間，只提取日期部分（處理可能帶時間的舊數據）
            return dateTime.split('T')[0].split(' ')[0];
          };
          
          const formatDate = (date: string) => {
            return date;
          };
          
          setFormData({
            partner_id: editingOrder.partner?.id.toString() || '',
            tenant: editingOrder.tenant,
            appointment_date: formatDate(editingOrder.appointment_date),
            start_time: formatDateOnly(editingOrder.start_time),
            end_time: formatDateOnly(editingOrder.end_time),
            expected_return_time: formatDateTime(editingOrder.expected_return_time),
            phone: editingOrder.phone || '',
            shipping_company: editingOrder.shipping_company || '',
            ship_arrival_time: formatDateTime(editingOrder.ship_arrival_time),
            ship_return_time: formatDateTime(editingOrder.ship_return_time),
            payment_method: editingOrder.payment_method || '',
            payment_amount: editingOrder.payment_amount.toString(),
            status: editingOrder.status,
            remark: editingOrder.remark || '',
          });
          
          // 從訂單詳情 API 獲取完整的機車 ID 列表
          try {
            const response = await ordersApi.get(editingOrder.id);
            const orderData = response.data;
            let scooterIds: number[] = [];
            
            // 如果 API 返回包含 scooter_ids 或完整的 scooters 數組
            if (orderData.scooter_ids && Array.isArray(orderData.scooter_ids)) {
              scooterIds = orderData.scooter_ids;
            } else if (orderData.scooters && Array.isArray(orderData.scooters)) {
              // 如果返回的是完整的機車對象數組
              scooterIds = orderData.scooters.map((s: any) => s.id || s.scooter_id).filter((id: any) => id);
            }
            
            if (scooterIds.length > 0) {
              // 獲取這些機車的完整信息（包括已租借的）
              const orderScooters = await fetchScootersByIds(scooterIds);
              // 將訂單中的機車也加入到可用機車列表中（如果還沒有）
              setAvailableScooters(prev => {
                const existingIds = new Set(prev.map(s => s.id));
                const newScooters = orderScooters.filter((s: Scooter) => !existingIds.has(s.id));
                return [...prev, ...newScooters];
              });
              // 確保在機車信息已載入後再設置選中的機車 ID
              setSelectedScooterIds(scooterIds);
            } else {
              setSelectedScooterIds([]);
            }
          } catch (error) {
            console.error('Failed to fetch order details:', error);
            setSelectedScooterIds([]);
          }
        } else {
          // 新增模式：重置表單
          setFormData({
            partner_id: '',
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
      };
      
      initializeModal();
    }
  }, [isOpen, editingOrder]);

  const fetchAvailableScooters = async () => {
    try {
      const response = await scootersApi.available();
      setAvailableScooters(response.data || []);
    } catch (error) {
      console.error('Failed to fetch available scooters:', error);
    }
  };

  const fetchScootersByIds = async (scooterIds: number[]): Promise<Scooter[]> => {
    try {
      // 獲取所有機車列表（包括已租借的），不傳 status 參數以獲取所有狀態的機車
      const response = await scootersApi.list();
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
      const response = await partnersApi.list();
      setPartners(response.data || []);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  };

  const toggleScooter = (scooterId: number) => {
    if (selectedScooterIds.includes(scooterId)) {
      setSelectedScooterIds(selectedScooterIds.filter(id => id !== scooterId));
    } else {
      setSelectedScooterIds([...selectedScooterIds, scooterId]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.appointment_date) {
      alert('請填寫必填欄位（預約日期）');
      return;
    }

    if (!formData.payment_amount) {
      alert('請填寫必填欄位（總金額）');
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

  const selectedScooters = availableScooters.filter(s => selectedScooterIds.includes(s.id));
  const filteredScooters = availableScooters.filter(s => 
    s.plate_number.toLowerCase().includes(searchPlate.toLowerCase())
  );

  // 計算選中機車按型號分組的統計
  const modelStats = React.useMemo(() => {
    const stats: Record<string, { count: number; scooters: Scooter[] }> = {};
    selectedScooters.forEach(scooter => {
      if (!stats[scooter.model]) {
        stats[scooter.model] = { count: 0, scooters: [] };
      }
      stats[scooter.model].count++;
      stats[scooter.model].scooters.push(scooter);
    });
    return stats;
  }, [selectedScooters]);

  // 按車牌號排序選中的機車
  const sortedSelectedScooters = React.useMemo(() => {
    return [...selectedScooters].sort((a, b) => a.plate_number.localeCompare(b.plate_number));
  }, [selectedScooters]);

  // 計算總台數（由各型號台數加總）
  const totalCount = React.useMemo(() => {
    return Object.values(modelStats).reduce((sum, stat) => sum + stat.count, 0);
  }, [modelStats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
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
                <Flatpickr
                  key={`appointment_date-${editingOrder?.id || 'new'}`}
                  className={inputClasses}
                  value={formData.appointment_date}
                  onChange={(dates) => {
                    if (dates && dates.length > 0) {
                      const date = dates[0];
                      // 使用本地時間避免時區轉換導致的日期偏移
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
                      setFormData(prev => ({ 
                        ...prev, 
                        appointment_date: dateStr
                      }));
                      // 通知父組件年份改變
                      if (onYearChange && year) {
                        onYearChange(year);
                      }
                    }
                  }}
                  options={getDateOptions()}
                  placeholder="選擇日期"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${labelClasses} flex items-center`}>
                    <Clock size={14} className="mr-1.5" /> 開始時間
                  </label>
                  <Flatpickr
                    key={`start_time-${editingOrder?.id || 'new'}`}
                    className={inputClasses}
                    value={formData.start_time}
                    onChange={(dates) => {
                      if (dates && dates.length > 0) {
                        const date = dates[0];
                        // 只保存日期格式，不帶時間
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        setFormData(prev => ({ ...prev, start_time: dateStr }));
                      }
                    }}
                    options={getDateOptions()}
                    placeholder="選擇日期"
                  />
                </div>
                <div>
                  <label className={`${labelClasses} flex items-center`}>
                    <Clock size={14} className="mr-1.5" /> 結束時間
                  </label>
                  <Flatpickr
                    key={`end_time-${editingOrder?.id || 'new'}`}
                    className={inputClasses}
                    value={formData.end_time}
                    onChange={(dates) => {
                      if (dates && dates.length > 0) {
                        const date = dates[0];
                        // 只保存日期格式，不帶時間
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        setFormData(prev => ({ ...prev, end_time: dateStr }));
                      }
                    }}
                    options={getDateOptions()}
                    placeholder="選擇日期"
                  />
                </div>
              </div>

              <div>
                <label className={`${labelClasses} flex items-center`}>
                  <Clock size={14} className="mr-1.5" /> 預計還車時間
                </label>
                <Flatpickr
                  key={`expected_return_time-${editingOrder?.id || 'new'}`}
                  className={inputClasses}
                  value={formData.expected_return_time}
                  onChange={(dates) => {
                    if (dates && dates.length > 0) {
                      const date = dates[0];
                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                      setFormData(prev => ({ ...prev, expected_return_time: dateStr }));
                    } else {
                      setFormData(prev => ({ ...prev, expected_return_time: '' }));
                    }
                  }}
                  options={getDatetimeOptions()}
                  placeholder="選擇日期時間"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>船班時間（來）</label>
                  <Flatpickr
                    key={`ship_arrival_time-${editingOrder?.id || 'new'}`}
                    className={inputClasses}
                    value={formData.ship_arrival_time}
                    onChange={(dates) => {
                      if (dates && dates.length > 0) {
                        const date = dates[0];
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                        setFormData(prev => ({ ...prev, ship_arrival_time: dateStr }));
                      } else {
                        setFormData(prev => ({ ...prev, ship_arrival_time: '' }));
                      }
                    }}
                    options={getDatetimeOptions()}
                    placeholder="選擇日期時間"
                  />
                </div>
                <div>
                  <label className={labelClasses}>船班時間（回）</label>
                  <Flatpickr
                    key={`ship_return_time-${editingOrder?.id || 'new'}`}
                    className={inputClasses}
                    value={formData.ship_return_time}
                    onChange={(dates) => {
                      if (dates && dates.length > 0) {
                        const date = dates[0];
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                        setFormData(prev => ({ ...prev, ship_return_time: dateStr }));
                      } else {
                        setFormData(prev => ({ ...prev, ship_return_time: '' }));
                      }
                    }}
                    options={getDatetimeOptions()}
                    placeholder="選擇日期時間"
                  />
                </div>
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
                  onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
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
                      {filteredScooters.map(s => (
                        <div 
                          key={s.id}
                          className={`px-5 py-3 hover:bg-orange-50 flex items-center justify-between cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${
                            selectedScooterIds.includes(s.id) ? 'bg-orange-50' : ''
                          }`}
                          onClick={() => {
                            toggleScooter(s.id);
                            setShowPlateDropdown(false);
                            setSearchPlate('');
                          }}
                        >
                          <div>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{s.plate_number}</span>
                            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-[10px] rounded font-bold text-gray-500">{s.type}</span>
                          </div>
                          <span className="text-xs text-gray-400">{s.model}</span>
                        </div>
                      ))}
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
                        {Object.entries(modelStats).map(([model, { count }]) => (
                          <div key={model} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{model}</span>
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
