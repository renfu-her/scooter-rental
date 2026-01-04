
import React, { useState, useEffect } from 'react';
import { MapPin, Send } from 'lucide-react';
import { publicApi } from '../lib/api';

interface LocationData {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  hours: string | null;
  description: string | null;
  image_path: string | null;
  map_embed: string | null;
}

const Contact: React.FC = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await publicApi.locations.list();
        setLocations(response.data || []);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await publicApi.contact.send(formData);
      alert('感謝您的訊息！我們會盡快與您聯繫。');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error: any) {
      console.error('Failed to send contact form:', error);
      alert(error.response?.data?.message || '發送訊息時發生錯誤，請稍後再試。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700">
      <header className="py-20 px-6 bg-white text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2 text-sm">Contact Us</p>
          <h1 className="text-5xl md:text-6xl serif font-light mb-4">聯絡我們</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-base">有任何問題或建議，歡迎透過以下方式與我們聯繫，我們將竭誠為您服務。</p>
          <div className="mt-4 text-xs text-gray-400">首頁 &gt; 聯絡我們</div>
        </div>
      </header>

      {loading ? (
        <section className="container mx-auto px-6 max-w-6xl py-12">
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">載入中...</div>
          </div>
        </section>
      ) : (
        <section className="container mx-auto px-6 max-w-4xl py-12">
          <div className="space-y-12">
            {/* 聯絡資訊 */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold mb-6 serif">聯絡資訊</h3>
              <div className="space-y-6">
                {locations.length > 0 && locations[0].address && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#f0f9f6] text-teal-600 rounded-full flex items-center justify-center shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="font-bold mb-1">地址</p>
                      <p className="text-gray-600">{locations[0].address}</p>
                    </div>
                  </div>
                )}
                {locations.length > 0 && locations[0].hours && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#f0f3f9] text-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="font-bold mb-1">營業時間</p>
                      <p className="text-gray-600">{locations[0].hours}</p>
                    </div>
                  </div>
                )}
              </div>

              {locations.length > 0 && locations[0].description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div 
                    className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: locations[0].description }}
                  />
                </div>
              )}
            </div>

            {/* 聯絡表單 */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold mb-6 serif">填寫表單</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    placeholder="請輸入您的姓名"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    電子信箱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    聯絡電話
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    placeholder="請輸入您的電話號碼"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    訊息內容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="請輸入您的問題或建議..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-black text-white px-6 py-4 rounded-full font-bold hover:bg-teal-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    '送出中...'
                  ) : (
                    <>
                      <Send size={18} />
                      送出訊息
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Contact;
