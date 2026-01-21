
import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { publicApi } from '../lib/api';

interface EnvironmentImage {
  id: number;
  image_path: string;
  sort_order: number;
}

const About: React.FC = () => {
  const [environmentImages, setEnvironmentImages] = useState<EnvironmentImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnvironmentImages();
  }, []);

  const fetchEnvironmentImages = async () => {
    try {
      const response = await publicApi.environmentImages.list();
      const images = (response.data || []).sort((a: EnvironmentImage, b: EnvironmentImage) => 
        a.sort_order - b.sort_order
      );
      setEnvironmentImages(images);
    } catch (error) {
      console.error('Failed to fetch environment images:', error);
      setEnvironmentImages([]);
    } finally {
      setLoading(false);
    }
  };
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: '關於我們 - 蘭光電動機車',
    description: '蘭光電動機車致力於為每一位旅客提供高品質的電動機車租賃服務，讓每一次出行，都能以更環保、更舒適且更安心的方式完成。',
    url: `${window.location.origin}/about`,
    mainEntity: {
      '@type': 'LocalBusiness',
      name: '蘭光電動機車',
      description: '小琉球電動車租賃服務'
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-700">
      <SEO
        title="關於我們 - 蘭光電動機車"
        description="蘭光電動機車致力於為每一位旅客提供高品質的電動機車租賃服務，讓每一次出行，都能以更環保、更舒適且更安心的方式完成。"
        keywords="蘭光電動機車,關於我們,小琉球租車,電動車租賃,環保旅遊"
        url="/about"
        structuredData={structuredData}
      />
      {/* Header Section */}
      <header className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-[#f0f4ff] text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2 text-xs sm:text-sm">About Us</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl serif font-light mb-3 sm:mb-4">關於我們</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base px-4">蘭光電動機車致力於為每一位旅客提供高品質的電動機車租賃服務，讓每一次出行，都能以更環保、更舒適且更安心的方式完成。</p>
          <div className="mt-3 sm:mt-4 text-xs text-gray-400">首頁 &gt; 關於我們</div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold serif mb-4 sm:mb-6 text-center">我們的使命</h2>
            <p className="text-gray-600 leading-relaxed text-base sm:text-lg mb-4 sm:mb-6 text-left">
              蘭光電動機車致力於為每一位旅客提供高品質的電動機車租賃服務，讓每一次出行，都能以更環保、更舒適且更安心的方式完成。
            </p>
            <p className="text-gray-600 leading-relaxed text-base sm:text-lg text-left">
              我們相信，交通不只是移動的工具，而是旅程體驗中不可或缺的一環。因此，我們不僅重視車輛品質，更專注於服務流程與細節，希望讓每一位顧客，都能自在地享受旅程的每一刻。
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-xl font-bold mb-2">環保理念</h3>
              <p className="text-gray-600 text-sm">
                採用電動車，減少碳排放，為地球盡一份心力
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold mb-2">優質服務</h3>
              <p className="text-gray-600 text-sm">
                專業團隊提供貼心服務，讓您的旅程更加順暢
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold mb-2">安全第一</h3>
              <p className="text-gray-600 text-sm">
                定期保養檢查，確保每輛車都在最佳狀態
              </p>
            </div>
          </div>

          {/* Story Section */}
          <div className="bg-white rounded-[40px] sm:rounded-[45px] md:rounded-[50px] p-6 sm:p-8 md:p-12 shadow-lg mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold serif mb-4 sm:mb-6">我們的 story</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                蘭光電動機車租賃開立於 2025 年7月，源自我們對旅遊品質與移動體驗的重視。
              </p>
              <p>
                在一次次的旅途中，我們深刻體會到，一趟好的行程，來自於安全、便利且值得信賴的交通選擇。因此，我們選擇以電動機車作為主要租賃車輛，希望在兼顧環保與舒適的同時，為旅客帶來更純粹的騎乘體驗。
              </p>
              <p>
                電動機車不僅安靜、低碳，也能讓騎行過程更加輕鬆自在，無論是短程移動、日常代步，或旅途中自由探索，都能感受到流暢且安心的移動感受。
              </p>
              <p>
                多年來，我們持續優化服務品質，從車輛選擇、定期保養、安全檢查，到現場服務與顧客體驗的每一個細節，始終以高標準自我要求。
              </p>
              <p>
                我們相信，唯有用心經營與專業服務，才能讓每一次出行，都成為值得信賴且令人滿意的體驗。
              </p>
            </div>
          </div>

          {/* Team/Values Section */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-gray-50 rounded-[40px] p-8">
              <h3 className="text-2xl font-bold serif mb-4">核心價值</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>以顧客為中心，提供最優質的服務</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>堅持環保理念，推廣綠色交通</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>持續創新，提升服務品質</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>誠信經營，建立長期信任關係</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-[30px] sm:rounded-[35px] md:rounded-[40px] p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold serif mb-3 sm:mb-4">服務承諾</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>提供最新、最安全的電動車</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>官方 LINE 客服支援</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>完善的保險保障</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>專業的導覽建議</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Environment Images */}
      {!loading && environmentImages.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20 bg-[#f0f4ff]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold serif text-center mb-8 sm:mb-12">我們的環境</h2>
            <div className="bg-[#f0f4ff] rounded-[30px] sm:rounded-[35px] md:rounded-[40px] p-6 sm:p-8 md:p-12">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {environmentImages.map((image) => (
                  <div key={image.id} className="aspect-square rounded-[30px] overflow-hidden">
                    <img
                      src={`/storage/${image.image_path}`}
                      alt="環境圖片"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default About;
