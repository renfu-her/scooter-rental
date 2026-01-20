import React, { useState, useRef, useEffect } from 'react';
import { Store, Plus, X, Edit3, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { storesApi } from '../lib/api';

const StoreSelector: React.FC<{ theme: 'light' | 'dark'; sidebarOpen: boolean }> = ({ theme, sidebarOpen }) => {
  const { currentStore, stores, loading, setCurrentStore, createStore, deleteStore } = useStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStore, setEditingStore] = useState<{ id: number; name: string; address: string; phone: string; manager: string; notice?: string | null } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager: '',
    notice: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleOpenModal = (store?: { id: number; name: string; address: string | null; phone: string | null; manager: string; notice?: string | null }) => {
    if (store) {
      setIsEditing(true);
      setEditingStore({ id: store.id, name: store.name, address: store.address || '', phone: store.phone || '', manager: store.manager, notice: store.notice || null });
      setFormData({
        name: store.name,
        address: store.address || '',
        phone: store.phone || '',
        manager: store.manager,
        notice: store.notice || '',
      });
    } else {
      setIsEditing(false);
      setEditingStore(null);
      setFormData({ name: '', address: '', phone: '', manager: '', notice: '' });
    }
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingStore(null);
      setFormData({ name: '', address: '', phone: '', manager: '', notice: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && editingStore) {
        await storesApi.update(editingStore.id, formData);
      } else {
        await createStore(formData);
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save store:', error);
      alert(error?.response?.data?.message || '儲存失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個商店嗎？')) {
      return;
    }

    try {
      await deleteStore(id);
      setIsDropdownOpen(false);
    } catch (error: any) {
      console.error('Failed to delete store:', error);
      alert(error?.response?.data?.message || '刪除失敗，請稍後再試');
    }
  };

  return (
    <>
      <div className={`p-3 border-t border-gray-200 dark:border-gray-700 ${sidebarOpen ? '' : 'px-2'}`} ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={loading}
            className={`w-full p-2.5 rounded-xl transition-all flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-600'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!sidebarOpen && currentStore ? currentStore.name : ''}
          >
            <div className={`flex items-center ${sidebarOpen ? 'space-x-2' : ''} min-w-0 flex-1`}>
              {loading ? (
                <Loader2 size={16} className="animate-spin text-gray-400 flex-shrink-0" />
              ) : (
                <Store size={16} className="flex-shrink-0" />
              )}
              {sidebarOpen && (
                <span className="text-xs font-medium truncate animate-in fade-in duration-300">
                  {loading ? '載入中...' : (currentStore ? currentStore.name : stores.length === 0 ? '無商店，點擊新增' : '選擇商店')}
                </span>
              )}
            </div>
            {sidebarOpen && !loading && <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />}
          </button>

          {isDropdownOpen && sidebarOpen && !loading && (
            <div className={`absolute bottom-full left-0 right-0 mb-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto`}>
              {stores.length === 0 ? (
                <div className={`px-3 py-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p className="text-xs mb-2">目前沒有商店</p>
                  <p className="text-xs">請點擊下方按鈕新增</p>
                </div>
              ) : (
                stores.map((store) => (
                <div key={store.id} className="group">
                  <div
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-all ${
                      currentStore?.id === store.id 
                        ? (theme === 'dark' 
                          ? 'bg-gray-700 border-2 border-orange-500 rounded-lg' 
                          : 'bg-orange-50 border-2 border-orange-500 rounded-lg')
                        : (theme === 'dark' 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-gray-50')
                    }`}
                    onClick={() => {
                      setCurrentStore(store);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Store size={14} className="flex-shrink-0" />
                      <span className={`text-xs font-medium truncate ${currentStore?.id === store.id ? 'text-orange-600 dark:text-orange-400' : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}>
                        {store.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(store);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="編輯"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(store.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                        title="刪除"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
                ))
              )}
              <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => handleOpenModal()}
                  className={`w-full px-3 py-2 flex items-center space-x-2 text-xs font-medium ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                  <Plus size={14} />
                  <span>新增商店</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 新增/編輯商店 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-md w-full p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                {isEditing ? '編輯商店' : '新增商店'}
              </h2>
              <button
                onClick={handleCloseModal}
                className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  商店名稱 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  地址
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  電話
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  負責人 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
              </div>

              {isEditing && (
                <div>
                  <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    注意事項
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notice}
                    onChange={(e) => setFormData({ ...formData, notice: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    placeholder="輸入該商店的注意事項..."
                  />
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    每個商店可以有一個專屬的注意事項
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {isSubmitting ? '儲存中...' : '儲存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default StoreSelector;
