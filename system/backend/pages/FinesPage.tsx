import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, AlertCircle, CheckCircle2, MoreHorizontal, Camera, X, Loader2, Calendar, Edit3, Trash2, ChevronDown } from 'lucide-react';
import { finesApi, scootersApi } from '../lib/api';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { MandarinTraditional } from 'flatpickr/dist/l10n/zh-tw.js';
import { inputClasses, selectClasses, labelClasses, searchInputClasses, chevronDownClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface Fine {
  id: number;
  scooter_id: number;
  scooter?: { 
    id: number; 
    plate_number: string;
    model?: string;
  };
  order_id: number | null;
  tenant: string;
  violation_date: string;
  violation_type: string;
  fine_amount: number;
  payment_status: string;
  photo_path: string | null;
}

interface Scooter {
  id: number;
  plate_number: string;
}

const FinesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFine, setEditingFine] = useState<Fine | null>(null);
  const [fines, setFines] = useState<Fine[]>([]);
  const [allFines, setAllFines] = useState<Fine[]>([]); // 儲存所有罰單用於計算計數
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    scooter_id: '',
    tenant: '',
    violation_date: '',
    violation_type: '',
    fine_amount: '',
    payment_status: '未繳費',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  // Flatpickr 設定（繁體中文）
  const dateOptions = React.useMemo(() => ({
    locale: MandarinTraditional,
    dateFormat: 'Y-m-d',
    allowInput: true,
  }), []);

  useEffect(() => {
    fetchFines();
    fetchScooters();
  }, [paymentStatusFilter, searchTerm]);

  const fetchFines = async () => {
    setLoading(true);
    try {
      // 獲取所有罰單用於計算計數
      const allResponse = await finesApi.list();
      setAllFines(allResponse.data || []);
      
      // 獲取過濾後的罰單用於顯示
      const params: any = {};
      if (paymentStatusFilter) params.payment_status = paymentStatusFilter;
      if (searchTerm) params.search = searchTerm;
      const response = await finesApi.list(Object.keys(params).length > 0 ? params : undefined);
      setFines(response.data || []);
    } catch (error) {
      console.error('Failed to fetch fines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScooters = async () => {
    try {
      const response = await scootersApi.list();
      setScooters(response.data || []);
    } catch (error) {
      console.error('Failed to fetch scooters:', error);
    }
  };

  const handleOpenModal = (fine?: Fine) => {
    if (fine) {
      setEditingFine(fine);
      setFormData({
        scooter_id: String(fine.scooter_id),
        tenant: fine.tenant,
        violation_date: fine.violation_date,
        violation_type: fine.violation_type,
        fine_amount: String(fine.fine_amount),
        payment_status: fine.payment_status,
      });
      setPhotoPreview(fine.photo_path || null);
    } else {
      setEditingFine(null);
      setFormData({
        scooter_id: '',
        tenant: '',
        violation_date: '',
        violation_type: '',
        fine_amount: '',
        payment_status: '未繳費',
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFine(null);
    setFormData({
      scooter_id: '',
      tenant: '',
      violation_date: '',
      violation_type: '',
      fine_amount: '',
      payment_status: '未繳費',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.scooter_id || !formData.tenant || !formData.violation_date || !formData.violation_type || !formData.fine_amount) {
      alert('請填寫必填欄位');
      return;
    }

    try {
      const data = {
        scooter_id: parseInt(formData.scooter_id),
        tenant: formData.tenant,
        violation_date: formData.violation_date,
        violation_type: formData.violation_type,
        fine_amount: parseFloat(formData.fine_amount),
        payment_status: formData.payment_status,
      };

      if (editingFine) {
        await finesApi.update(editingFine.id, data);
        if (photoFile) {
          await finesApi.uploadPhoto(editingFine.id, photoFile);
        }
      } else {
        const response = await finesApi.create(data);
        if (photoFile) {
          const fineId = editingFine ? editingFine.id : (response.data?.data?.id || response.data?.id);
          if (fineId) {
            await finesApi.uploadPhoto(fineId, photoFile);
          }
        }
      }
      handleCloseModal();
      fetchFines();
    } catch (error) {
      console.error('Failed to save fine:', error);
      alert('儲存失敗，請檢查輸入資料');
    }
  };

  const toggleDropdown = (fineId: number) => {
    if (openDropdownId === fineId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[fineId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8, // mt-2 = 8px
          right: window.innerWidth - rect.right,
        });
      }
      setOpenDropdownId(fineId);
    }
  };

  const handleEdit = (fine: Fine) => {
    handleOpenModal(fine);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此罰單嗎？此操作無法復原。')) {
      return;
    }
    try {
      await finesApi.delete(id);
      fetchFines();
    } catch (error) {
      console.error('Failed to delete fine:', error);
      alert('刪除失敗，請稍後再試。');
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  // 點擊外部關閉下拉菜單（通過遮罩層處理）
  // 滾動時關閉下拉菜單
  useEffect(() => {
    const handleScroll = () => {
      if (openDropdownId !== null) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openDropdownId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 根據所有罰單計算計數（不受過濾器影響）
  const totalCount = allFines.length;
  const unpaidCount = allFines.filter(f => f.payment_status === '未繳費').length;
  const paidCount = allFines.filter(f => f.payment_status === '已處理').length;

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">罰單管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">追蹤租賃期間產生的交通罰鍰與繳費狀態</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>登記新罰單</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 bg-gray-50/30 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button
              onClick={() => setPaymentStatusFilter('')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                !paymentStatusFilter
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-100'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              全部 {totalCount}
            </button>
            <button
              onClick={() => setPaymentStatusFilter('未繳費')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                paymentStatusFilter === '未繳費'
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-100'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              未繳費 {unpaidCount}
            </button>
            <button
              onClick={() => setPaymentStatusFilter('已處理')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                paymentStatusFilter === '已處理'
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-100'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              已處理 {paidCount}
            </button>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋車牌、承租人..." 
              className={searchInputClasses}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-orange-600" />
            <p className="mt-4 text-gray-500">載入中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-5">罰單照片</th>
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
                {fines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-base">
                          {searchTerm || paymentStatusFilter
                            ? '目前沒有符合條件的罰單資料'
                            : '目前沒有罰單資料'}
                        </p>
                        {!searchTerm && !paymentStatusFilter && (
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                            點擊右上角的「登記新罰單」按鈕來新增第一筆罰單
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  fines.map((fine) => (
                    <tr key={fine.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="w-20 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-inner">
                          {fine.photo_path ? (
                            <img 
                              src={fine.photo_path} 
                              alt="罰單照片" 
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => {
                                setImageViewerUrl(fine.photo_path);
                                setImageViewerOpen(true);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                              <Camera size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-black text-base tracking-tight text-gray-900 dark:text-gray-100">
                        {fine.scooter?.plate_number || '-'}
                      </td>
                      <td className="px-6 py-5 text-gray-800 dark:text-gray-200 font-bold">{fine.tenant}</td>
                      <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium">{fine.violation_date}</td>
                      <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium italic">{fine.violation_type}</td>
                      <td className="px-6 py-5 font-black text-red-600 text-base">${fine.fine_amount.toLocaleString()}</td>
                      <td className="px-6 py-5">
                        <span 
                          className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black shadow-sm text-gray-900 dark:text-gray-100"
                          style={
                            fine.payment_status === '已處理' ? { backgroundColor: '#BAE6FD' } : // 天藍色 (sky-200)
                            fine.payment_status === '未繳費' ? { backgroundColor: '#D1D5DB' } : // 灰色 (gray-300)
                            { backgroundColor: '#E5E7EB' } // 預設灰色
                          }
                        >
                          {fine.payment_status === '未繳費' ? <AlertCircle size={12} className="mr-1" /> : <CheckCircle2 size={12} className="mr-1" />}
                          {fine.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="relative">
                          <button 
                            ref={(el) => { buttonRefs.current[fine.id] = el; }}
                            onClick={() => toggleDropdown(fine.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 dark:text-gray-500 transition-colors"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingFine ? '編輯違規罰單' : '登記違規罰單'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>車牌號碼 <span className="text-red-500">*</span></label>
                  <select
                    className={inputClasses}
                    value={formData.scooter_id}
                    onChange={(e) => setFormData({ ...formData, scooter_id: e.target.value })}
                  >
                    <option value="">請選擇</option>
                    {scooters.map(scooter => (
                      <option key={scooter.id} value={scooter.id}>{scooter.plate_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>承租人 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className={inputClasses} 
                    placeholder="姓名"
                    value={formData.tenant}
                    onChange={(e) => setFormData({ ...formData, tenant: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`${labelClasses} flex items-center`}>
                    <Calendar size={14} className="mr-1.5" /> 違規日期 <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Flatpickr
                    key="violation_date"
                    className={inputClasses}
                    value={formData.violation_date}
                    onChange={(dates) => {
                      if (dates && dates.length > 0) {
                        // 使用本地時間格式化日期，避免時區問題導致日期少一天
                        const date = dates[0];
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;
                        setFormData(prev => ({ ...prev, violation_date: dateStr }));
                      }
                    }}
                    options={dateOptions}
                    placeholder="選擇日期"
                  />
                </div>
                <div>
                  <label className={labelClasses}>罰鍰金額 <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    className={inputClasses} 
                    placeholder="1600"
                    value={formData.fine_amount}
                    onChange={(e) => setFormData({ ...formData, fine_amount: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClasses}>違規事由 / 類型 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className={inputClasses} 
                    placeholder="例如：超速、違規停車、闖紅燈"
                    value={formData.violation_type}
                    onChange={(e) => setFormData({ ...formData, violation_type: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClasses}>繳費狀態 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      className={selectClasses}
                      value={formData.payment_status}
                      onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                    >
                      <option value="未繳費" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">未繳費</option>
                      <option value="已處理" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">已處理</option>
                    </select>
                    <ChevronDown size={18} className={chevronDownClasses} />
                  </div>
                </div>
              </div>
              <div>
                <label className={`${labelClasses} mb-3`}>罰單影本 / 現場照</label>
                <div className={`${uploadAreaBaseClasses} flex flex-col items-center`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Camera size={32} className="text-gray-400 dark:text-gray-500 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">點擊上傳或拍攝照片</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium italic">支援格式: JPG, PNG, PDF</p>
                  {photoPreview && (
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="mt-4 max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageViewerUrl(photoPreview);
                        setImageViewerOpen(true);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end space-x-3 rounded-b-3xl flex-shrink-0">
              <button onClick={handleCloseModal} className={modalCancelButtonClasses}>取消</button>
              <button onClick={handleSubmit} className={modalSubmitButtonClasses}>
                {editingFine ? '確認更新' : '確認登記'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 下拉菜單使用 fixed 定位，避免被表格 overflow 裁剪 */}
      {openDropdownId !== null && dropdownPosition && fines.find(f => f.id === openDropdownId) && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setOpenDropdownId(null);
              setDropdownPosition(null);
            }}
          />
          <div 
            className="fixed w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            {(() => {
              const fine = fines.find(f => f.id === openDropdownId);
              if (!fine) return null;
              return (
                <>
                  <button
                    onClick={() => handleEdit(fine)}
                    className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Edit3 size={16} className="text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium">編輯</span>
                  </button>
                  <button
                    onClick={() => handleDelete(fine.id)}
                    className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium">刪除</span>
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* 圖片放大查看器 */}
      {imageViewerOpen && imageViewerUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90" onClick={() => setImageViewerOpen(false)}>
          <button 
            onClick={() => setImageViewerOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={24} />
          </button>
          <img 
            src={imageViewerUrl} 
            alt="Full size" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default FinesPage;
