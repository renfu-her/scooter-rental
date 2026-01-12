
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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

  return (
    <div className="animate-in fade-in duration-700">
      <SEO
        title="蘭光電動機車 - 小琉球電動車租賃首選"
        description="蘭光電動機車致力於為每一位旅客提供最優質的電動車租賃服務，讓您能夠以最環保、最舒適的方式探索小琉球的美麗風光。"
        keywords="小琉球,電動車,租車,機車租賃,蘭光電動機車,小琉球租車,電動機車,環保旅遊,小琉球旅遊"
        url="/"
        structuredData={structuredData}
      />
      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[80%] bg-[#f0f9f6] blob-shape -z-10 opacity-60 transform rotate-12"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[60%] bg-[#fff4f9] blob-shape -z-10 opacity-60"></div>

        <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-gray-400 font-medium tracking-[0.2em] mb-4 uppercase text-sm">Not just a car rental experience</h2>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 serif">
              讓<span className="text-sky-500">純淨動力</span>，帶你遇見更美好的島嶼風光
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto md:mx-0 leading-relaxed">
              就是要給旅客不一樣的租車體驗，安靜又舒適的騎乘過程，帶領您探訪小琉球大自然的美好。
            </p>
            <Link 
              to="/rental" 
              className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full group hover:bg-teal-700 transition-all font-bold"
            >
              READ MORE
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight size={18} />
              </div>
            </Link>
          </div>

          <div className="md:w-1/2 relative">
            <div className="w-full aspect-square md:aspect-video rounded-[80px] overflow-hidden shadow-2xl blob-shape">
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
      <section className="py-24 bg-[#f0f4ff] overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="aspect-[4/5] rounded-[50px] overflow-hidden transform translate-y-12">
              <img src={getImageSrc('featured_image_1')} alt={getImageAlt('featured_image_1', 'Scenic')} className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/5] rounded-full overflow-hidden">
              <img src={getImageSrc('featured_image_2')} alt={getImageAlt('featured_image_2', 'Scooter Detail')} className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/5] rounded-[60px] overflow-hidden transform translate-y-24">
              <img src={getImageSrc('featured_image_3')} alt={getImageAlt('featured_image_3', 'Couple Riding')} className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/5] rounded-[30px] overflow-hidden transform -translate-y-8">
              <img src={getImageSrc('featured_image_4')} alt={getImageAlt('featured_image_4', 'Shop Interior')} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
