
import React, { useState } from 'react';
import { X, Search, Calendar, Clock, Phone, FileText, Sparkles, Loader2 } from 'lucide-react';
import { Scooter, OrderScooterInfo } from '../types';
import { getSmartRecommendation } from '../lib/gemini';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_SCOOTERS: Scooter[] = [
  { id: '1', plateNumber: 'ABC-1234', model: 'ES-2000', type: '白牌' as any, status: '待出租', color: '黑' },
  { id: '2', plateNumber: 'DEF-5678', model: 'ES-1000', type: '綠牌' as any, status: '待出租', color: '白' },
  { id: '3', plateNumber: 'GHI-9012', model: 'EB-500', type: '電輔車' as any, status: '待出租', color: '黑' },
  { id: '4', plateNumber: 'JKL-3456', model: 'ES-2000', type: '白牌' as any, status: '待出租', color: '白' },
];

const AddOrderModal: React.FC<AddOrderModalProps> = ({ isOpen, onClose }) => {
  const [selectedScooters, setSelectedScooters] = useState<Scooter[]>([]);
  const [searchPlate, setSearchPlate] = useState('');
  const [showPlateDropdown, setShowPlateDropdown] = useState(false);
  
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  const scooterStats = selectedScooters.reduce((acc, s) => {
    acc[s.model] = (acc[s.model] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalScooters = selectedScooters.length;

  if (!isOpen) return null;

  const toggleScooter = (scooter: Scooter) => {
    if (selectedScooters.find(s => s.id === scooter.id)) {
      setSelectedScooters(selectedScooters.filter(s => s.id !== scooter.id));
    } else {
      setSelectedScooters([...selectedScooters, scooter]);
    }
  };

  const handleAiRecommend = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    setAiRecommendation(null);
    const result = await getSmartRecommendation(`客戶描述：${aiInput}`);
    if (result) {
      setAiRecommendation(result.recommendation);
      // Auto-select if models match (simple demo logic)
      const toSelect: Scooter[] = [];
      result.suggestedScooters.forEach((suggestion: any) => {
        const matches = MOCK_SCOOTERS.filter(s => s.model === suggestion.model).slice(0, suggestion.count);
        toSelect.push(...matches);
      });
      setSelectedScooters(toSelect);
    }
    setIsAiLoading(false);
  };

  const inputClasses = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            新增租借訂單
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 滾動內容區塊 - 已套用全域白色卷軸樣式 */}
        <div className="p-8 overflow-y-auto space-y-8 flex-1">
          {/* AI Helper Bar */}
          <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-2xl">
            <div className="flex items-center space-x-2 text-orange-700 font-bold mb-3">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-sm">AI 智慧推薦配車</span>
            </div>
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="描述需求，例如：兩大一小去環島，想要白牌車..." 
                className={inputClasses}
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
              />
              <button 
                onClick={handleAiRecommend}
                disabled={isAiLoading}
                className="bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-700 disabled:opacity-50 flex items-center shadow-md shadow-orange-100 active:scale-95 transition-all"
              >
                {isAiLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
                自動建議
              </button>
            </div>
            {aiRecommendation && (
              <div className="mt-3 p-3 bg-white/60 rounded-xl text-xs text-orange-800 border border-orange-100 italic leading-relaxed">
                <span className="font-bold mr-1">AI 建議：</span>{aiRecommendation}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">合作商選擇</label>
                <select className={inputClasses}>
                  <option value="">請選擇合作商</option>
                  <option value="languang">蘭光</option>
                  <option value="taipei">臺北01出租店</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">承租人資訊</label>
                <input type="text" className={inputClasses} placeholder="輸入承租人全名" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
                  <Calendar size={14} className="mr-1.5" /> 預約日期 <span className="text-red-500 ml-1">*</span>
                </label>
                <input type="date" className={inputClasses} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
                    <Clock size={14} className="mr-1.5" /> 開始時間
                  </label>
                  <input type="datetime-local" className={inputClasses} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center">
                    <Clock size={14} className="mr-1.5" /> 結束時間
                  </label>
                  <input type="datetime-local" className={inputClasses} />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  租借機車選取 <span className="text-orange-600 ml-1 font-black">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="輸入車牌號搜尋..." 
                    className={`${inputClasses} pl-11`}
                    value={searchPlate}
                    onChange={(e) => {
                      setSearchPlate(e.target.value);
                      setShowPlateDropdown(true);
                    }}
                  />
                  {showPlateDropdown && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {MOCK_SCOOTERS.filter(s => s.plateNumber.includes(searchPlate.toUpperCase())).map(s => (
                        <div 
                          key={s.id}
                          className="px-5 py-3 hover:bg-orange-50 flex items-center justify-between cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                          onClick={() => {
                            toggleScooter(s);
                            setShowPlateDropdown(false);
                            setSearchPlate('');
                          }}
                        >
                          <div>
                            <span className="text-sm font-bold text-gray-900">{s.plateNumber}</span>
                            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-[10px] rounded font-bold text-gray-500">{s.type}</span>
                          </div>
                          <span className="text-xs text-gray-400">{s.model}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 p-5 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 min-h-[140px]">
                  {selectedScooters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-6 text-gray-400">
                      <Search size={32} className="opacity-10 mb-2" />
                      <p className="text-xs">目前尚未選擇任何機車</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <div className="flex flex-wrap gap-2">
                          {selectedScooters.map(s => (
                            <span key={s.id} className="inline-flex items-center px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-sm">
                              {s.plateNumber}
                              <button className="ml-2 hover:text-white/70" onClick={() => toggleScooter(s)}>
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end space-x-4 sticky bottom-0 z-10">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-white transition-all">取消</button>
          <button className="px-10 py-2.5 bg-gray-900 rounded-xl text-sm font-black text-white hover:bg-black shadow-lg transition-all">建立訂單</button>
        </div>
      </div>
    </div>
  );
};

export default AddOrderModal;
