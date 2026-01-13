import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Bike, Edit3, Trash2, X, Loader2, MoreHorizontal, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { scooterModelsApi, scooterTypesApi } from '../lib/api';
import { inputClasses, selectClasses, labelClasses, searchInputClasses, chevronDownClasses, uploadAreaBaseClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface ScooterModel {
  id: number;
  name: string;
  scooter_type_id?: number;
  scooter_type?: {
    id: number;
    name: string;
    color: string | null;
  };
  type: string;
  image_path: string | null;
  color: string | null;
  label?: string;
}

interface ScooterType {
  id: number;
  name: string;
  color: string | null;
}

const ScooterModelsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ScooterModel | null>(null);
  const [scooterModels, setScooterModels] = useState<ScooterModel[]>([]);
  const [scooterTypes, setScooterTypes] = useState<ScooterType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    scooter_type_id: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchScooterModels();
    fetchScooterTypes();
  }, [searchTerm, typeFilter]);

  const fetchScooterTypes = async () => {
    try {
      const response = await scooterTypesApi.list();
      setScooterTypes(response.data || []);
    } catch (error) {
      console.error('Failed to fetch scooter types:', error);
    }
  };

  const fetchScooterModels = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (typeFilter) params.type = typeFilter;
      const response = await scooterModelsApi.list(params);
      setScooterModels(response.data || []);
    } catch (error) {
      console.error('Failed to fetch scooter models:', error);
      setScooterModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (model?: ScooterModel) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        name: model.name,
        scooter_type_id: model.scooter_type_id ? String(model.scooter_type_id) : (model.scooter_type ? String(model.scooter_type.id) : ''),
      });
      setImagePreview(model.image_path || null);
    } else {
      setEditingModel(null);
      setFormData({
        name: '',
        scooter_type_id: '',
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingModel(null);
    setFormData({
      name: '',
      scooter_type_id: '',
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        scooter_type_id: parseInt(formData.scooter_type_id),
      };

      if (editingModel) {
        await scooterModelsApi.update(editingModel.id, data);
        if (imageFile) {
          await scooterModelsApi.uploadImage(editingModel.id, imageFile);
        }
      } else {
        const response = await scooterModelsApi.create(data);
        if (imageFile) {
          const modelId = editingModel ? editingModel.id : (response.data?.data?.id || response.data?.id);
          if (modelId) {
            await scooterModelsApi.uploadImage(modelId, imageFile);
          }
        }
      }
      
      handleCloseModal();
      fetchScooterModels();
    } catch (error: any) {
      console.error('Failed to save scooter model:', error);
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
    if (!confirm('確定要刪除此機車型號嗎？此操作無法復原。')) {
      return;
    }
    try {
      await scooterModelsApi.delete(id);
      fetchScooterModels();
    } catch (error: any) {
      console.error('Failed to delete scooter model:', error);
      if (error?.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('刪除失敗，請稍後再試。');
      }
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const toggleDropdown = (modelId: number) => {
    if (openDropdownId === modelId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[modelId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          right: window.innerWidth - rect.right,
        });
      }
      setOpenDropdownId(modelId);
    }
  };

  const handleEdit = (model: ScooterModel) => {
    handleOpenModal(model);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    setImageFile(null);
    setImagePreview(null);
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


  const filteredModels = scooterModels.filter(model => {
    if (searchTerm && !model.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (typeFilter && model.type !== typeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">機車型號管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理機車型號、類型與顏色設定</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>新增機車型號</span>
        </button>
      </div>

      {/* 搜尋和過濾 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜尋機車型號..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={searchInputClasses}
              />
            </div>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={selectClasses}
              >
                <option value="">全部類型</option>
                <option value="白牌">白牌</option>
                <option value="綠牌">綠牌</option>
                <option value="電輔車">電輔車</option>
                <option value="三輪車">三輪車</option>
              </select>
              <ChevronDown size={18} className={chevronDownClasses} />
            </div>
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
                <th className="px-6 py-5">圖片</th>
                <th className="px-6 py-5">機車型號</th>
                <th className="px-6 py-5">車型類型</th>
                <th className="px-6 py-5">顏色</th>
                <th className="px-6 py-5 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    目前沒有機車型號資料
                  </td>
                </tr>
              ) : (
                filteredModels.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 group transition-colors">
                    <td className="px-6 py-5">
                      <div className="w-20 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-inner">
                        {model.image_path ? (
                          <img 
                            src={model.image_path} 
                            alt={model.name} 
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setImageViewerUrl(model.image_path);
                              setImageViewerOpen(true);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <Bike size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-gray-900 dark:text-gray-100">
                      {model.name}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${
                        model.type === '白牌' ? 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800' : 
                        model.type === '綠牌' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                        model.type === '電輔車' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                        model.type === '三輪車' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
                        'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
                      }`}>
                        {model.type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {model.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                            style={{ backgroundColor: model.color }}
                            title={model.color}
                          />
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {model.color}（來自機車類型）
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
                            if (el) buttonRefs.current[model.id] = el; 
                          }}
                          onClick={() => toggleDropdown(model.id)}
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
              const model = filteredModels.find(m => m.id === openDropdownId);
              if (!model) return null;
              return (
                <>
                  <button
                    onClick={() => handleEdit(model)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit3 size={16} />
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(model.id)}
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
                {editingModel ? '編輯機車型號' : '新增機車型號'}
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
                  機車型號名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: ES-1000"
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>
                  車型類型 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className={selectClasses}
                    value={formData.scooter_type_id}
                    onChange={(e) => setFormData({ ...formData, scooter_type_id: e.target.value })}
                    required
                  >
                    <option value="">請選擇機車類型</option>
                    {scooterTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className={chevronDownClasses} />
                </div>
                {formData.scooter_type_id && (() => {
                  const selectedType = scooterTypes.find(t => String(t.id) === formData.scooter_type_id);
                  return selectedType && selectedType.color ? (
                    <div className="mt-2 flex items-center space-x-2">
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-700"
                        style={{ backgroundColor: selectedType.color }}
                        title={selectedType.color}
                      />
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {selectedType.color}（自動套用）
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
              <div>
                <label className={labelClasses}>圖片</label>
                <div className={uploadAreaBaseClasses}>
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 z-10 hover:bg-red-600 transition-colors"
                        title="刪除圖片"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-500">點擊或拖放圖片到此處</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
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
                  {editingModel ? '更新' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 圖片查看器 */}
      {imageViewerOpen && imageViewerUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setImageViewerOpen(false);
            setImageViewerUrl(null);
          }}
        >
          <img
            src={imageViewerUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ScooterModelsPage;
