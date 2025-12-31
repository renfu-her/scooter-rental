
import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Location: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-700">
       <header className="py-20 px-6 bg-white text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2">Location & Contact</p>
          <h1 className="text-5xl md:text-6xl serif font-light mb-4">交通位置</h1>
          <div className="mt-4 text-xs text-gray-400">首頁 &gt; 交通資訊</div>
        </div>
      </header>

      <section className="container mx-auto px-6 max-w-6xl py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start">
           <div className="space-y-8">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                 <h3 className="text-2xl font-bold mb-6 serif">門市資訊</h3>
                 <div className="space-y-6">
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 bg-[#f0f9f6] text-teal-600 rounded-full flex items-center justify-center shrink-0">
                          <MapPin size={20} />
                       </div>
                       <div>
                          <p className="font-bold">地址</p>
                          <p className="text-gray-600">臺北市中正路 123 號</p>
                          <p className="text-xs text-gray-400 mt-1">（主要服務中心，提供優質租賃體驗）</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 bg-[#fff4f9] text-pink-600 rounded-full flex items-center justify-center shrink-0">
                          <Phone size={20} />
                       </div>
                       <div>
                          <p className="font-bold">電話</p>
                          <p className="text-gray-600">02-2345-5555</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 bg-[#f0f3f9] text-blue-600 rounded-full flex items-center justify-center shrink-0">
                          <Clock size={20} />
                       </div>
                       <div>
                          <p className="font-bold">營運時間</p>
                          <p className="text-gray-600">每日 08:00 - 18:00</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="rounded-[40px] overflow-hidden shadow-2xl aspect-video relative">
                 <img src="https://picsum.photos/seed/shopfront/800/600" alt="Shop Front" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                    <p className="text-white font-bold text-lg">蘭光租賃中心 門市實景</p>
                 </div>
              </div>
           </div>

           <div className="h-full min-h-[500px] bg-gray-200 rounded-[50px] overflow-hidden relative shadow-inner">
              {/* Google Maps Embed simulation */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.703644917524!2d121.5174034!3d25.0477622!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442a97260027771%3A0x6e9c6a1e360e2518!2z6Ie65YyX6LuK56uZ!5e0!3m2!1szh-TW!2stw!4v1650000000000!5m2!1szh-TW!2stw" 
                className="w-full h-full border-0 grayscale opacity-80" 
                allowFullScreen={true} 
                loading="lazy"
              ></iframe>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white max-w-[200px]">
                 <p className="text-xs font-bold mb-1">歡迎光臨</p>
                 <p className="text-[10px] text-gray-500">位於市中心熱門地段，預約完成後歡迎直接前往門市領車。</p>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Location;
