
import React from 'react';
import { GUESTHOUSES } from '../constants';
import { ExternalLink } from 'lucide-react';

const Guesthouses: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-700 bg-[#fcfcfc]">
      <header className="py-24 px-6 text-center">
        <p className="text-gray-400 tracking-[0.3em] uppercase mb-2">Partner Stays</p>
        <h1 className="text-5xl md:text-7xl serif font-light mb-4">民宿推薦</h1>
        <p className="text-gray-500 max-w-xl mx-auto">蘭光租賃中心 精選合作民宿，給您最完整的旅遊套裝體驗。</p>
      </header>

      <section className="container mx-auto px-6 max-w-6xl pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {GUESTHOUSES.map((gh, idx) => (
            <div key={idx} className="group bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100">
               <div className="aspect-[4/3] overflow-hidden">
                  <img src={gh.image} alt={gh.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="p-8">
                  <h3 className="text-2xl font-bold mb-3 serif">{gh.name}</h3>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">{gh.description}</p>
                  <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 hover:text-black transition-colors">
                     VIEW DETAILS <ExternalLink size={14} />
                  </button>
               </div>
            </div>
          ))}
          {/* Add more placeholders to fill grid */}
          {[1,2,3,4].map(i => (
            <div key={i} className="group bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100">
               <div className="aspect-[4/3] overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img src={`https://picsum.photos/seed/stay${i}/600/450`} alt="Partner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="p-8">
                  <h3 className="text-2xl font-bold mb-3 serif">嚴選特約民宿 0{i+2}</h3>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">提供 蘭光 租車套裝優惠，詳情請洽各民宿窗口或本公司官網客服。</p>
                  <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 hover:text-black transition-colors">
                     VIEW DETAILS <ExternalLink size={14} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 bg-black text-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full opacity-20 -z-10">
             <img src="https://picsum.photos/seed/night/1920/600" className="w-full h-full object-cover" alt="Night sea" />
         </div>
         <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-4xl serif mb-6 italic">Are you a guesthouse owner?</h2>
            <p className="text-gray-300 mb-10 leading-relaxed">
               歡迎加入 蘭光 合作夥伴！我們提供穩定的車況、即時的售後服務以及精美的專屬網頁呈現，
               共同為旅人打造最高品質的小琉球回憶。
            </p>
            <button className="bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-teal-500 hover:text-white transition-all">
               聯繫業務洽談
            </button>
         </div>
      </section>
    </div>
  );
};

export default Guesthouses;
