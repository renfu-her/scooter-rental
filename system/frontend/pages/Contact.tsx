
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, MessageCircle } from 'lucide-react';
import SEO from '../components/SEO';
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

const Contact: React.FC = () => {
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

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: '聯絡我們 - 蘭光電動機車',
    description: '有任何問題或建議，歡迎透過以下方式與我們聯繫，我們將竭誠為您服務。',
    url: `${window.location.origin}/contact`,
    mainEntity: {
      '@type': 'LocalBusiness',
      name: '蘭光電動機車',
      telephone: '+886-8-861-0000',
      email: 'info@languang.com'
    }
  };

  return (
    <div className="animate-in fade-in duration-700">
      <SEO
        title="聯絡我們 - 蘭光電動機車"
        description="有任何問題或建議，歡迎透過以下方式與我們聯繫，我們將竭誠為您服務。"
        keywords="聯絡我們,客服,蘭光電動機車,小琉球租車聯絡"
        url="/contact"
        structuredData={structuredData}
      />
      <header className="py-20 px-6 bg-[#f0f4ff] text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2 text-sm">Contact Us</p>
          <h1 className="text-5xl md:text-6xl serif font-light mb-4">聯絡我們</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-base">有任何問題或建議，歡迎透過以下方式與我們聯繫，我們將竭誠為您服務。</p>
          <div className="mt-4 text-xs text-gray-400">首頁 &gt; 聯絡我們</div>
        </div>
      </header>

      {loading ? (
        <section className="container mx-auto px-6 max-w-6xl py-12">
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">載入中...</div>
          </div>
        </section>
      ) : (
        <section className="container mx-auto px-6 max-w-4xl py-12">
          <div className="space-y-12">
            {/* 聯絡資訊 */}
            <div className="bg-white p-10 md:p-12 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-3xl font-bold mb-8 serif">聯絡資訊</h3>
              <div className="space-y-6">
                  <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <MapPin size={24} className="text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-700 mb-1">地址</p>
                    <p className="text-lg text-gray-600">
                      <a href="https://www.google.com.tw/maps/search/%E5%B1%8F%E6%9D%B1%E7%B8%A3%E7%90%89%E7%90%83%E9%84%89%E7%9B%B8%E5%9F%94%E8%B7%AF86%E4%B9%8B5" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors">屏東縣琉球鄉相埔路86之5</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <Phone size={24} className="text-teal-600" />
                </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-700 mb-1">電話</p>
                    <p className="text-lg text-gray-600">
                      <a href="tel:0911306011" className="hover:text-teal-600 transition-colors">0911306011</a>
                    </p>
                </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <MessageCircle size={24} className="text-teal-600" />
                    </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-700 mb-1">LINE ID</p>
                    <p className="text-lg text-gray-600">
                      <a href="https://line.me/R/ti/p/@623czmsm?oat_content=url&ts=01042332" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors">@623czmsm</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Contact;
