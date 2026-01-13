import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Tag, Edit3, Trash2, X, Loader2, MoreHorizontal, ChevronDown } from 'lucide-react';
import { scooterTypesApi } from '../lib/api';
import { inputClasses, selectClasses, labelClasses, searchInputClasses, chevronDownClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface ScooterType {
  id: number;
  name: string;
  color: string | null;
}

const ScooterTypesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ScooterType | null>(null);
  const [scooterTypes, setScooterTypes] = useState<ScooterType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    color: '',
  });
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    fetchScooterTypes();
  }, [searchTerm]);

  const fetchScooterTypes = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      const response = await scooterTypesApi.list(params);
      setScooterTypes(response.data || []);
    } catch (error) {
      console.error('Failed to fetch scooter types:', error);
      setScooterTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type?: ScooterType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        color: type.color || '',
      });
    } else {
      setEditingType(null);
      setFormData({
        name: '',
        color: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
    setFormData({
      name: '',
      color: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        color: formData.color || null,
      };

      if (editingType) {
        await scooterTypesApi.update(editingType.id, data);
      } else {
        await scooterTypesApi.create(data);
      }
      
      handleCloseModal();
      fetchScooterTypes();
    } catch (error: any) {
      console.error('Failed to save scooter type:', error);
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.entries(errors).map(([field, messages]: [string, any]) => {
          return messages.join(', ');
        }).join('\n');
        alert(`儲存失敗：\n${errorMessages}`);
      } else if (error?.response?.data?.message) {
        alert(`儲存失敗：${error.response.data.message}`);
      } else {
        alert('儲存失敗，請檢查輸入資料');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此機車類型嗎？此操作無法復原。')) {
      return;
    }
    try {
      await scooterTypesApi.delete(id);
      fetchScooterTypes();
    } catch (error: any) {
      console.error('Failed to delete scooter type:', error);
      if (error?.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('刪除失敗，請稍後再試。');
      }
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const toggleDropdown = (typeId: number) => {
    if (openDropdownId === typeId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[typeId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          right: window.innerWidth - rect.right,
        });
      }
      setOpenDropdownId(typeId);
    }
  };

  const handleEdit = (type: ScooterType) => {
    handleOpenModal(type);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

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

  const filteredTypes = scooterTypes.filter(type => {
    if (searchTerm && !type.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">機車類型管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理機車類型與顏色設定</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>新增機車類型</span>
        </button>
      </div>

      {/* 搜尋 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜尋機車類型..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={searchInputClasses}
            />
          </div>
        </div>
      </div>

      {/* 列表 */}
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
                <th className="px-6 py-5">機車類型</th>
                <th className="px-6 py-5">顏色</th>
                <th className="px-6 py-5 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    目前沒有機車類型資料
                  </td>
                </tr>
              ) : (
                filteredTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 group transition-colors">
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${
                        type.name === '白牌' ? 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800' : 
                        type.name === '綠牌' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                        type.name === '電輔車' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                        type.name === '三輪車' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
                        'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
                      }`}>
                        {type.name}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {type.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                            style={{ backgroundColor: type.color }}
                            title={type.color}
                          />
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {type.color}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="relative">
                        <button 
                          ref={(el) => { 
                            if (el) buttonRefs.current[type.id] = el; 
                          }}
                          onClick={() => toggleDropdown(type.id)}
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

      {/* 下拉選單遮罩層（點擊外部關閉） */}
      {openDropdownId !== null && dropdownPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpenDropdownId(null);
              setDropdownPosition(null);
            }}
          />
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 min-w-[120px]"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const type = filteredTypes.find(t => t.id === openDropdownId);
              if (!type) return null;
              return (
                <>
                  <button
                    onClick={() => handleEdit(type)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit3 size={16} />
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(type.id)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    刪除
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* 新增/編輯 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingType ? '編輯機車類型' : '新增機車類型'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className={labelClasses}>
                  機車類型名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: 白牌"
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>
                  顏色
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.color || '#6B7280'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                      title="選擇顏色"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={formData.color || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^#[0-9A-Fa-f]{6}$/.test(value)) {
                            setFormData({ ...formData, color: value });
                          }
                        }}
                        placeholder="#7DD3FC"
                        className={`${inputClasses} font-mono text-sm`}
                        maxLength={7}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        輸入 hex 顏色值（例如：#FF5733）
                      </p>
                    </div>
                  </div>
                </div>
                {formData.color && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-700"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {formData.color}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={modalCancelButtonClasses}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className={modalSubmitButtonClasses}
                >
                  {editingType ? '更新' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScooterTypesPage;
