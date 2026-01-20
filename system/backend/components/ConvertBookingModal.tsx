import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { bookingsApi, partnersApi, rentalPlansApi } from '../lib/api';
import { inputClasses, labelClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface Booking {
  id: number;
  name: string;
  email: string | null;
  line_id: string | null;
  phone: string | null;
  booking_date: string;
  end_date: string | null;
  shipping_company: string | null;
  ship_arrival_time: string | null;
  adults: number | null;
  children: number | null;
  scooters: Array<{ model: string; count: number }>;
  partner_id: number | null;
  store_id: number | null;
  store?: { id: number; name: string } | null;
}

interface Partner {
  id: number;
  name: string;
}

interface RentalPlan {
  id: number;
  model: string;
  price: number;
}

interface ConvertBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess: () => void;
}

interface ScooterPriceItem {
  model: string;
  count: number;
  basePrice: number;
  days: number;
  amount: number;
}

const ConvertBookingModal: React.FC<ConvertBookingModalProps> = ({ isOpen, onClose, booking, onSuccess }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [rentalPlans, setRentalPlans] = useState<RentalPlan[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [scooterPrices, setScooterPrices] = useState<ScooterPriceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('現金');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 計算租借天數
  const calculateDays = (): number => {
    if (!booking) return 0;
    const startDate = new Date(booking.booking_date);
    const endDate = booking.end_date ? new Date(booking.end_date) : startDate;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // 獲取合作商和租車方案
  useEffect(() => {
    if (isOpen && booking) {
      setIsLoading(true);
      // 根據 booking 的 store_id 獲取該商店的合作商列表
      const storeId = booking.store_id || booking.store?.id;
      const partnersParams = storeId ? { store_id: storeId } : undefined;
      
      Promise.all([
        partnersApi.list(partnersParams),
        rentalPlansApi.list({ active_only: true }),
      ])
        .then(([partnersRes, plansRes]) => {
          setPartners(partnersRes.data || []);
          setRentalPlans(plansRes.data || []);

          // 設置預設合作商：優先使用 booking 的 partner_id，否則使用該商店的預設合作商
          let defaultPartnerId: number | null = booking.partner_id;
          if (!defaultPartnerId) {
            // 根據 booking 的 store_id 查找該商店的預設合作商
            const defaultPartner = (partnersRes.data || []).find((p: Partner) => 
              (p as any).is_default_for_booking === true
            );
            defaultPartnerId = defaultPartner ? defaultPartner.id : null;
          }
          setSelectedPartnerId(defaultPartnerId);

          // 初始化價格項目
          const days = calculateDays();
          const initialPrices: ScooterPriceItem[] = (booking.scooters || []).map((scooter) => {
            // 解析 model（格式：model + " " + type，例如 "EB-500 電輔車"）
            const parts = scooter.model.split(' ', 2);
            const model = parts[0] || '';
            
            // 從 RentalPlan 查找該車款的價格
            const plan = (plansRes.data || []).find((p: RentalPlan) => p.model === model);
            const basePrice = plan ? parseFloat(plan.price.toString()) : 0;
            const amount = basePrice * scooter.count * days;

            return {
              model: scooter.model,
              count: scooter.count,
              basePrice,
              days,
              amount,
            };
          });
          setScooterPrices(initialPrices);
          setTotalAmount(initialPrices.reduce((sum, item) => sum + item.amount, 0));
        })
        .catch((error) => {
          console.error('Failed to fetch data:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, booking]);

  // 更新價格項目
  const updateScooterPrice = (index: number, basePrice: number) => {
    const updated = [...scooterPrices];
    updated[index].basePrice = basePrice;
    updated[index].amount = basePrice * updated[index].count * updated[index].days;
    setScooterPrices(updated);
    setTotalAmount(updated.reduce((sum, item) => sum + item.amount, 0));
  };

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setIsSubmitting(true);
    try {
      // 確保預約的 store_id 被正確傳遞到訂單
      const storeId = booking.store_id || booking.store?.id || null;
      await bookingsApi.convertToOrder(booking.id, {
        partner_id: selectedPartnerId,
        payment_method: paymentMethod,
        store_id: storeId, // 確保預約的 store_id 被帶入訂單
        // 不傳入 payment_amount，讓後端根據合作商的機車型號費用自動計算調車費用
        // 不傳送 scooter_ids，讓後端自動選擇
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to convert booking:', error);
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">確認轉為訂單</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-orange-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 合作商 */}
              <div>
                <label className={labelClasses}>合作商</label>
                <select
                  value={selectedPartnerId || ''}
                  onChange={(e) => setSelectedPartnerId(e.target.value ? parseInt(e.target.value) : null)}
                  className={inputClasses}
                >
                  <option value="">請選擇合作商（可選）</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 付款方式 */}
              <div>
                <label className={labelClasses}>付款方式</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={inputClasses}
                  required
                >
                  <option value="現金">現金</option>
                  <option value="月結">月結</option>
                  <option value="日結">日結</option>
                  <option value="匯款">匯款</option>
                  <option value="刷卡">刷卡</option>
                  <option value="行動支付">行動支付</option>
                </select>
              </div>

              {/* 預約資訊（只讀） */}
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">承租人姓名：</span>
                    <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">{booking.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Email：</span>
                    <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">{booking.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">預約日期：</span>
                    <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                      {new Date(booking.booking_date).toLocaleDateString('zh-TW')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">結束日期：</span>
                    <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                      {booking.end_date ? new Date(booking.end_date).toLocaleDateString('zh-TW') : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">租借天數：</span>
                    <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">{calculateDays()} 天</span>
                  </div>
                </div>
              </div>

              {/* 價格計算 */}
              <div>
                <label className={labelClasses}>價格明細</label>
                <div className="space-y-3 mt-2">
                  {scooterPrices.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">{item.model}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.basePrice}
                              onChange={(e) => updateScooterPrice(index, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-right"
                            />
                            <span>× {item.count} 台 × {item.days} 天 =</span>
                            <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">
                              ${item.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 總金額 */}
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-200">總金額</span>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ${totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className={modalCancelButtonClasses}
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className={modalSubmitButtonClasses}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      處理中...
                    </>
                  ) : (
                    '確認轉為訂單'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConvertBookingModal;