
import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import SEO from '../components/SEO';
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

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: '小琉球電動車租賃方案',
    description: '蘭光電動機車提供彈性且多樣化的租賃方案，適用於旅遊、通勤與短期移動等多種情境。我們依據不同使用需求，規劃完善的租期與車型選擇，讓顧客能以安心、便利的方式完成每一次出行。',
    url: `${window.location.origin}/rental`,
    offers: plans.map(plan => ({
      '@type': 'Offer',
      name: plan.model,
      price: plan.price,
      priceCurrency: 'TWD',
      availability: 'https://schema.org/InStock'
    }))
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700">
      <SEO
        title="租車方案 - 蘭光電動機車"
        description="蘭光電動機車提供彈性且多樣化的租賃方案，適用於旅遊、通勤與短期移動等多種情境。我們依據不同使用需求，規劃完善的租期與車型選擇，讓顧客能以安心、便利的方式完成每一次出行。"
        keywords="租車方案,小琉球租車,電動車租賃,機車租賃方案,小琉球旅遊"
        url="/rental"
        structuredData={structuredData}
      />
      <header className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-[#f0f4ff] text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2 text-xs sm:text-sm">Rental Plans</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl serif font-light mb-3 sm:mb-4">租車方案</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base mb-4 px-4">蘭光電動機車提供彈性且多樣化的租賃方案，適用於旅遊、通勤與短期移動等多種情境。我們依據不同使用需求，規劃完善的租期與車型選擇，讓顧客能以安心、便利的方式完成每一次出行。</p>
          <div className="mt-3 sm:mt-4 text-xs text-gray-400 mb-6 sm:mb-8">首頁 &gt; 租車方案</div>
          
          <div className="max-w-2xl mx-auto text-center px-4">
            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">隨車附安全帽，並提供衛生帽套供使用</p>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-left">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">*注意事項：</p>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                逾時15分以一小時計，每小時以$50/小時計算；逾時6小時以1日計算；連續與國定假日每小時以$100/小時計算（上限$500）
              </p>
            </div>
          </div>
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
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-gray-400 text-center">
              <p className="text-lg mb-2">目前沒有可用的租車方案</p>
              <p className="text-sm">我們正在準備更多優質的租車選擇，請稍後再來查看。</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto bg-white rounded-[30px] sm:rounded-[35px] md:rounded-[40px] p-6 sm:p-8 md:p-12 shadow-sm">
            <div className="grid md:grid-cols-2 gap-12 sm:gap-16 md:gap-24">
            {plans.map((plan, index) => {
              return (
                <div key={plan.id} className="flex flex-col items-center">
                  <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] mb-8 sm:mb-12">
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
                    <div className="absolute bottom-[-12px] sm:bottom-[-15px] left-1/2 -translate-x-1/2 w-32 sm:w-36 md:w-40 h-24 sm:h-28 md:h-32 rounded-[40px] sm:rounded-[45px] md:rounded-[50px] bg-[#f0f4ff] shadow-xl flex flex-col items-center justify-center p-3 sm:p-4 text-center border-4 border-[#f0f4ff]">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-800 font-sans">{plan.model || '未命名方案'}</span>
                      <span className="text-base sm:text-lg md:text-xl font-bold font-sans text-black">${Math.floor(plan.price || 0)} / 24H</span>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default RentalPlans;
