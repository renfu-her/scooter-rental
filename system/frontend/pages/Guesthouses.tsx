
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Store, X } from 'lucide-react';
import SEO from '../components/SEO';
import { publicApi } from '../lib/api';

interface Guesthouse {
  id: number;
  name: string;
  description: string | null;
  short_description: string | null;
  image_path: string | null;
  link: string | null;
}

interface Store {
  id: number;
  name: string;
  notice?: string | null;
}

const Guesthouses: React.FC = () => {
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
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
        // 如果有很多店家，預設選擇第一個店家
        if (sortedStores.length > 0 && !selectedStore) {
          setSelectedStore(sortedStores[0]);
        }
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      }
    };

    fetchStores();
  }, []);

  // 當 selectedStore 改變時，獲取該商店的民宿推薦
  useEffect(() => {
    if (selectedStore) {
      const fetchGuesthouses = async () => {
        try {
          setLoading(true);
          const params = { store_id: selectedStore.id, active_only: true };
          const response = await publicApi.guesthouses.list(params);
          setGuesthouses(response.data || []);
        } catch (error) {
          console.error('Failed to fetch guesthouses:', error);
          setGuesthouses([]);
        } finally {
          setLoading(false);
        }
      };
      fetchGuesthouses();
    } else {
      setGuesthouses([]);
      setLoading(false);
    }
  }, [selectedStore]);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '民宿推薦 - 蘭光電動機車',
    description: '蘭光電動機車精選合作民宿，給您最完整的旅遊套裝體驗。',
    url: `${window.location.origin}/guesthouses`,
    mainEntity: guesthouses.map(gh => ({
      '@type': 'LodgingBusiness',
      name: gh.name,
      description: gh.short_description || gh.description,
      image: gh.image_path ? `${window.location.origin}/storage/${gh.image_path}` : undefined,
      url: gh.link || undefined
    }))
  };

  return (
    <div className="animate-in fade-in duration-700 bg-[#fcfcfc]">
      <SEO
        title="民宿推薦 - 蘭光電動機車"
        description="蘭光電動機車精選合作民宿，給您最完整的旅遊套裝體驗。"
        keywords="民宿推薦,小琉球民宿,合作民宿,小琉球住宿"
        url="/guesthouses"
        structuredData={structuredData}
      />
      <header className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 text-center">
        <p className="text-gray-400 tracking-[0.3em] uppercase mb-2 text-xs sm:text-sm">Partner Stays</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl serif font-light mb-3 sm:mb-4">民宿推薦</h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base px-4">蘭光電動機車 精選合作民宿，給您最完整的旅遊套裝體驗。</p>
        
        {/* 商店選擇器 */}
        {stores.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowStoreModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all border border-gray-200"
            >
              <Store size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{selectedStore?.name || '選擇商店'}</span>
            </button>
          </div>
        )}
      </header>

      {/* 商店選擇模態框 */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">選擇商店</h2>
              <button
                onClick={() => setShowStoreModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
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

      {loading ? (
        <section className="container mx-auto px-6 max-w-6xl pb-24">
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">載入中...</div>
          </div>
        </section>
      ) : guesthouses.length === 0 ? (
        <section className="container mx-auto px-6 max-w-6xl pb-24">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-gray-400 text-center">
              <p className="text-lg mb-2">目前沒有可用的民宿推薦</p>
              <p className="text-sm">我們正在積極尋找優質的合作夥伴，請稍後再來查看。</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="container mx-auto px-4 sm:px-6 max-w-6xl pb-12 sm:pb-16 md:pb-24">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {guesthouses.map((gh) => (
              <div key={gh.id} className="group bg-[#f0f4ff] rounded-[30px] sm:rounded-[35px] md:rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={gh.image_path ? `/storage/${gh.image_path}` : 'https://via.placeholder.com/600x450'}
                    alt={gh.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 serif">{gh.name}</h3>
                  <div className="mb-4 sm:mb-6 min-h-[1.5rem]">
                    {gh.short_description && (
                      <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{gh.short_description}</p>
                    )}
                  </div>
                  <Link
                    to={`/guesthouses/${gh.id}`}
                    className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-600 hover:text-black transition-colors"
                  >
                    VIEW DETAILS <ExternalLink size={12} className="sm:w-[14px] sm:h-[14px]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
