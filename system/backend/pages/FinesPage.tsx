
import React, { useState } from 'react';
import { Search, Plus, AlertCircle, CheckCircle2, MoreVertical, FileText, Camera, X } from 'lucide-react';

const FinesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const inputClasses = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 shadow-sm";

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">罰單管理</h1>
          <p className="text-sm text-gray-500 mt-1">追蹤租賃期間產生的交通罰鍰與繳費狀態</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>登記新罰單</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100">
          <div className="flex space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-xs font-black border border-red-100 whitespace-nowrap shadow-sm shadow-red-50">未繳費 12</span>
            <span className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-full text-xs font-bold border border-gray-200 whitespace-nowrap">已處理 45</span>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋車牌、承租人..." 
              className={inputClasses.replace('shadow-sm', '') + ' pl-11 shadow-none'}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-5">車牌號碼</th>
                <th className="px-6 py-5">承租人</th>
                <th className="px-6 py-5">違規日期</th>
                <th className="px-6 py-5">罰鍰類型</th>
                <th className="px-6 py-5">罰鍰金額</th>
                <th className="px-6 py-5">繳費狀態</th>
                <th className="px-6 py-5 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-5 font-black text-gray-900 text-base tracking-tight">ABC-1234</td>
                <td className="px-6 py-5 text-gray-800 font-bold">陳小明</td>
                <td className="px-6 py-5 text-gray-500 font-medium">2025-01-10</td>
                <td className="px-6 py-5 text-gray-500 font-medium italic">超速行駛</td>
                <td className="px-6 py-5 font-black text-red-600 text-base">$1,600</td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 shadow-sm shadow-red-50">
                    <AlertCircle size={12} className="mr-1" /> 未繳費
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-all">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl relative animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">登記違規罰單</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">車牌號碼</label>
                  <input type="text" className={inputClasses} placeholder="例如: ABC-1234" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">承租人</label>
                  <input type="text" className={inputClasses} placeholder="姓名" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">違規日期</label>
                  <input type="date" className={inputClasses} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">罰鍰金額</label>
                  <input type="number" className={inputClasses} placeholder="1600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">違規事由 / 類型</label>
                <input type="text" className={inputClasses} placeholder="例如：超速、違規停車、闖紅燈" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">罰單影本 / 現場照</label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center bg-gray-50/50 flex flex-col items-center group hover:border-orange-400 hover:bg-white transition-all cursor-pointer">
                  <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Camera size={32} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">點擊上傳或拍攝照片</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium italic">支援格式: JPG, PNG, PDF</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3 rounded-b-3xl">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-white transition-all">取消</button>
              <button className="px-10 py-2.5 bg-gray-900 rounded-xl text-sm font-black text-white hover:bg-black shadow-lg active:scale-95 transition-all">確認登記</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinesPage;
