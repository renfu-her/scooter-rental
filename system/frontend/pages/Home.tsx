
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Smartphone, Monitor } from 'lucide-react';
import BannerCarousel from '../components/BannerCarousel';
import SEO from '../components/SEO';
import { publicApi } from '../lib/api';

interface HomeImage {
  id: number;
  key: string;
  image_path: string | null;
  alt_text: string | null;
}

const DEFAULT_IMAGES: Record<string, string> = {
  hero_image: 'https://picsum.photos/seed/hero/1200/800',
  featured_image_1: 'https://picsum.photos/seed/view1/600/800',
  featured_image_2: 'https://picsum.photos/seed/view2/600/800',
  featured_image_3: 'https://picsum.photos/seed/view3/600/800',
  featured_image_4: 'https://picsum.photos/seed/view4/600/800',
};

const Home: React.FC = () => {
  const [homeImages, setHomeImages] = useState<Record<string, HomeImage>>({});
  const [viewMode, setViewMode] = useState<'auto' | 'mobile' | 'desktop'>('auto');

  useEffect(() => {
    const fetchHomeImages = async () => {
      try {
        const response = await publicApi.homeImages.list();
        setHomeImages(response.data || {});
      } catch (error) {
        console.error('Failed to fetch home images:', error);
        setHomeImages({});
      }
    };

    fetchHomeImages();
  }, []);

  const getImageSrc = (key: string): string => {
    if (homeImages[key]?.image_path) {
      return `/storage/${homeImages[key].image_path}`;
    }
    return DEFAULT_IMAGES[key] || '';
  };

  const getImageAlt = (key: string, defaultAlt: string): string => {
    return homeImages[key]?.alt_text || defaultAlt;
  };
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: '蘭光電動機車',
    description: '蘭光電動機車致力於為每一位旅客提供最優質的電動車租賃服務，讓您能夠以最環保、最舒適的方式探索小琉球的美麗風光。',
    url: window.location.origin,
    logo: `${window.location.origin}/logo2.png`,
    image: `${window.location.origin}/logo2.png`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: '小琉球',
      addressRegion: '屏東縣',
      addressCountry: 'TW'
    },
    priceRange: '$$',
    telephone: '+886-8-861-0000',
    areaServed: {
      '@type': 'City',
      name: '小琉球'
    },
    serviceType: '電動機車租賃服務'
  };

  // 根據 viewMode 設置容器類別
  const getContainerClass = () => {
    if (viewMode === 'mobile') {
      return 'max-w-[375px] mx-auto';
    } else if (viewMode === 'desktop') {
      return 'min-w-[1024px]';
    }
    return '';
  };

  return (
    <div className="animate-in fade-in duration-700 relative">
      <SEO
        title="蘭光電動機車 - 小琉球電動車租賃首選"
        description="蘭光電動機車致力於為每一位旅客提供最優質的電動車租賃服務，讓您能夠以最環保、最舒適的方式探索小琉球的美麗風光。"
        keywords="小琉球,電動車,租車,機車租賃,蘭光電動機車,小琉球租車,電動機車,環保旅遊,小琉球旅遊"
        url="/"
        structuredData={structuredData}
      />
      
      {/* 視圖切換按鈕 */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
        <button
          onClick={() => setViewMode('auto')}
          className={`p-2 rounded transition-all ${
            viewMode === 'auto' 
              ? 'bg-teal-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="自動（響應式）"
        >
          <span className="text-xs font-bold">AUTO</span>
        </button>
        <button
          onClick={() => setViewMode('mobile')}
          className={`p-2 rounded transition-all ${
            viewMode === 'mobile' 
              ? 'bg-teal-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="移動端視圖"
        >
          <Smartphone size={20} />
        </button>
        <button
          onClick={() => setViewMode('desktop')}
          className={`p-2 rounded transition-all ${
            viewMode === 'desktop' 
              ? 'bg-teal-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="桌面端視圖"
        >
          <Monitor size={20} />
        </button>
      </div>

      {/* 視圖容器 */}
      <div className={getContainerClass()}>
        {/* Banner Carousel */}
        <BannerCarousel />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] sm:min-h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden py-12 sm:py-16 md:py-0">
        {/* Decorative background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[80%] bg-[#f0f9f6] blob-shape -z-10 opacity-60 transform rotate-12"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[60%] bg-[#fff4f9] blob-shape -z-10 opacity-60"></div>

        <div className="container mx-auto px-4 sm:px-6 md:px-12 flex flex-col md:flex-row items-center gap-8 sm:gap-12">
          <div className="md:w-1/2 text-center md:text-left w-full">
            <h2 className="text-gray-400 font-medium tracking-[0.2em] mb-3 sm:mb-4 uppercase text-xs sm:text-sm">Not just a car rental experience</h2>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6 serif">
              讓<span className="text-sky-500">純淨動力</span>，帶你遇見更美好的島嶼風光
            </h1>
            <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto md:mx-0 leading-relaxed text-sm sm:text-base">
              就是要給旅客不一樣的租車體驗，安靜又舒適的騎乘過程，帶領您探訪小琉球大自然的美好。
            </p>
            <Link 
              to="/rental" 
              className="inline-flex items-center gap-2 sm:gap-3 bg-black text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full group hover:bg-teal-700 transition-all font-bold text-sm sm:text-base"
            >
              READ MORE
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </Link>
          </div>

          <div className="md:w-1/2 relative w-full">
            <div className="w-full aspect-square md:aspect-video rounded-[40px] sm:rounded-[60px] md:rounded-[80px] overflow-hidden shadow-2xl blob-shape">
              <img 
                src={getImageSrc('hero_image')} 
                alt={getImageAlt('hero_image', 'Scooter riding at sunset')} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Images Grid (Based on Image 4 & 5) */}
      <section className="py-12 sm:py-16 md:py-24 bg-[#f0f4ff] overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
            <div className="aspect-[4/5] rounded-[30px] sm:rounded-[40px] md:rounded-[50px] overflow-hidden transform translate-y-4 sm:translate-y-8 md:translate-y-12">
              <img src={getImageSrc('featured_image_1')} alt={getImageAlt('featured_image_1', 'Scenic')} className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/5] rounded-full sm:rounded-full overflow-hidden">
              <img src={getImageSrc('featured_image_2')} alt={getImageAlt('featured_image_2', 'Scooter Detail')} className="w-full h-full object-cover" />
            </div>
            {/* 移動端：第三張圖片顯示在第二行左側，桌面端：第三張 */}
            <div className="aspect-[4/5] rounded-[40px] sm:rounded-[50px] md:rounded-[60px] overflow-hidden transform translate-y-8 sm:translate-y-16 md:translate-y-24 order-3 md:order-3">
              <img src={getImageSrc('featured_image_3')} alt={getImageAlt('featured_image_3', 'Couple Riding')} className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/5] rounded-[20px] sm:rounded-[25px] md:rounded-[30px] overflow-hidden transform -translate-y-4 sm:-translate-y-6 md:-translate-y-8 order-4 md:order-4">
              <img src={getImageSrc('featured_image_4')} alt={getImageAlt('featured_image_4', 'Shop Interior')} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      </div>
    </div>
  );
};

export default Home;
