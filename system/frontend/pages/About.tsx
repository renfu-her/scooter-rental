
import React from 'react';

const About: React.FC = () => {
  return (
    <div className="animate-in slide-in-from-right-4 duration-700">
      {/* Header Section */}
      <header className="py-20 px-6 bg-[#f0f4ff] text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2">About Us</p>
          <h1 className="text-5xl md:text-6xl serif font-light mb-4">關於我們</h1>
          <p className="text-gray-500 max-w-xl mx-auto">蘭光電動機車致力於為每一位旅客提供最優質的電動車租賃服務，讓您能夠以最環保、最舒適的方式探索小琉球的美麗風光。</p>
          <div className="mt-4 text-xs text-gray-400">首頁 &gt; 關於我們</div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold serif mb-6 text-center">我們的使命</h2>
            <p className="text-gray-600 leading-relaxed text-lg mb-6 text-left">
              蘭光電動機車致力於為每一位旅客提供最優質的電動車租賃服務，讓您能夠以最環保、最舒適的方式探索小琉球的美麗風光。
            </p>
            <p className="text-gray-600 leading-relaxed text-lg text-left">
              我們相信，每一次的旅程都應該是一次難忘的體驗。因此，我們不僅提供高品質的電動車，更注重每一位顧客的服務體驗。
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
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
          <div className="bg-white rounded-[50px] p-8 md:p-12 shadow-lg mb-16">
            <h2 className="text-3xl md:text-4xl font-bold serif mb-6">我們的 story</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                蘭光電動機車於2025/07/20於小琉球，我們深知這片美麗島嶼的獨特魅力。從一開始，我們就致力於提供最優質的租車服務，讓每一位旅客都能夠輕鬆、安全地探索小琉球。
              </p>
              <p>
                我們選擇電動車作為主要租賃車輛，不僅因為它們環保、安靜，更因為它們能夠讓您更貼近大自然，享受純淨的騎乘體驗。
              </p>
              <p>
                多年來，我們不斷提升服務品質，從車輛的選擇、保養，到顧客服務的每一個細節，我們都用心經營。我們相信，只有用心，才能創造出真正優質的服務體驗。
              </p>
            </div>
          </div>

          {/* Team/Values Section */}
          <div className="grid md:grid-cols-2 gap-8">
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
            <div className="bg-gray-50 rounded-[40px] p-8">
              <h3 className="text-2xl font-bold serif mb-4">服務承諾</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>提供最新、最安全的電動車</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>24小時客服支援</span>
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

      {/* Image Gallery */}
      <section className="py-20 bg-[#f0f4ff]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold serif text-center mb-12">我們的環境</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square rounded-[30px] overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/about${i}/600/600`}
                  alt={`About us ${i}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
