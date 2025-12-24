import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Clock, Phone, FileText, Sparkles, Loader2 } from 'lucide-react';
import { ordersApi, scootersApi, partnersApi } from '../lib/api';
import { getSmartRecommendation } from '../lib/gemini';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const AddOrderModal: React.FC<AddOrderModalProps> = ({ isOpen, onClose }) => {
  const [availableScooters, setAvailableScooters] = useState<Scooter[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedScooterIds, setSelectedScooterIds] = useState<number[]>([]);
  const [searchPlate, setSearchPlate] = useState('');
  const [showPlateDropdown, setShowPlateDropdown] = useState(false);
  
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
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
    status: '預約中',
    remark: '',
  });

  const inputClasses = "w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200";

  useEffect(() => {
    if (isOpen) {
      fetchAvailableScooters();
      fetchPartners();
      // Reset form
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
        status: '預約中',
        remark: '',
      });
      setSelectedScooterIds([]);
      setSearchPlate('');
      setAiInput('');
      setAiRecommendation(null);
    }
  }, [isOpen]);

  const fetchAvailableScooters = async () => {
    try {
      const response = await scootersApi.available();
      setAvailableScooters(response.data || []);
    } catch (error) {
      console.error('Failed to fetch available scooters:', error);
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

  const handleAiRecommend = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    setAiRecommendation(null);
    try {
      const result = await getSmartRecommendation(`客戶描述：${aiInput}`);
      if (result) {
        setAiRecommendation(result.recommendation);
        // Auto-select if models match (simple demo logic)
        const toSelect: number[] = [];
        result.suggestedScooters?.forEach((suggestion: any) => {
          const matches = availableScooters
            .filter(s => s.model === suggestion.model)
            .slice(0, suggestion.count)
            .map(s => s.id);
          toSelect.push(...matches);
        });
        setSelectedScooterIds([...selectedScooterIds, ...toSelect]);
      }
    } catch (error) {
      console.error('AI recommendation failed:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.tenant || !formData.appointment_date || !formData.start_time || !formData.end_time || !formData.payment_amount) {
      alert('請填寫必填欄位');
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

      await ordersApi.create(orderData);
      onClose();
    } catch (error: any) {
      console.error('Failed to create order:', error);
      alert(error.message || '建立訂單失敗，請檢查輸入資料');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedScooters = availableScooters.filter(s => selectedScooterIds.includes(s.id));
  const filteredScooters = availableScooters.filter(s => 
    s.plate_number.toLowerCase().includes(searchPlate.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            新增租借訂單
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1">
          {/* AI Helper Bar */}
          <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-2xl">
            <div className="flex items-center space-x-2 text-orange-700 font-bold mb-3">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-sm">AI 智慧推薦配車</span>
            </div>
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="描述需求，例如：兩大一小去環島，想要白牌車..." 
                className={inputClasses}
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
              />
              <button 
                onClick={handleAiRecommend}
                disabled={isAiLoading}
                className="bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-700 disabled:opacity-50 flex items-center shadow-md shadow-orange-100 active:scale-95 transition-all"
              >
                {isAiLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
                自動建議
              </button>
            </div>
            {aiRecommendation && (
              <div className="mt-3 p-3 bg-white/60 dark:bg-gray-700/60 rounded-xl text-xs text-orange-800 dark:text-orange-300 border border-orange-100 dark:border-orange-800 italic leading-relaxed">
                <span className="font-bold mr-1">AI 建議：</span>{aiRecommendation}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">合作商選擇</label>
                <select 
                  className={inputClasses}
                  value={formData.partner_id}
                  onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                >
                  <option value="">請選擇合作商（非必選）</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>{partner.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">承租人資訊 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className={inputClasses} 
                  placeholder="輸入承租人全名"
                  value={formData.tenant}
                  onChange={(e) => setFormData({ ...formData, tenant: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
                  <Calendar size={14} className="mr-1.5" /> 預約日期 <span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  type="date" 
                  className={inputClasses} 
                  required
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
                    <Clock size={14} className="mr-1.5" /> 開始時間 <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    className={inputClasses}
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
                    <Clock size={14} className="mr-1.5" /> 結束時間 <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    className={inputClasses}
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
                  <Clock size={14} className="mr-1.5" /> 預計還車時間
                </label>
                <input 
                  type="datetime-local" 
                  className={inputClasses}
                  value={formData.expected_return_time}
                  onChange={(e) => setFormData({ ...formData, expected_return_time: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
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
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">航運公司</label>
                <select 
                  className={inputClasses}
                  value={formData.shipping_company}
                  onChange={(e) => setFormData({ ...formData, shipping_company: e.target.value })}
                >
                  <option value="">請選擇</option>
                  <option value="泰富">泰富</option>
                  <option value="藍白">藍白</option>
                  <option value="聯營">聯營</option>
                  <option value="大福">大福</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">船班時間（來）</label>
                  <input 
                    type="datetime-local" 
                    className={inputClasses}
                    value={formData.ship_arrival_time}
                    onChange={(e) => setFormData({ ...formData, ship_arrival_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">船班時間（回）</label>
                  <input 
                    type="datetime-local" 
                    className={inputClasses}
                    value={formData.ship_return_time}
                    onChange={(e) => setFormData({ ...formData, ship_return_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">付款方式</label>
                <select 
                  className={inputClasses}
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <option value="">請選擇</option>
                  <option value="現金">現金</option>
                  <option value="月結">月結</option>
                  <option value="日結">日結</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
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
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">備註</label>
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

                <div className="mt-4 p-5 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 min-h-[140px]">
                  {selectedScooters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-6 text-gray-400">
                      <Search size={32} className="opacity-10 mb-2" />
                      <p className="text-xs">目前尚未選擇任何機車</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <div className="flex flex-wrap gap-2">
                          {selectedScooters.map(s => (
                            <span key={s.id} className="inline-flex items-center px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-sm">
                              {s.plate_number}
                              <button 
                                className="ml-2 hover:text-white/70" 
                                onClick={() => toggleScooter(s.id)}
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end space-x-4 sticky bottom-0 z-10">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-all"
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
                建立中...
              </>
            ) : (
              '建立訂單'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOrderModal;
