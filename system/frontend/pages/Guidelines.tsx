
import React, { useState, useEffect } from 'react';
import { Plus, Minus, ExternalLink, X, Store, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { publicApi } from '../lib/api';

interface Guideline {
  id: number;
  category: string;
  question: string;
  answer: string;
  store_id?: number | null;
  store?: { id: number; name: string; notice?: string | null } | null;
}

interface Store {
  id: number;
  name: string;
  notice?: string | null;
}

interface Guesthouse {
  id: number;
  name: string;
  description: string | null;
  short_description: string | null;
  image_path: string | null;
  images: string[] | null;
  link: string | null;
}

interface ShuttleImage {
  id: number;
  image_path: string;
  sort_order: number;
}

const Guidelines: React.FC = () => {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
  const [shuttleImages, setShuttleImages] = useState<ShuttleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState('所有問題');

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

    const fetchGuidelines = async () => {
      try {
        const params = selectedStore ? { store_id: selectedStore.id } : undefined;
        const response = await publicApi.guidelines.list(params);
        setGuidelines(response.data || []);
      } catch (error) {
        console.error('Failed to fetch guidelines:', error);
        setGuidelines([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchGuesthouses = async () => {
      try {
        const params = selectedStore ? { store_id: selectedStore.id, active_only: true } : { active_only: true };
        const response = await publicApi.guesthouses.list(params);
        setGuesthouses(response.data || []);
      } catch (error) {
        console.error('Failed to fetch guesthouses:', error);
        setGuesthouses([]);
      }
    };

    const fetchShuttleImages = async () => {
      try {
        const params = selectedStore ? { store_id: selectedStore.id } : undefined;
        const response = await publicApi.shuttleImages.list(params);
        setShuttleImages(response.data || []);
      } catch (error) {
        console.error('Failed to fetch shuttle images:', error);
        setShuttleImages([]);
      }
    };

    fetchStores();
    if (selectedStore) {
      fetchGuidelines();
      fetchGuesthouses();
      fetchShuttleImages();
    } else {
      setLoading(false);
    }
  }, [selectedStore]);

  const categories = Array.from(new Set(guidelines.map(g => g.category)));
  const allCategories = ['所有問題', ...categories];

  const filteredFaqs = filter === '所有問題' 
    ? guidelines 
    : guidelines.filter(f => f.category === filter);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: '租車須知 - 蘭光電動機車',
    description: '蘭光電動機車租車須知，包含常見問題、注意事項、專車接送服務等資訊，幫助您了解租車相關規定。',
    url: `${window.location.origin}/guidelines`,
    mainEntity: guidelines.map(g => ({
      '@type': 'Question',
      name: g.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: g.answer
      }
    }))
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-700">
      <SEO
        title="租車須知 - 蘭光電動機車"
        description="蘭光電動機車租車須知，包含常見問題、注意事項、專車接送服務等資訊，幫助您了解租車相關規定。"
        keywords="租車須知,小琉球租車,電動車租賃,常見問題,租車注意事項"
        url="/guidelines"
        structuredData={structuredData}
      />
      <header className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-[#f0f4ff] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl serif mb-2">租賃須知</h1>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light serif tracking-tighter mb-3 sm:mb-4">Q&A</h2>
          <div className="mt-3 sm:mt-4 text-xs text-gray-400 uppercase tracking-widest mb-6 sm:mb-8">首頁 &gt; 租賃須知</div>
          
          {/* 店家選擇按鈕 */}
          {stores.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <button
                onClick={() => setShowStoreModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all text-gray-800 font-medium"
              >
                <Store size={18} />
                <span>{selectedStore ? selectedStore.name : '選擇店家'}</span>
                <ChevronDown size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-8 sm:py-12">
          <div className="flex justify-center items-center py-8 sm:py-12">
            <div className="text-gray-400">載入中...</div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-8 sm:py-12">
          <div className="bg-white rounded-[30px] sm:rounded-[35px] md:rounded-[40px] p-6 sm:p-8 md:p-12 shadow-sm">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 sm:px-6 sm:py-2 rounded-lg text-xs sm:text-sm transition-all ${
                  filter === cat 
                  ? 'bg-[#1a1a1a] text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq, idx) => (
              <div key={faq.id} className="border-b border-gray-100 pb-4">
                <button
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left py-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-black text-white rounded-md flex items-center justify-center text-xs font-bold">Q</div>
                    <span className="font-medium text-gray-800">{faq.question}</span>
                  </div>
                  <div className="bg-black text-white p-1 rounded transition-transform">
                    {openIndex === idx ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </button>
                {openIndex === idx && (
                  <div className="pl-10 sm:pl-12 pr-4 sm:pr-6 pb-3 sm:pb-4 text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg whitespace-pre-line animate-in fade-in slide-in-from-top-1 duration-300">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-gray-400 text-center">
                  <p className="text-lg mb-2">目前尚無相關問題</p>
                  <p className="text-sm">我們正在整理常見問題，請稍後再來查看，或透過聯絡我們頁面直接詢問。</p>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* 服務內容區塊 */}
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-8 sm:py-12 border-t border-gray-200 mt-8 sm:mt-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-center">服務內容</h2>
        
        <div className="space-y-6 sm:space-y-8">
          {/* 民宿推薦 */}
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">民宿推薦</h3>
            {guesthouses.length > 0 ? (
              <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                {guesthouses.map((gh) => (
                  <Link
                    key={gh.id}
                    to={`/guesthouses/${gh.id}`}
                    className="block bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* 左側圖片 */}
                      {gh.image_path && (
                        <div className="md:w-1/2 aspect-[4/3] md:aspect-auto overflow-hidden">
                          <img
                            src={`/storage/${gh.image_path}`}
                            alt={gh.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {/* 右側文字 */}
                      <div className="md:w-1/2 p-4 sm:p-6 md:p-8 flex flex-col justify-between">
                        <div>
                          <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">{gh.name}</h4>
                          {gh.short_description && (
                            <p className="text-gray-600 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">{gh.short_description}</p>
                          )}
                        </div>
                        <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-600 hover:text-black transition-colors self-start">
                          VIEW DETAILS <ExternalLink size={12} className="sm:w-[14px] sm:h-[14px]" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs sm:text-sm mt-2">目前尚無推薦民宿</p>
            )}
          </div>

          <div className="border-t border-gray-300 my-6 sm:my-8"></div>

          {/* 行李配送 */}
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">行李配送</h3>
            <div className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
              <p>輕鬆旅遊從蘭光電動機車開始，行李內的快樂回憶，由我們幫您守護</p>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6 sm:my-8"></div>

          {/* 專車接送 */}
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">專車接送</h3>
            <div className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
              <p>一趟美好旅程，從涼爽接駁開始，不畏風雨只為了提供尊貴的服務</p>
            </div>
            {shuttleImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                {shuttleImages.map((image) => (
                  <div key={image.id} className="rounded-lg overflow-hidden">
                    <img
                      src={`/storage/${image.image_path}`}
                      alt="專車接送"
                      className="w-full h-[300px] sm:h-[350px] md:h-[400px] object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Decorative Wave Bottom */}
      <div className="h-40 bg-[#f0f4ff] relative overflow-hidden">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#fcfcfc" fillOpacity="1" d="M0,224L80,213.3C160,203,320,181,480,181.3C640,181,800,203,960,192C1120,181,1280,139,1360,117.3L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
      </div>

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

export default Guidelines;
