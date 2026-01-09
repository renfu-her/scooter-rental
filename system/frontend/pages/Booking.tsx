
import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
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
    appointmentDate: '',
    endDate: '',
    shippingCompany: '',
    shipArrivalTime: '',
    adults: '',
    children: '',
    note: '',
  });
  const [scooterItems, setScooterItems] = useState<ScooterItem[]>([
    { id: '1', model: '', type: '', count: 1 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [scooterModels, setScooterModels] = useState<ScooterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    fetchScooterModels();
  }, []);

  const fetchScooterModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await publicApi.scooters.models();
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

  return (
    <div className="animate-in fade-in duration-700 pb-24">
      <header className="py-20 px-6 bg-black text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src="https://picsum.photos/seed/beach/1920/400" className="w-full h-full object-cover" alt="Beach" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-white/80 tracking-[0.3em] uppercase mb-2 text-sm">Online Reservation</p>
          <h1 className="text-5xl md:text-6xl serif font-light mb-4 text-white">線上預約</h1>
          <p className="text-white/80 max-w-xl mx-auto text-base">透過線上預約系統，輕鬆完成租車預訂，享受便捷快速的服務體驗。</p>
          <div className="mt-4 text-xs text-white/60">首頁 &gt; 線上預約</div>
        </div>
      </header>

      <div className="container mx-auto px-6 max-w-6xl -mt-10 relative z-20">
        <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12">
          {/* 注意事項 */}
          <div className="mb-8 bg-gray-50 rounded-xl p-6 border-l-4 border-teal-600">
            <h3 className="text-lg font-bold text-gray-800 mb-4">注意事項</h3>
            <ol className="space-y-2 text-sm text-gray-700 leading-relaxed">
              <li>1. 歡迎透過下列表單向店家確認租賃日期</li>
              <li>2. 填寫表單後<span className="text-red-600 font-bold text-base">不代表預約成功</span>，店家將再透過email或電話與您聯絡</li>
              <li>3. 若<span className="text-red-600 font-bold text-base">24小時內</span>未接到我們的回傳mail或聯絡電話，請主動與我們聯絡，不便之處敬請見諒！</li>
              <li>4. 如需直接訂購請直撥<span className="text-red-600 font-bold text-base">0911306011</span>來電訂車</li>
              <li>5. ID搜尋<span className="text-red-600 font-bold text-base">@623czmsm</span>加入官方LINE更能快速確認訂單</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
            {/* 左欄 */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  承租人姓名 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all" 
                  placeholder="請輸入姓名"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all" 
                  placeholder="請輸入您的 Email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  LINE ID
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    （<a href="https://line.me/R/ti/p/@623czmsm?oat_content=url&ts=01042332" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline">請加入 LINE 好友，點此連結</a>）
                  </span>
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all" 
                  placeholder="請輸入您的 LINE ID（例如：@623czmsm）"
                  value={formData.lineId}
                  onChange={e => setFormData({...formData, lineId: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  行動電話 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all" 
                  placeholder="請輸入手機號碼"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
            </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  預約日期 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  required
                  min={todayDate}
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all cursor-pointer"
                  value={formData.appointmentDate}
                  onChange={e => setFormData({...formData, appointmentDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  結束日期 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  required
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all cursor-pointer"
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  min={formData.appointmentDate || todayDate}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  船運公司 <span className="text-red-500">*</span>
                </label>
                <select 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all"
                  value={formData.shippingCompany}
                  onChange={e => setFormData({...formData, shippingCompany: e.target.value})}
                >
                  <option value="">請選擇船運公司</option>
                  <option value="泰富">泰富</option>
                  <option value="藍白">藍白</option>
                  <option value="聯營">聯營</option>
                  <option value="大福">大福</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  船班時間（來） <span className="text-red-500">*</span>
                </label>
                <input 
                  type="datetime-local" 
                  required
                  min={todayDateTime}
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all cursor-pointer"
                  value={formData.shipArrivalTime}
                  onChange={e => setFormData({...formData, shipArrivalTime: e.target.value})}
                />
              </div>
            </div>

            {/* 右欄 */}
            <div className="space-y-6">
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">大人 / 人數</label>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-base" 
                      placeholder="0"
                      value={formData.adults}
                      onChange={e => setFormData({...formData, adults: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">小孩（12歲以下）/ 人數</label>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-base" 
                      placeholder="0"
                      value={formData.children}
                      onChange={e => setFormData({...formData, children: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  所需租車類型/數量 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {scooterItems.map((item, index) => (
                    <div key={item.id} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <select 
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all text-base"
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
                      <div className="w-24">
                        <input 
                          type="number" 
                          min="1"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all"
                          value={item.count}
                          onChange={e => handleScooterCountChange(item.id, parseInt(e.target.value) || 1)}
                        />
                      </div>
                      {scooterItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScooterItem(item.id)}
                          className="p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-all"
                          title="移除"
                        >
                          <X size={18} />
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
            <div className="md:col-span-2 pt-6">
              <button 
                type="submit"
                disabled={submitting || scooterItems.some(item => !item.model || !item.type)}
                className="w-full bg-black text-white py-5 rounded-full font-bold text-lg hover:bg-teal-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '提交中...' : '確認送出'}
              </button>
              <p className="mt-4 text-center text-xs text-gray-400">
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
