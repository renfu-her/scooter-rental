
import React, { useState } from 'react';
import { Plus, Search, Bike, Info, MoreVertical, Edit, Trash2, X } from 'lucide-react';
import { ScooterType } from '../types';

const ScootersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const inputClasses = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400";

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">機車管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理車隊清單、保養狀態與車型分類</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>新增機車</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-gray-50/30 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100">
           <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
             <button className="bg-orange-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-sm shadow-orange-100 whitespace-nowrap">全部 120</button>
             <button className="bg-white border border-gray-200 text-gray-600 px-5 py-1.5 rounded-full text-xs font-bold hover:bg-gray-50 whitespace-nowrap transition-colors">待出租 85</button>
             <button className="bg-white border border-gray-200 text-gray-600 px-5 py-1.5 rounded-full text-xs font-bold hover:bg-gray-50 whitespace-nowrap transition-colors">出租中 35</button>
             <button className="bg-white border border-gray-200 text-gray-600 px-5 py-1.5 rounded-full text-xs font-bold hover:bg-gray-50 whitespace-nowrap transition-colors">保養中 2</button>
           </div>
           <div className="relative w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋車牌、型號..." 
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-5">車牌號碼</th>
                <th className="px-6 py-5">機車型號</th>
                <th className="px-6 py-5">車款類型</th>
                <th className="px-6 py-5">顏色</th>
                <th className="px-6 py-5">所屬商店</th>
                <th className="px-6 py-5">狀態</th>
                <th className="px-6 py-5 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { plate: 'ABC-1234', model: 'ES-2000', type: '白牌', color: '星空黑', store: '蘭光電動機車出租', status: '待出租', statusColor: 'bg-green-100 text-green-700' },
                { plate: 'EFG-8888', model: 'EB-500', type: '電輔車', color: '純潔白', store: '蘭光電動機車出租', status: '出租中', statusColor: 'bg-blue-100 text-blue-700' },
                { plate: 'XYZ-9999', model: 'ES-1000', type: '綠牌', color: '海軍藍', store: '澎湖旗艦店', status: '保養中', statusColor: 'bg-orange-100 text-orange-700' },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 group transition-colors">
                  <td className="px-6 py-5 font-black text-gray-900">{item.plate}</td>
                  <td className="px-6 py-5 text-gray-700 font-bold">{item.model}</td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${
                      item.type === '白牌' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      item.type === '電輔車' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      'bg-green-50 text-green-600 border-green-100'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-gray-500 font-medium">{item.color}</td>
                  <td className="px-6 py-5 text-gray-500 font-medium">{item.store}</td>
                  <td className="px-6 py-5">
                     <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black ${item.statusColor} shadow-sm`}>
                       {item.status}
                     </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button className="p-2 hover:bg-orange-50 rounded-xl text-gray-400 hover:text-orange-600 transition-all">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">新增機車設備</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                 <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    所屬分店 / 商店 <span className="text-red-500">*</span>
                  </label>
                  <select className={inputClasses}>
                    <option>蘭光電動機車出租</option>
                    <option>澎湖旗艦店</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    車牌號碼 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" className={inputClasses} placeholder="例如: ABC-1234" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    機車型號 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" className={inputClasses} placeholder="例如: ES-2000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    車款顏色 <span className="text-gray-400 font-normal">(非必填)</span>
                  </label>
                  <input type="text" className={inputClasses} placeholder="例如: 消光黑" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    車款類型 <span className="text-red-500">*</span>
                  </label>
                  <select className={inputClasses}>
                    <option value="白牌">白牌 (Heavy)</option>
                    <option value="綠牌">綠牌 (Light)</option>
                    <option value="電輔車">電輔車 (E-Bike)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    初始狀態 <span className="text-red-500">*</span>
                  </label>
                  <select className={inputClasses}>
                    <option value="待出租">待出租</option>
                    <option value="出租中">出租中</option>
                    <option value="保養中">保養中</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">機車外觀照片</label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 bg-gray-50/50 flex flex-col items-center justify-center hover:border-orange-400 hover:bg-orange-50/10 cursor-pointer transition-all group">
                   <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                     <Bike size={32} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                   </div>
                   <p className="text-sm font-bold text-gray-700">點擊或拖放照片至此</p>
                   <p className="text-xs text-gray-400 mt-1">建議解析度 1280x720 以上的清晰照片</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-white hover:text-gray-700 transition-all">取消</button>
              <button className="px-10 py-2.5 bg-gray-900 rounded-xl text-sm font-black text-white hover:bg-black shadow-lg active:scale-95 transition-all">完成建立</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScootersPage;
