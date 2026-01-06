
import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, Plus, X } from 'lucide-react';
import { publicApi } from '../lib/api';

interface Captcha {
  captcha_id: string;
  image: string; // Base64 encoded image
}

interface ScooterSelection {
  id: string;
  model: string;
  count: number;
}

const Booking: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    lineId: '',
    phone: '',
    appointmentDate: '',
    endDate: '',
    shippingCompany: '',
    shipArrivalTime: '',
    adults: '',
    children: '',
    scooters: [] as ScooterSelection[],
    note: '',
    captchaAnswer: '',
  });
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const fetchCaptcha = async () => {
    setIsLoadingCaptcha(true);
    try {
      const response = await publicApi.captcha.generate();
      if (response && response.data) {
        setCaptcha(response.data);
        setFormData(prev => ({ ...prev, captchaAnswer: '' }));
      }
    } catch (error) {
      console.error('Failed to fetch captcha:', error);
    } finally {
      setIsLoadingCaptcha(false);
    }
  };

  const addScooter = () => {
    setFormData(prev => ({
      ...prev,
      scooters: [...prev.scooters, { id: Date.now().toString(), model: '', count: 1 }]
    }));
  };

  const removeScooter = (id: string) => {
    setFormData(prev => ({
      ...prev,
      scooters: prev.scooters.filter(s => s.id !== id)
    }));
  };

  const updateScooter = (id: string, field: 'model' | 'count', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      scooters: prev.scooters.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captcha) {
      alert('請先獲取驗證碼');
      return;
    }

    if (!formData.captchaAnswer || formData.captchaAnswer.length !== 6) {
      alert('請輸入完整的 6 位驗證碼');
      return;
    }

    if (formData.scooters.length === 0) {
      alert('請至少選擇一種租車類型');
      return;
    }

    setSubmitting(true);

    try {
      await publicApi.booking.send({
        name: formData.name,
        lineId: formData.lineId,
        phone: formData.phone,
        appointmentDate: formData.appointmentDate,
        endDate: formData.endDate,
        shippingCompany: formData.shippingCompany,
        shipArrivalTime: formData.shipArrivalTime,
        adults: formData.adults,
        children: formData.children,
        scooters: formData.scooters,
        note: formData.note,
        captcha_id: captcha.captcha_id,
        captcha_answer: formData.captchaAnswer.toUpperCase().trim(),
      });
      alert('預約已成功提交！我們會盡快與您聯繫確認詳情。');
      setFormData({ 
        name: '', 
        lineId: '', 
        phone: '', 
        appointmentDate: '',
        endDate: '',
        shippingCompany: '',
        shipArrivalTime: '',
        adults: '',
        children: '',
        scooters: [],
        note: '',
        captchaAnswer: '',
      });
      fetchCaptcha();
    } catch (error: any) {
      console.error('Failed to submit booking:', error);
      const errorMessage = error.response?.data?.message || '提交預約時發生錯誤，請稍後再試。';
      alert(errorMessage);
      if (error.response?.status === 422) {
        fetchCaptcha();
      }
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
              <li>2. 填寫表單後不代表預約成功，店家將再透過email或電話與您聯絡</li>
              <li>3. 若24小時內未接到我們的回傳mail或聯絡電話，請主動與我們聯絡，不便之處敬請見諒！</li>
              <li>4. 如需直接訂購請直撥0911306011來電訂車</li>
              <li>5. ID搜尋@623czmsm加入官方LINE更能快速確認訂單</li>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all"
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  min={formData.appointmentDate}
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all"
                  value={formData.shipArrivalTime}
                  onChange={e => setFormData({...formData, shipArrivalTime: e.target.value})}
                />
              </div>
            </div>

            {/* 右欄 */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  人數
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">大人</label>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all" 
                      placeholder="0"
                      value={formData.adults}
                      onChange={e => setFormData({...formData, adults: e.target.value})}
                    />
                    <span className="text-xs text-gray-500 mt-1 block">人</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">小孩（12歲以下）</label>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all" 
                      placeholder="0"
                      value={formData.children}
                      onChange={e => setFormData({...formData, children: e.target.value})}
                    />
                    <span className="text-xs text-gray-500 mt-1 block">人</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  所需租車類型/數量 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {formData.scooters.map((scooter) => (
                    <div key={scooter.id} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <select 
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all"
                          value={scooter.model}
                          onChange={e => updateScooter(scooter.id, 'model', e.target.value)}
                        >
                          <option value="">請選擇車型</option>
                          <option value="VIVA MIX 白牌">VIVA MIX 白牌</option>
                          <option value="VIVA 綠牌">VIVA 綠牌</option>
                          <option value="電輔車">電輔車</option>
                          <option value="三輪車">三輪車</option>
                        </select>
                      </div>
                      <div className="w-24">
                        <input 
                          type="number" 
                          min="1"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all"
                          value={scooter.count}
                          onChange={e => updateScooter(scooter.id, 'count', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeScooter(scooter.id)}
                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addScooter}
                    className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
                  >
                    <Plus size={18} />
                    增加租車類型
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">需求說明</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all h-32 resize-none"
                  placeholder="如有特殊需求請告知"
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                ></textarea>
              </div>
            </div>

            {/* 驗證碼 */}
            <div className="md:col-span-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  驗證碼 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-center min-h-[60px]">
                    {isLoadingCaptcha ? (
                      <Loader2 size={20} className="animate-spin text-gray-400" />
                    ) : captcha ? (
                      <img 
                        src={captcha.image} 
                        alt="驗證碼" 
                        className="h-12 w-auto select-none cursor-pointer"
                        style={{ imageRendering: 'auto' }}
                        onClick={fetchCaptcha}
                        title="點擊刷新驗證碼"
                      />
                    ) : (
                      <span className="text-sm text-gray-400">載入驗證碼中...</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={isLoadingCaptcha || submitting}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
                    title="重新獲取驗證碼"
                  >
                    <RefreshCw size={18} className={`text-gray-600 ${isLoadingCaptcha ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.captchaAnswer}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[O0]/g, '').slice(0, 6);
                    setFormData({ ...formData, captchaAnswer: value });
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-black focus:ring-0 outline-none transition-all uppercase font-mono tracking-widest text-center text-lg"
                  placeholder="輸入 6 位驗證碼"
                  disabled={submitting || !captcha}
                  maxLength={6}
                  pattern="[A-NP-Z1-9]{6}"
                />
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="md:col-span-2 pt-6">
              <button 
                type="submit"
                disabled={submitting || !captcha || formData.scooters.length === 0}
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
