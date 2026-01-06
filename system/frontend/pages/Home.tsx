
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import BannerCarousel from '../components/BannerCarousel';

const Home: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-700">
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
              駕馭科技時尚<br />
              <span className="text-teal-600">環保之旅</span>
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
                src="https://picsum.photos/seed/hero/1200/800" 
                alt="Scooter riding at sunset" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Images Grid (Based on Image 4 & 5) */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="aspect-[4/5] rounded-[50px] overflow-hidden transform translate-y-12">
              <img src="https://picsum.photos/seed/view1/600/800" alt="Scenic" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/5] rounded-full overflow-hidden">
              <img src="https://picsum.photos/seed/view2/600/800" alt="Scooter Detail" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/5] rounded-[60px] overflow-hidden transform translate-y-24">
              <img src="https://picsum.photos/seed/view3/600/800" alt="Couple Riding" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/5] rounded-[30px] overflow-hidden transform -translate-y-8">
              <img src="https://picsum.photos/seed/view4/600/800" alt="Shop Interior" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
