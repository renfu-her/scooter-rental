
import React from 'react';
import { SCOOTER_PLANS } from '../constants';
import { ChevronDown } from 'lucide-react';

const RentalPlans: React.FC = () => {
  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700">
      <header className="py-20 px-6 bg-white text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2">Rental Plans</p>
          <h1 className="text-5xl md:text-6xl serif font-light mb-4">租車方案</h1>
          <p className="text-gray-500 max-w-xl mx-auto">蘭光租賃中心提供多種電動車租賃方案，滿足您不同的旅遊需求，讓您輕鬆探索小琉球的美景。</p>
          <div className="mt-4 text-xs text-gray-400">首頁 &gt; 租車方案</div>
        </div>
      </header>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 md:gap-24">
          {SCOOTER_PLANS.map((plan) => (
            <div key={plan.id} className="flex flex-col items-center">
              <div className="relative w-full aspect-square mb-12">
                 <div className="absolute inset-0 bg-gray-50 rounded-[100px] -z-10 transform -rotate-3"></div>
                 <div className="w-full h-full rounded-[100px] overflow-hidden shadow-2xl">
                    <img src={plan.image} alt={plan.name} className="w-full h-full object-cover" />
                 </div>
                 
                 {/* Price Badge */}
                 <div className={`absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-48 h-48 rounded-full ${plan.colorClass} shadow-xl flex flex-col items-center justify-center p-6 text-center border-4 border-white`}>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-800">{plan.name}</span>
                    <span className="text-3xl font-bold serif text-black">${plan.price}</span>
                    <span className="text-[10px] bg-black text-white px-3 py-1 rounded-full mt-2 font-bold">{plan.description}</span>
                 </div>
              </div>

              <div className="mt-12 text-center max-w-sm">
                 <ul className="space-y-2 text-gray-600 mb-8 text-sm">
                    {plan.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                 </ul>
                 <button className="w-12 h-12 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all mx-auto">
                    <ChevronDown size={20} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 bg-white border-t border-gray-100">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-gray-400 uppercase tracking-widest text-xs mb-4">Premium Service</p>
            <h3 className="text-3xl font-bold mb-8 serif">提供顧客尊榮級服務</h3>
            <p className="text-gray-500 leading-relaxed mb-12">
               極致奢華租車環境，安靜又舒適的騎乘體驗，寬敞舒適簡約帶點文青風格、唯美的網美牆、貴賓休憩區，還有像畫廊的聽雨軒...
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="aspect-square rounded-[30px] bg-gray-100 overflow-hidden">
                    <img src={`https://picsum.photos/seed/service${i}/400/400`} alt="Service" className="w-full h-full object-cover" />
                 </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
};

export default RentalPlans;
