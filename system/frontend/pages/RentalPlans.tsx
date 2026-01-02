
import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { publicApi } from '../lib/api';

interface RentalPlan {
  id: number;
  model: string;
  price: number;
  image_path: string | null;
}

const RentalPlans: React.FC = () => {
  const [plans, setPlans] = useState<RentalPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await publicApi.rentalPlans.list();
        setPlans(response.data || []);
      } catch (error) {
        console.error('Failed to fetch rental plans:', error);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700">
      <header className="py-20 px-6 bg-white text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2 text-sm">Rental Plans</p>
          <h1 className="text-5xl md:text-6xl serif font-light mb-4">租車方案</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-base">蘭光租賃中心提供多種電動車租賃方案，滿足您不同的旅遊需求，讓您輕鬆探索小琉球的美景。</p>
          <div className="mt-4 text-xs text-gray-400">首頁 &gt; 租車方案</div>
        </div>
      </header>

      {loading ? (
        <section className="py-20 px-6">
          <div className="flex justify-center items-center">
            <div className="text-gray-400">載入中...</div>
          </div>
        </section>
      ) : plans.length === 0 ? (
        <section className="py-20 px-6">
          <div className="flex justify-center items-center">
            <div className="text-gray-400">目前沒有可用的租車方案</div>
          </div>
        </section>
      ) : (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 md:gap-24">
            {plans.map((plan, index) => {
              // 左邊（奇數索引）永遠高過右邊，左邊高度 600px，右邊高度較低
              const isLeft = index % 2 === 0;
              const heightClass = isLeft ? 'h-[600px]' : 'h-[500px]';
              const translateClass = isLeft ? 'md:-translate-y-16' : 'md:translate-y-16';
              
              return (
                <div key={plan.id} className={`flex flex-col items-center ${translateClass} transition-transform duration-300`}>
                  <div className={`relative w-full ${heightClass} mb-12`}>
                    <div className="absolute inset-0 bg-gray-50 rounded-[100px] -z-10 transform -rotate-3"></div>
                    <div className="w-full h-full rounded-[100px] overflow-hidden shadow-2xl">
                      {plan.image_path ? (
                        <img
                          src={`/storage/${plan.image_path}`}
                          alt={plan.model || `租車方案 ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // 如果圖片載入失敗，使用 placeholder
                            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/rental-${plan.id}/800/800`;
                          }}
                        />
                      ) : (
                        <img
                          src={`https://picsum.photos/seed/rental-${plan.id}/800/800`}
                          alt={plan.model || `租車方案 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    {/* Price Badge */}
                    <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-white shadow-xl flex flex-col items-center justify-center p-6 text-center border-4 border-white">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-800">{plan.model || '未命名方案'}</span>
                      <span className="text-3xl font-bold serif text-black">${plan.price || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
