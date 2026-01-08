
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { publicApi } from '../lib/api';

interface Guesthouse {
  id: number;
  name: string;
  description: string | null;
  short_description: string | null;
  image_path: string | null;
  images: string[] | null;
  link: string | null;
}

const GuesthouseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guesthouse, setGuesthouse] = useState<Guesthouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuesthouse = async () => {
      if (!id) {
        setError('無效的民宿 ID');
        setLoading(false);
        return;
      }

      try {
        const response = await publicApi.guesthouses.get(id);
        setGuesthouse(response.data);
      } catch (error) {
        console.error('Failed to fetch guesthouse:', error);
        setError('載入民宿資訊失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchGuesthouse();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-in fade-in duration-700 bg-[#f0f4ff] min-h-screen">
        <div className="container mx-auto px-6 max-w-4xl py-24">
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">載入中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !guesthouse) {
    return (
      <div className="animate-in fade-in duration-700 bg-[#f0f4ff] min-h-screen">
        <div className="container mx-auto px-6 max-w-4xl py-24">
          <div className="bg-[#f0f4ff] rounded-[40px] shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500 mb-6">{error || '找不到此民宿'}</p>
            <Link
              to="/guidelines"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-black transition-colors"
            >
              <ArrowLeft size={18} />
              <span>返回租車須知</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 bg-[#fcfcfc] min-h-screen">
      <header className="py-20 px-6 bg-[#f0f4ff]">
        <div className="container mx-auto max-w-4xl">
          <Link
            to="/guidelines"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span>返回租車須知</span>
          </Link>
          <p className="text-gray-400 tracking-[0.3em] uppercase mb-2 text-sm">Partner Stays</p>
          <h1 className="text-4xl md:text-6xl serif font-light mb-4">{guesthouse.name}</h1>
          {guesthouse.short_description && (
            <p className="text-gray-500 text-lg">{guesthouse.short_description}</p>
          )}
        </div>
      </header>

      <section className="container mx-auto px-6 max-w-4xl pb-24">
        <div className="bg-[#f0f4ff] rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
          {/* 顯示多圖片或主圖片 */}
          {guesthouse.images && Array.isArray(guesthouse.images) && guesthouse.images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {guesthouse.images.map((img, idx) => (
                <div key={idx} className="aspect-[4/3] overflow-hidden rounded-lg">
                  <img
                    src={`/storage/${img}`}
                    alt={`${guesthouse.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : guesthouse.image_path ? (
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={`/storage/${guesthouse.image_path}`}
                alt={guesthouse.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}

          {guesthouse.description && (
            <div className="p-8 md:p-12">
              <div 
                className="text-gray-700 leading-relaxed prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: guesthouse.description }}
              />
            </div>
          )}

          {guesthouse.link && (
            <div className="px-8 md:px-12 pb-8 md:pb-12">
              <a
                href={guesthouse.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-full font-bold hover:bg-teal-700 transition-colors"
              >
                前往官方網站
                <ExternalLink size={18} />
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default GuesthouseDetail;
