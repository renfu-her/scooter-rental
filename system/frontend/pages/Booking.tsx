
import React, { useState } from 'react';
import { SCOOTER_PLANS } from '../constants';

const Booking: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    plan: 'viva-mix',
    date: '',
    days: '1',
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`預約已提交！\n姓名：${formData.name}\n預約車款：${formData.plan}`);
  };

  return (
    <div className="animate-in fade-in duration-700 pb-24">
      <header className="py-20 px-6 bg-black text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl serif mb-4">RESERVATION</h1>
          <h2 className="text-xl font-light opacity-80">線上預約</h2>
        </div>
        <div className="absolute inset-0 opacity-30">
           <img src="https://picsum.photos/seed/beach/1920/400" className="w-full h-full object-cover" alt="Beach" />
        </div>
      </header>

      <div className="container mx-auto px-6 max-w-4xl -mt-10 relative z-20">
        <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">姓名</label>
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
                <label className="block text-sm font-bold text-gray-700 mb-2">聯絡電話</label>
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
                <label className="block text-sm font-bold text-gray-700 mb-2">選擇車款</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all"
                  value={formData.plan}
                  onChange={e => setFormData({...formData, plan: e.target.value})}
                >
                  {SCOOTER_PLANS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">預約日期</label>
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

            <div className="md:col-span-2 pt-6">
              <button 
                type="submit" 
                className="w-full bg-black text-white py-5 rounded-full font-bold text-lg hover:bg-teal-700 transition-all shadow-xl"
              >
                確認預約
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
