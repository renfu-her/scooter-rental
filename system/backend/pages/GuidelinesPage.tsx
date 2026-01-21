import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { guidelinesApi, storesApi } from '../lib/api';
import { useStore } from '../contexts/StoreContext';
import { inputClasses, labelClasses, searchInputClasses, modalCancelButtonClasses, modalSubmitButtonClasses, selectClasses } from '../styles';

interface Guideline {
  id: number;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  store_id?: number | null;
  store?: { id: number; name: string } | null;
}

interface Store {
  id: number;
  name: string;
}

const GuidelinesPage: React.FC = () => {
  const { currentStore } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState<Guideline | null>(null);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<number | ''>('');
  const [formData, setFormData] = useState({
    category: '',
    question: '',
    answer: '',
    sort_order: 0,
    is_active: true,
    store_id: '',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    fetchGuidelines();
  }, [searchTerm, categoryFilter, selectedStoreFilter]);

  const fetchStores = async () => {
    try {
      const response = await storesApi.list();
      const sortedStores = (response.data || []).sort((a: Store, b: Store) => a.id - b.id);
      setStores(sortedStores);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  };

  const fetchGuidelines = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      const storeId = selectedStoreFilter || currentStore?.id;
      if (storeId) params.store_id = storeId;
      const response = await guidelinesApi.list(params);
      setGuidelines(response.data || []);
    } catch (error) {
      console.error('Failed to fetch guidelines:', error);
      setGuidelines([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(guidelines.map(g => g.category)));

  const handleOpenModal = (guideline?: Guideline) => {
    if (guideline) {
      setEditingGuideline(guideline);
      setFormData({
        category: guideline.category,
        question: guideline.question,
        answer: guideline.answer,
        sort_order: guideline.sort_order,
        is_active: guideline.is_active,
        store_id: guideline.store_id?.toString() || currentStore?.id.toString() || '',
      });
    } else {
      setEditingGuideline(null);
      setFormData({
        category: '',
        question: '',
        answer: '',
        sort_order: 0,
        is_active: true,
        store_id: currentStore?.id.toString() || '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGuideline(null);
      setFormData({
        category: '',
        question: '',
        answer: '',
        sort_order: 0,
        is_active: true,
        store_id: '',
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const submitData = {
        ...formData,
        sort_order: parseInt(formData.sort_order.toString()),
        store_id: formData.store_id || currentStore?.id || null,
      };

      if (editingGuideline) {
        await guidelinesApi.update(editingGuideline.id, submitData);
      } else {
        await guidelinesApi.create(submitData);
      }

      await fetchGuidelines();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save guideline:', error);
      alert(error.message || '儲存失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此問答嗎？')) return;

    try {
      await guidelinesApi.delete(id);
      await fetchGuidelines();
    } catch (error: any) {
      console.error('Failed to delete guideline:', error);
      alert(error.message || '刪除失敗');
    }
  };

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">租車須知管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理 FAQ 問答內容</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>新增問答</span>
        </button>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜尋問題或答案..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={searchInputClasses}
          />
        </div>
        <div className="relative min-w-[200px]">
          <select
            value={selectedStoreFilter}
            onChange={(e) => setSelectedStoreFilter(e.target.value ? Number(e.target.value) : '')}
            className={selectClasses}
          >
            <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">所有商店</option>
            {stores.map(store => (
              <option key={store.id} value={store.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{store.name}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 min-w-[150px]"
        >
          <option value="">所有分類</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
      ) : guidelines.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">目前沒有問答內容</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">分類</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">問題</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">答案</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">商店</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">排序</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">狀態</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {guidelines.map((guideline) => (
                  <tr key={guideline.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded text-xs font-bold">
                        {guideline.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{guideline.question}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-normal">{guideline.answer}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{guideline.store?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{guideline.sort_order}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {guideline.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          啟用
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          停用
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(guideline)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(guideline.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingGuideline ? '編輯問答' : '新增問答'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className={labelClasses}>商店選擇</label>
                <div className="relative">
                  <select 
                    className={selectClasses}
                    value={formData.store_id}
                    onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                  >
                    <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">請選擇商店（非必選）</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{store.name}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              <div>
                <label className={labelClasses}>分類 *</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: 租車須知"
                />
              </div>

              <div>
                <label className={labelClasses}>問題 *</label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: 須具備那些駕照？"
                />
              </div>

              <div>
                <label className={labelClasses}>答案 *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className={inputClasses}
                  placeholder="輸入詳細答案..."
                />
              </div>

              <div>
                <label className={labelClasses}>排序</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className={labelClasses}>啟用</span>
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={modalCancelButtonClasses}
                  disabled={uploading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className={modalSubmitButtonClasses}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : '儲存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidelinesPage;
