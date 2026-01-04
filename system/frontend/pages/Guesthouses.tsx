
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { publicApi } from '../lib/api';

interface Guesthouse {
  id: number;
  name: string;
  description: string | null;
  short_description: string | null;
  image_path: string | null;
  link: string | null;
}

const Guesthouses: React.FC = () => {
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuesthouses = async () => {
      try {
        const response = await publicApi.guesthouses.list();
        setGuesthouses(response.data || []);
      } catch (error) {
        console.error('Failed to fetch guesthouses:', error);
        setGuesthouses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGuesthouses();
  }, []);

  return (
    <div className="animate-in fade-in duration-700 bg-[#fcfcfc]">
      <header className="py-24 px-6 text-center">
        <p className="text-gray-400 tracking-[0.3em] uppercase mb-2">Partner Stays</p>
        <h1 className="text-5xl md:text-7xl serif font-light mb-4">民宿推薦</h1>
        <p className="text-gray-500 max-w-xl mx-auto">蘭光租賃中心 精選合作民宿，給您最完整的旅遊套裝體驗。</p>
      </header>

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
        <section className="container mx-auto px-6 max-w-6xl pb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guesthouses.map((gh) => (
              <div key={gh.id} className="group bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={gh.image_path ? `/storage/${gh.image_path}` : 'https://via.placeholder.com/600x450'}
                    alt={gh.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-3 serif">{gh.name}</h3>
                  <div className="mb-6 min-h-[1.5rem]">
                    {gh.short_description && (
                      <p className="text-gray-500 text-sm leading-relaxed">{gh.short_description}</p>
                    )}
                  </div>
                  <Link
                    to={`/guesthouses/${gh.id}`}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 hover:text-black transition-colors"
                  >
                    VIEW DETAILS <ExternalLink size={14} />
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
