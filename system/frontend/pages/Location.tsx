
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
      <header className="py-20 px-6 bg-[#f0f4ff] text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2 text-sm">Location & Contact</p>
          <h1 className="text-5xl md:text-6xl serif font-light mb-4">門市據點</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-base">蘭光電動機車位於小琉球交通便利的位置，歡迎您前來門市參觀選車，我們提供最專業的服務與諮詢。</p>
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
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-gray-400 text-center">
              <p className="text-lg mb-2">目前沒有門市據點資訊</p>
              <p className="text-sm">我們正在整理相關資訊，請稍後再來查看，或透過其他方式與我們聯繫。</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="container mx-auto px-6 max-w-6xl py-12">
          <div className="space-y-16">
            {locations.map((location) => (
              <div key={location.id} className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                {/* 上方：交通位置和地址資訊 */}
                <div className="p-8">
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

                {/* 分隔線 */}
                <div className="border-t border-gray-200"></div>

                {/* 下方：Google 地圖嵌入 */}
                <div className="w-full h-[500px] md:h-[600px] bg-gray-200 overflow-hidden">
                  {location.map_embed ? (
                    <div 
                      className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                      dangerouslySetInnerHTML={{ __html: location.map_embed }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      地圖未設定
                    </div>
                  )}
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
