
import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Store } from 'lucide-react';
import SEO from '../components/SEO';
import { publicApi } from '../lib/api';

interface RentalPlan {
  id: number;
  model: string;
  price: number;
  image_path: string | null;
  store_id?: number | null;
  store?: { id: number; name: string; notice?: string | null } | null;
}

interface Store {
  id: number;
  name: string;
  notice?: string | null;
}

const RentalPlans: React.FC = () => {
  const [plans, setPlans] = useState<RentalPlan[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // 獲取商店列表
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await publicApi.stores.list();
        const sortedStores = (response.data || []).sort((a: Store, b: Store) => a.id - b.id);
        setStores(sortedStores);
        
        // 從 localStorage 讀取保存的 store_id
        const savedStoreId = localStorage.getItem('selectedStoreId');
        if (savedStoreId && sortedStores.length > 0) {
          const savedStore = sortedStores.find(store => store.id === parseInt(savedStoreId));
          if (savedStore) {
            setSelectedStore(savedStore);
            return;
          }
        }
        
        // 如果沒有保存的店家，預設選擇第一個店家
        if (sortedStores.length > 0 && !selectedStore) {
          setSelectedStore(sortedStores[0]);
        }
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      }
    };

    fetchStores();
  }, []);

  // 當 selectedStore 改變時，獲取該商店的租車方案
  useEffect(() => {
    if (selectedStore) {
      const fetchPlans = async () => {
        try {
          setLoading(true);
          const params = { store_id: selectedStore.id };
          const response = await publicApi.rentalPlans.list(params);
          setPlans(response.data || []);
        } catch (error) {
          console.error('Failed to fetch rental plans:', error);
          setPlans([]);
        } finally {
          setLoading(false);
        }
      };
      fetchPlans();
    } else {
      setPlans([]);
      setLoading(false);
    }
  }, [selectedStore]);

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
      <header className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 bg-[#f0f4ff] text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2 text-xs sm:text-sm">Rental Plans</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl serif font-light mb-3 sm:mb-4">租車方案</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base mb-4 px-4">蘭光電動機車提供彈性且多樣化的租賃方案，適用於旅遊、通勤與短期移動等多種情境。我們依據不同使用需求，規劃完善的租期與車型選擇，讓顧客能以安心、便利的方式完成每一次出行。</p>
          <div className="mt-3 sm:mt-4 text-xs text-gray-400 mb-4 sm:mb-5">首頁 &gt; 租車方案</div>
          
          {/* 店家選擇按鈕 */}
          {stores.length > 0 && (
            <div className="mb-4 sm:mb-5">
              <button
                onClick={() => setShowStoreModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white rounded-full shadow-md hover:shadow-lg transition-all font-medium"
              >
                <Store size={20} className="text-[#0D9488]" />
                <span className="text-[#0D9488] text-base sm:text-lg">{selectedStore ? selectedStore.name : '選擇店家'}</span>
                <ChevronDown size={20} className="text-[#0D9488]" />
              </button>
            </div>
          )}
          
          <div className="max-w-2xl mx-auto text-center px-4">
            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">隨車附安全帽，並提供衛生帽套供使用</p>
            {selectedStore?.notice && (
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-left">
                <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">*注意事項：</p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {selectedStore.notice}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <section className="py-8 sm:py-10 px-6">
          <div className="flex justify-center items-center">
            <div className="text-gray-400">載入中...</div>
          </div>
        </section>
      ) : plans.length === 0 ? (
        <section className="py-8 sm:py-10 px-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 text-center">
              <p className="text-lg mb-2">目前沒有可用的租車方案</p>
              <p className="text-sm">我們正在準備更多優質的租車選擇，請稍後再來查看。</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-6 sm:py-8 md:py-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto bg-[#f0f4ff] rounded-[30px] sm:rounded-[35px] md:rounded-[40px] p-6 sm:p-8 md:p-12 shadow-sm">
            <div className="grid md:grid-cols-2 gap-12 sm:gap-16 md:gap-24">
            {plans.map((plan, index) => {
              return (
                <div key={plan.id} className="flex flex-col items-center">
                  <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] mb-8 sm:mb-12">
                    <div className="absolute inset-0 bg-gray-50 rounded-[100px] -z-10 transform -rotate-3"></div>
                    <div className="w-full h-full rounded-[100px] overflow-hidden shadow-2xl border-4 border-white bg-white">
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

      {/* 店家選擇視窗 */}
      {showStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">選擇店家</h2>
              <button
                onClick={() => setShowStoreModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {stores.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>目前沒有店家</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setSelectedStore(store);
                        // 保存 store_id 到 localStorage
                        localStorage.setItem('selectedStoreId', store.id.toString());
                        setShowStoreModal(false);
                        setLoading(true);
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedStore?.id === store.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedStore?.id === store.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            <Store size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{store.name}</p>
                            {store.notice && (
                              <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{store.notice}</p>
                            )}
                          </div>
                        </div>
                        {selectedStore?.id === store.id && (
                          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalPlans;
