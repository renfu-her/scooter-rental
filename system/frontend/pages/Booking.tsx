
import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { publicApi } from '../lib/api';

interface Captcha {
  captcha_id: string;
  image: string; // Base64 encoded image
}

const Booking: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    scooterType: '白牌',
    date: '',
    days: '1',
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

    setSubmitting(true);

    try {
      await publicApi.booking.send({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        scooterType: formData.scooterType,
        date: formData.date,
        days: formData.days,
        note: formData.note,
        captcha_id: captcha.captcha_id,
        captcha_answer: formData.captchaAnswer.toUpperCase().trim(),
      });
      alert('預約已成功提交！我們會盡快與您聯繫確認詳情。');
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        scooterType: '白牌', 
        date: '', 
        days: '1', 
        note: '',
        captchaAnswer: '',
      });
      fetchCaptcha(); // 重新獲取驗證碼
    } catch (error: any) {
      console.error('Failed to submit booking:', error);
      const errorMessage = error.response?.data?.message || '提交預約時發生錯誤，請稍後再試。';
      alert(errorMessage);
      // 如果驗證碼錯誤，重新獲取驗證碼
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

      <div className="container mx-auto px-6 max-w-4xl -mt-10 relative z-20">
        <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  姓名 <span className="text-red-500">*</span>
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
                  電子信箱 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all" 
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">聯絡電話</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all" 
                  placeholder="請輸入手機號碼"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">選擇車款</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all"
                  value={formData.scooterType}
                  onChange={e => setFormData({...formData, scooterType: e.target.value})}
                >
                  <option value="白牌">白牌 (Heavy)</option>
                  <option value="綠牌">綠牌 (Light)</option>
                  <option value="電輔車">電輔車 (E-Bike)</option>
                  <option value="三輪車">三輪車 (Tricycle)</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  預約日期 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">租借天數</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all"
                  value={formData.days}
                  onChange={e => setFormData({...formData, days: e.target.value})}
                >
                  <option value="1">1 天 (24小時)</option>
                  <option value="2">2 天 1 夜</option>
                  <option value="3">3 天 2 夜</option>
                  <option value="4">4 天以上</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">備註</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all h-24 resize-none"
                  placeholder="如有特殊需求請告知"
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                ></textarea>
              </div>
            </div>

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
                    // 只允許字母和數字，排除 O 和 0，最多 6 位，強制大寫
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

            <div className="md:col-span-2 pt-6">
              <button 
                type="submit"
                disabled={submitting || !captcha}
                className="w-full bg-black text-white py-5 rounded-full font-bold text-lg hover:bg-teal-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '提交中...' : '確認預約'}
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
