
import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import SEO from '../components/SEO';
import { publicApi } from '../lib/api';

interface ScooterModel {
  model: string;
  type: string;
  label: string; // model + type 組合，例如 "ES-2000 白牌"
}

interface ScooterItem {
  id: string;
  model: string;
  type: string;
  count: number;
}

const Booking: React.FC = () => {
  // 獲取今天的日期（格式：YYYY-MM-DD）
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 獲取今天的日期時間（格式：YYYY-MM-DDTHH:mm）
  const getTodayDateTime = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const todayDate = getTodayDate();
  const todayDateTime = getTodayDateTime();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    lineId: '',
    phone: '',
    storeId: '',
    appointmentDate: '',
    endDate: '',
    shippingCompany: '',
    shipArrivalTime: '',
    adults: '',
    children: '',
    note: '',
  });
  const [stores, setStores] = useState<Array<{ id: number; name: string }>>([]);
  const [scooterItems, setScooterItems] = useState<ScooterItem[]>([
    { id: '1', model: '', type: '', count: 1 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [scooterModels, setScooterModels] = useState<ScooterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    fetchDefaultShippingCompany();
    fetchStores();
  }, []);

  // 當選擇商店時，重新獲取該商店的機車型號和預設合作商
  useEffect(() => {
    if (formData.storeId) {
      fetchScooterModels();
      fetchDefaultShippingCompany();
      // 清空已選擇的機車項目（因為不同商店可能有不同的機車型號）
      setScooterItems([{ id: '1', model: '', type: '', count: 1 }]);
    } else {
      // 如果沒有選擇商店，獲取所有機車型號
      fetchScooterModels();
    }
  }, [formData.storeId]);

  const fetchStores = async () => {
    try {
      const response = await publicApi.stores.list();
      const sortedStores = (response.data || []).sort((a, b) => a.id - b.id);
      setStores(sortedStores);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  };

  const fetchDefaultShippingCompany = async () => {
    try {
      // 根據選擇的商店獲取該商店的合作商列表
      const params = formData.storeId ? { store_id: parseInt(formData.storeId) } : undefined;
      const response = await publicApi.partners.list(params);
      const partners = response.data || [];
      
      // 查找該商店的預設合作商（is_default_for_booking = true）
      const defaultPartner = partners.find((p: any) => p.is_default_for_booking === true);
      
      if (defaultPartner && defaultPartner.default_shipping_company) {
        setFormData(prev => ({
          ...prev,
          shippingCompany: defaultPartner.default_shipping_company,
        }));
      } else if (!formData.shippingCompany) {
        // 如果沒有找到預設合作商，且目前沒有設置船運公司，清空
        setFormData(prev => ({
          ...prev,
          shippingCompany: '',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch default shipping company:', error);
    }
  };

  const fetchScooterModels = async () => {
    setIsLoadingModels(true);
    try {
      // 根據選擇的商店獲取機車型號
      const params = formData.storeId ? { store_id: parseInt(formData.storeId) } : undefined;
      const response = await publicApi.scooters.models(params);
      if (response && response.data) {
        setScooterModels(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch scooter models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleScooterChange = (id: string, label: string) => {
    const selectedModel = scooterModels.find(m => m.label === label);
    if (selectedModel) {
      setScooterItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, model: selectedModel.model, type: selectedModel.type }
          : item
      ));
    }
  };

  const handleScooterCountChange = (id: string, count: number) => {
    setScooterItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, count: Math.max(1, count) }
        : item
    ));
  };

  const addScooterItem = () => {
    const newId = Date.now().toString();
    setScooterItems(prev => [...prev, { id: newId, model: '', type: '', count: 1 }]);
  };

  const removeScooterItem = (id: string) => {
    if (scooterItems.length > 1) {
      setScooterItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證商店選擇
    if (!formData.storeId) {
      alert('請選擇商店');
      return;
    }

    // 驗證所有租車項目都已選擇
    const invalidItems = scooterItems.filter(item => !item.model || !item.type || item.count < 1);
    if (invalidItems.length > 0) {
      alert('請完整填寫所有租車類型/數量');
      return;
    }

    setSubmitting(true);

    try {
      await publicApi.booking.send({
        name: formData.name,
        email: formData.email,
        lineId: formData.lineId || undefined,
        phone: formData.phone,
        storeId: formData.storeId,
        appointmentDate: formData.appointmentDate,
        endDate: formData.endDate,
        shippingCompany: formData.shippingCompany,
        shipArrivalTime: formData.shipArrivalTime,
        adults: formData.adults ? parseInt(formData.adults) : undefined,
        children: formData.children ? parseInt(formData.children) : undefined,
        scooters: scooterItems.map(item => ({
          model: item.model,
          type: item.type,
          count: item.count,
        })),
        note: formData.note || undefined,
      });
      alert('預約已成功提交！我們會盡快與您聯繫確認詳情。');
      setFormData({ 
        name: '', 
        email: '',
        lineId: '', 
        phone: '',
        storeId: '',
        appointmentDate: '',
        endDate: '',
        shippingCompany: '',
        shipArrivalTime: '',
        adults: '',
        children: '',
        note: '',
      });
      setScooterItems([{ id: '1', model: '', type: '', count: 1 }]);
    } catch (error: any) {
      console.error('Failed to submit booking:', error);
      const errorMessage = error.response?.data?.message || '提交預約時發生錯誤，請稍後再試。';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ReservationAction',
    name: '線上預約 - 蘭光電動機車',
    description: '透過線上表單預約小琉球電動車租賃服務，方便快速，讓您輕鬆規劃小琉球之旅。',
    url: `${window.location.origin}/booking`,
    target: {
      '@type': 'LocalBusiness',
      name: '蘭光電動機車'
    }
  };

  return (
    <div className="animate-in fade-in duration-700 pb-24">
      <SEO
        title="線上預約 - 蘭光電動機車"
        description="透過線上表單預約小琉球電動車租賃服務，方便快速，讓您輕鬆規劃小琉球之旅。"
        keywords="線上預約,小琉球租車預約,電動車預約,蘭光電動機車預約"
        url="/booking"
        structuredData={structuredData}
      />
      <header className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-black text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src="https://picsum.photos/seed/beach/1920/400" className="w-full h-full object-cover" alt="Beach" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-white/80 tracking-[0.3em] uppercase mb-2 text-xs sm:text-sm">Online Reservation</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl serif font-light mb-3 sm:mb-4 text-white">線上預約</h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base px-4">透過線上預約系統，輕鬆完成租車預訂，享受便捷快速的服務體驗。</p>
          <div className="mt-3 sm:mt-4 text-xs text-white/60">首頁 &gt; 線上預約</div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl -mt-6 sm:-mt-8 md:-mt-10 relative z-20">
        <div className="bg-white rounded-[30px] sm:rounded-[35px] md:rounded-[40px] shadow-2xl p-6 sm:p-8 md:p-12">
          {/* 注意事項 */}
          <div className="mb-6 sm:mb-8 bg-gray-50 rounded-xl p-4 sm:p-6 border-l-4 border-teal-600">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">注意事項</h3>
            <ol className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
              <li>1. 歡迎透過下列表單向店家確認租賃日期</li>
              <li>2. 填寫表單後<span className="text-red-600 font-bold text-base">不代表預約成功</span>，店家將再透過email或電話與您聯絡</li>
              <li>3. 若<span className="text-red-600 font-bold text-base">24小時內</span>未接到我們的回傳mail或聯絡電話，請主動與我們聯絡，不便之處敬請見諒！</li>
              <li>4. 如需直接訂購，請參閱「<span className="text-red-600 font-bold">聯絡我們</span>」頁面，並撥打您欲前往之店面電話進行訂車</li>
              <li>5. ID搜尋<span className="text-red-600 font-bold text-base">@623czmsm</span>加入官方LINE更能快速確認訂單</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* 左欄 */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  承租人姓名 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-sm sm:text-base" 
                  placeholder="請輸入姓名"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  required
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-sm sm:text-base" 
                  placeholder="請輸入您的 Email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  LINE ID
                  <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-gray-500 font-normal">
                    （<a href="https://line.me/R/ti/p/@623czmsm?oat_content=url&ts=01042332" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline">請加入 LINE 好友，點此連結</a>）
                  </span>
                </label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-sm sm:text-base" 
                  placeholder="請輸入您的 LINE ID（例如：@623czmsm）"
                  value={formData.lineId}
                  onChange={e => setFormData({...formData, lineId: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  行動電話 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel" 
                  required
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-sm sm:text-base" 
                  placeholder="請輸入手機號碼"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  選擇商店 <span className="text-red-500">*</span>
                </label>
                <select 
                  required
                  className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl border-2 border-[#0D9488] focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 transition-all text-base sm:text-lg font-medium text-[#0D9488] bg-white"
                  style={{ color: formData.storeId ? '#0D9488' : '#6b7280' }}
                  value={formData.storeId}
                  onChange={e => setFormData({...formData, storeId: e.target.value})}
                >
                  <option value="" className="text-gray-500">請選擇商店</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id} className="text-[#0D9488]">
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  預約日期 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  required
                  min={todayDate}
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all cursor-pointer text-sm sm:text-base"
                  value={formData.appointmentDate}
                  onChange={e => setFormData({...formData, appointmentDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  結束日期 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  required
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all cursor-pointer text-sm sm:text-base"
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  min={formData.appointmentDate || todayDate}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  船運公司 <span className="text-red-500">*</span>
                </label>
                <select 
                  required
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-sm sm:text-base"
                  value={formData.shippingCompany}
                  onChange={e => setFormData({...formData, shippingCompany: e.target.value})}
                >
                  <option value="">請選擇船運公司</option>
                  <option value="泰富">泰富</option>
                  <option value="藍白">藍白</option>
                  <option value="聯營">聯營</option>
                  <option value="大福">大福</option>
                  <option value="公船">公船</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  船班時間（來） <span className="text-red-500">*</span>
                </label>
                <input 
                  type="datetime-local" 
                  required
                  min={todayDateTime}
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all cursor-pointer text-sm sm:text-base"
                  value={formData.shipArrivalTime}
                  onChange={e => setFormData({...formData, shipArrivalTime: e.target.value})}
                />
              </div>
            </div>

            {/* 右欄 */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">大人 / 人數</label>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-sm sm:text-base" 
                      placeholder="0"
                      value={formData.adults}
                      onChange={e => setFormData({...formData, adults: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">小孩（12歲以下）/ 人數</label>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-sm sm:text-base" 
                      placeholder="0"
                      value={formData.children}
                      onChange={e => setFormData({...formData, children: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  所需租車類型/數量 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {scooterItems.map((item, index) => (
                    <div key={item.id} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <select 
                          required
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-sm sm:text-base"
                          value={item.model && item.type ? `${item.model} ${item.type}` : ''}
                          onChange={e => handleScooterChange(item.id, e.target.value)}
                          disabled={isLoadingModels}
                        >
                          <option value="">請選擇車型</option>
                          {scooterModels.map((model, idx) => (
                            <option key={idx} value={model.label}>
                              {model.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20 sm:w-24">
                        <input 
                          type="number" 
                          min="1"
                          required
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-sm sm:text-base"
                          value={item.count}
                          onChange={e => handleScooterCountChange(item.id, parseInt(e.target.value) || 1)}
                        />
                      </div>
                      {scooterItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScooterItem(item.id)}
                          className="p-2.5 sm:p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-all"
                          title="移除"
                        >
                          <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                    )}
                  </div>
                  ))}
                  <button
                    type="button"
                    onClick={addScooterItem}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-300 rounded-xl hover:bg-teal-50 transition-all"
                  >
                    <Plus size={16} />
                    新增租車類型
                  </button>
                </div>
              </div>

            </div>

            {/* 提交按鈕 */}
            <div className="md:col-span-2 pt-4 sm:pt-6">
              <button 
                type="submit"
                disabled={submitting || !formData.storeId || scooterItems.some(item => !item.model || !item.type)}
                className="w-full bg-black text-white py-4 sm:py-5 rounded-full font-bold text-base sm:text-lg hover:bg-teal-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '提交中...' : '確認送出'}
              </button>
              <p className="mt-3 sm:mt-4 text-center text-xs text-gray-400">
                預約完成後，我們將有專人與您電話聯繫確認詳情。
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Booking;
