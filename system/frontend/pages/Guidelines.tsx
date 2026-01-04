
import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { publicApi } from '../lib/api';

interface Guideline {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const Guidelines: React.FC = () => {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState('所有問題');

  useEffect(() => {
    const fetchGuidelines = async () => {
      try {
        const response = await publicApi.guidelines.list();
        setGuidelines(response.data || []);
      } catch (error) {
        console.error('Failed to fetch guidelines:', error);
        setGuidelines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGuidelines();
  }, []);

  const categories = Array.from(new Set(guidelines.map(g => g.category)));
  const allCategories = ['所有問題', ...categories];

  const filteredFaqs = filter === '所有問題' 
    ? guidelines 
    : guidelines.filter(f => f.category === filter);

  return (
    <div className="animate-in slide-in-from-right-4 duration-700">
      <header className="py-20 px-6 bg-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl serif mb-2">租賃須知</h1>
          <h2 className="text-5xl md:text-7xl font-light serif tracking-tighter mb-4">Q&A</h2>
          <div className="mt-4 text-xs text-gray-400 uppercase tracking-widest">首頁 &gt; 租賃須知</div>
        </div>
      </header>

      {loading ? (
        <div className="container mx-auto px-6 max-w-4xl py-12">
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">載入中...</div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-6 max-w-4xl py-12">
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2 rounded-lg text-sm transition-all ${
                  filter === cat 
                  ? 'bg-[#1a1a1a] text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq, idx) => (
              <div key={faq.id} className="border-b border-gray-100 pb-4">
                <button
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left py-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-black text-white rounded-md flex items-center justify-center text-xs font-bold">Q</div>
                    <span className="font-medium text-gray-800">{faq.question}</span>
                  </div>
                  <div className="bg-black text-white p-1 rounded transition-transform">
                    {openIndex === idx ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </button>
                {openIndex === idx && (
                  <div className="pl-12 pr-6 pb-4 text-gray-600 leading-relaxed text-sm animate-in fade-in slide-in-from-top-1 duration-300">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-gray-400 text-center">
                  <p className="text-lg mb-2">目前尚無相關問題</p>
                  <p className="text-sm">我們正在整理常見問題，請稍後再來查看，或透過聯絡我們頁面直接詢問。</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Decorative Wave Bottom */}
      <div className="h-40 bg-white relative overflow-hidden">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#fcfcfc" fillOpacity="1" d="M0,224L80,213.3C160,203,320,181,480,181.3C640,181,800,203,960,192C1120,181,1280,139,1360,117.3L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
      </div>
    </div>
  );
};

export default Guidelines;
