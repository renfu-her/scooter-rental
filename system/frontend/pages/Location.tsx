
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';
import { publicApi } from '../lib/api';

interface LocationData {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  hours: string | null;
  description: string | null;
  image_path: string | null;
  map_embed: string | null;
}

const Location: React.FC = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await publicApi.locations.list();
        setLocations(response.data || []);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return (
    <div className="animate-in fade-in duration-700">
      <header className="py-20 px-6 bg-white text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2 text-sm">Location & Contact</p>
          <h1 className="text-5xl md:text-6xl serif font-light mb-4">門市據點</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-base">蘭光租賃中心位於小琉球交通便利的位置，歡迎您前來門市參觀選車，我們提供最專業的服務與諮詢。</p>
          <div className="mt-4 text-xs text-gray-400">首頁 &gt; 交通資訊</div>
        </div>
      </header>

      {loading ? (
        <section className="container mx-auto px-6 max-w-6xl py-12">
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">載入中...</div>
          </div>
        </section>
      ) : locations.length === 0 ? (
        <section className="container mx-auto px-6 max-w-6xl py-12">
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">目前沒有門市據點</div>
          </div>
        </section>
      ) : (
        <section className="container mx-auto px-6 max-w-6xl py-12">
          <div className="space-y-16">
            {locations.map((location) => (
              <div key={location.id} className="grid md:grid-cols-2 gap-12 items-start">
                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                    <h3 className="text-2xl font-bold mb-6 serif">{location.name}</h3>
                    <div className="space-y-6">
                      {location.address && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-[#f0f9f6] text-teal-600 rounded-full flex items-center justify-center shrink-0">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <p className="font-bold">地址</p>
                            <p className="text-gray-600">{location.address}</p>
                          </div>
                        </div>
                      )}
                      {location.phone && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-[#fff4f9] text-pink-600 rounded-full flex items-center justify-center shrink-0">
                            <Phone size={20} />
                          </div>
                          <div>
                            <p className="font-bold">電話</p>
                            <p className="text-gray-600">{location.phone}</p>
                          </div>
                        </div>
                      )}
                      {location.hours && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-[#f0f3f9] text-blue-600 rounded-full flex items-center justify-center shrink-0">
                            <Clock size={20} />
                          </div>
                          <div>
                            <p className="font-bold">營業時間</p>
                            <p className="text-gray-600">{location.hours}</p>
                          </div>
                        </div>
                      )}
                      {location.description && (
                        <div className="mt-4">
                          <div 
                            className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: location.description }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {location.image_path && (
                    <div className="rounded-[40px] overflow-hidden shadow-2xl aspect-video relative">
                      <img
                        src={`/storage/${location.image_path}`}
                        alt={location.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="h-full min-h-[500px] bg-gray-200 rounded-[50px] overflow-hidden relative shadow-inner">
                  {location.map_embed ? (
                    <div 
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: location.map_embed }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      地圖未設定
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white max-w-[200px]">
                    <p className="text-xs font-bold mb-1">歡迎光臨</p>
                    <p className="text-[10px] text-gray-500">位於市中心熱門地段，預約完成後歡迎直接前往門市領車。</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Location;
