
import React, { useState } from 'react';
import { Plus, Trash2, Move, Eye, Edit2, Image as ImageIcon } from 'lucide-react';

const BannersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">首頁輪播圖管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理官網首頁大型看板與活動促銷圖</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>上傳新看板</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
            <div className="aspect-[16/9] relative bg-gray-100">
              <img 
                src={`https://picsum.photos/seed/${i + 100}/800/450`} 
                className="w-full h-full object-cover" 
                alt="Banner Preview" 
              />
              <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-[10px] font-bold">
                順序: {i}
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                <button className="p-2 bg-white rounded-full text-gray-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                  <Eye size={18} />
                </button>
                <button className="p-2 bg-white rounded-full text-gray-800 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                  <Edit2 size={18} />
                </button>
                <button className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">2025 新年特惠活動 - {i}</h3>
                <p className="text-xs text-gray-400 mt-1">建立日期: 2025-01-0{i}</p>
              </div>
              <button className="text-gray-300 hover:text-gray-500 cursor-move">
                <Move size={20} />
              </button>
            </div>
          </div>
        ))}

        <button 
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 bg-white hover:bg-gray-50 hover:border-orange-300 transition-all text-gray-400 hover:text-orange-500"
        >
          <Plus size={32} className="mb-2" />
          <span className="text-sm font-medium">點擊上傳新橫幅</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">上傳首頁看板</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">標題 / 描述</label>
                <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500" placeholder="例如：夏季租車 8 折優惠" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">連結 URL (點擊圖片跳轉)</label>
                <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">看板圖片 (建議 1920x1080)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center bg-gray-50 flex flex-col items-center">
                  <ImageIcon size={32} className="text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">點擊上傳檔案</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">取消</button>
              <button className="px-6 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg shadow-md">確認發佈</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const XIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default BannersPage;
