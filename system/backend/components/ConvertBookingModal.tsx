
import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown } from 'lucide-react';
import { bookingsApi, partnersApi, scootersApi } from '../lib/api';
import { inputClasses, selectClasses, labelClasses, modalCancelButtonClasses, modalSubmitButtonClasses, chevronDownClasses } from '../styles';

interface Booking {
  id: number;
  name: string;
  line_id: string | null;
  phone: string | null;
  booking_date: string;
  end_date: string | null;
  shipping_company: string | null;
  ship_arrival_time: string | null;
  adults: number | null;
  children: number | null;
  scooters: Array<{ model: string; count: number }> | null;
  note: string | null;
}

interface Partner {
  id: number;
  name: string;
}

interface Scooter {
  id: number;
  plate_number: string;
  model: string;
  type: string;
  status: string;
}

interface ConvertBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess: (bookingId: number) => void;
}

const ConvertBookingModal: React.FC<ConvertBookingModalProps> = ({ isOpen, onClose, booking, onSuccess }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [availableScooters, setAvailableScooters] = useState<Scooter[]>([]);
  const [selectedScooterIds, setSelectedScooterIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    partner_id: '',
    payment_method: '',
    payment_amount: '',
  });

  useEffect(() => {
    if (isOpen && booking) {
      fetchPartners();
      fetchAvailableScooters();
      setFormData({
        partner_id: '',
        payment_method: '',
        payment_amount: '',
      });
      setSelectedScooterIds([]);
    }
  }, [isOpen, booking]);

  const fetchPartners = async () => {
    try {
      const response = await partnersApi.list();
      setPartners(response.data || []);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  };

  const fetchAvailableScooters = async () => {
    try {
      const response = await scootersApi.available();
      setAvailableScooters(response.data || []);
    } catch (error) {
      console.error('Failed to fetch available scooters:', error);
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
    if (!formData.payment_method) {
      alert('請選擇付款方式');
      return;
    }

    if (!formData.payment_amount || parseFloat(formData.payment_amount) <= 0) {
      alert('請填寫付款金額');
      return;
    }

    if (selectedScooterIds.length === 0) {
      alert('請至少選擇一台機車');
      return;
    }

    if (!booking) return;

    setIsSubmitting(true);
    try {
      await bookingsApi.convertToOrder(booking.id, {
        partner_id: formData.partner_id || null,
        payment_method: formData.payment_method,
        payment_amount: parseFloat(formData.payment_amount),
        scooter_ids: selectedScooterIds,
      });
      onSuccess(booking.id);
      onClose();
    } catch (error: any) {
      console.error('Failed to convert booking to order:', error);
      const errorMessage = error.response?.data?.message || '轉換訂單時發生錯誤，請稍後再試。';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">確認預約轉為訂單</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 預約資訊（只讀） */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">預約資訊</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">承租人：</span>
                <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">{booking.name}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">電話：</span>
                <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">{booking.phone || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">LINE ID：</span>
                <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">{booking.line_id || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">預約日期：</span>
                <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">
                  {new Date(booking.booking_date).toLocaleDateString('zh-TW')}
                </span>
              </div>
              {booking.end_date && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">結束日期：</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">
                    {new Date(booking.end_date).toLocaleDateString('zh-TW')}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-600 dark:text-gray-400">船運公司：</span>
                <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">{booking.shipping_company || '-'}</span>
              </div>
              {booking.ship_arrival_time && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">船班時間：</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">
                    {new Date(booking.ship_arrival_time).toLocaleString('zh-TW')}
                  </span>
                </div>
              )}
              {booking.adults !== null && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">大人：</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">{booking.adults} 人</span>
                </div>
              )}
              {booking.children !== null && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">小孩：</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">{booking.children} 人</span>
                </div>
              )}
            </div>
            {booking.scooters && Array.isArray(booking.scooters) && booking.scooters.length > 0 && (
              <div className="mt-3">
                <span className="text-gray-600 dark:text-gray-400 text-sm">預約租車類型：</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {booking.scooters.map((scooter, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white dark:bg-gray-600 rounded text-xs">
                      {scooter.model} x {scooter.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {booking.note && (
              <div className="mt-3">
                <span className="text-gray-600 dark:text-gray-400 text-sm">備註：</span>
                <p className="text-gray-800 dark:text-gray-100 text-sm mt-1">{booking.note}</p>
              </div>
            )}
          </div>

          {/* 表單欄位 */}
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>合作商</label>
              <div className="relative">
                <select
                  className={selectClasses}
                  value={formData.partner_id}
                  onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                >
                  <option value="">請選擇（可選）</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      {partner.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className={chevronDownClasses} />
              </div>
            </div>

            <div>
              <label className={labelClasses}>
                付款方式 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className={selectClasses}
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  required
                >
                  <option value="">請選擇付款方式</option>
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
              <label className={labelClasses}>
                付款金額 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className={inputClasses}
                value={formData.payment_amount}
                onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                placeholder="請輸入付款金額"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className={labelClasses}>
                選擇機車 <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 max-h-60 overflow-y-auto">
                {availableScooters.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">載入中...</p>
                ) : (
                  <div className="space-y-2">
                    {availableScooters.map((scooter) => (
                      <label
                        key={scooter.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedScooterIds.includes(scooter.id)
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500'
                            : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedScooterIds.includes(scooter.id)}
                          onChange={() => toggleScooter(scooter.id)}
                          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 dark:text-gray-100">
                            {scooter.plate_number} - {scooter.model}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {scooter.type} | {scooter.status}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedScooterIds.length > 0 && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  已選擇 {selectedScooterIds.length} 台機車
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-3">
          <button onClick={onClose} className={modalCancelButtonClasses}>
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={modalSubmitButtonClasses}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                轉換中...
              </>
            ) : (
              '確認轉為訂單'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertBookingModal;
