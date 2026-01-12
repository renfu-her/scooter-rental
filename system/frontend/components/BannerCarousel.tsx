
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { publicApi } from '../lib/api';

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image_path: string | null;
  link: string | null;
  button_text: string | null;
}

const BannerCarousel: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  // 從 API 獲取 Banner 數據
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await publicApi.banners.list();
        setBanners(response.data || []);
      } catch (error) {
        console.error('Failed to fetch banners:', error);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // 自動輪播
  useEffect(() => {
    if (!isAutoPlaying || banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // 每 5 秒切換一次

    return () => clearInterval(interval);
  }, [isAutoPlaying, banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false); // 手動切換時暫停自動播放
    setTimeout(() => setIsAutoPlaying(true), 10000); // 10 秒後恢復自動播放
  };

  const goToPrevious = () => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (loading) {
    return (
      <section className="relative w-full aspect-[16/9] sm:aspect-[16/9] md:h-[600px] overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400">載入中...</div>
      </section>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full aspect-[16/9] sm:aspect-[16/9] md:h-[600px] overflow-hidden bg-gray-100">
      {/* Banner 容器 */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="relative w-full h-full">
              {/* Banner 圖片 */}
              <img
                src={banner.image_path ? `/storage/${banner.image_path}` : 'https://via.placeholder.com/1600x600'}
                alt={banner.title}
                className="w-full h-full object-cover object-center"
                style={{ objectPosition: 'center center' }}
              />
              {/* 遮罩層 */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
              
              {/* Banner 內容 */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full px-4 sm:px-8 md:px-16 lg:px-24">
                  <div className="max-w-xs sm:max-w-sm md:max-w-md">
                    {banner.subtitle && (
                      <h2 className="text-white/80 text-[10px] sm:text-xs md:text-sm font-medium tracking-wider uppercase mb-2">
                        {banner.subtitle}
                      </h2>
                    )}
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 serif">
                      {banner.title}
                    </h1>
                    {banner.link && banner.button_text && (
                      <Link
                        to={banner.link}
                        className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold hover:bg-teal-500 hover:text-white transition-all group"
                      >
                        {banner.button_text}
                        <ChevronRight 
                          size={16} 
                          className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform"
                        />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 左側箭頭 */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-black p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Previous banner"
      >
        <ChevronLeft size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
      </button>

      {/* 右側箭頭 */}
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-black p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Next banner"
      >
        <ChevronRight size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
      </button>

      {/* 指示器 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 w-2 hover:bg-white/75'
            }`}
            aria-label={`Go to banner ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default BannerCarousel;
