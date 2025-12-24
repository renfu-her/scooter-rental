
import React, { useState } from 'react';
import { Plus, Search, Edit3, Trash2, MapPin, Phone, Building, Image as ImageIcon, X } from 'lucide-react';

const PartnersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const inputClasses = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 shadow-sm";

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">合作商管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理各租賃門市與合作店家資訊</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>新增合作商</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋合作商名稱、地址或統編..." 
              className={inputClasses.replace('shadow-sm', '') + ' pl-11 shadow-none'}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-5">店面照片</th>
                <th className="px-6 py-5">合作商名稱</th>
                <th className="px-6 py-5">合作商地址</th>
                <th className="px-6 py-5">聯絡電話</th>
                <th className="px-6 py-5">合作商統編</th>
                <th className="px-6 py-5">商店主管</th>
                <th className="px-6 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="w-20 h-12 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                    <img src="https://picsum.photos/id/1018/100/60" alt="Store" className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="px-6 py-5 font-black text-gray-900 text-base">蘭光電動機車出租</td>
                <td className="px-6 py-5 text-gray-500 font-medium">屏東縣琉球鄉相埔路86-5</td>
                <td className="px-6 py-5 text-gray-500 font-medium tracking-wide">0911-306-011</td>
                <td className="px-6 py-5 text-gray-500 font-bold">88889999</td>
                <td className="px-6 py-5 text-gray-500 font-black">Admin</td>
                <td className="px-6 py-5 text-right space-x-2">
                  <button className="p-2 hover:bg-orange-50 rounded-xl text-orange-600 transition-all font-bold">
                    <Edit3 size={16} />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-all font-bold">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">建立合作商</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
                    <Building size={14} className="mr-1.5" /> 合作商名稱 <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input type="text" className={inputClasses} required placeholder="例如：琉球總店" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
                    <MapPin size={14} className="mr-1.5" /> 合作商地址
                  </label>
                  <input type="text" className={inputClasses} placeholder="完整的店址" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
                    <Phone size={14} className="mr-1.5" /> 聯絡電話
                  </label>
                  <input type="tel" className={inputClasses} placeholder="09XX-XXX-XXX" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    合作商統編
                  </label>
                  <input type="text" className={inputClasses} placeholder="8位數字統編" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">店面形象照片</label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center bg-gray-50/50 hover:bg-white hover:border-orange-400 transition-all group cursor-pointer">
                   <div className="flex flex-col items-center">
                      <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <ImageIcon size={32} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                      <p className="text-sm font-bold text-gray-700">拖放檔案，或者 <span className="text-orange-600">點擊瀏覽</span></p>
                      <p className="text-xs text-gray-400 mt-1 font-medium">建議比例 16:9, 最高支援 10MB JPG/PNG</p>
                   </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3 rounded-b-3xl">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-white transition-all">取消</button>
              <button className="px-10 py-2.5 bg-gray-900 rounded-xl text-sm font-black text-white hover:bg-black shadow-lg active:scale-95 transition-all">確認建立</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnersPage;
