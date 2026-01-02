import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { guidelinesApi } from '../lib/api';
import { inputClasses, labelClasses, searchInputClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface Guideline {
  id: number;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

const GuidelinesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState<Guideline | null>(null);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [formData, setFormData] = useState({
    category: '',
    question: '',
    answer: '',
    sort_order: 0,
    is_active: true,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchGuidelines();
  }, [searchTerm, categoryFilter]);

  const fetchGuidelines = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
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
      });
    } else {
      setEditingGuideline(null);
      setFormData({
        category: '',
        question: '',
        answer: '',
        sort_order: 0,
        is_active: true,
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
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const submitData = {
        ...formData,
        sort_order: parseInt(formData.sort_order.toString()),
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
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
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
      ) : (
        <div className="space-y-4">
          {guidelines.map((guideline) => (
            <div
              key={guideline.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded text-xs font-bold">
                      {guideline.category}
                    </span>
                    {!guideline.is_active && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-bold">
                        已停用
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">排序: {guideline.sort_order}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{guideline.question}</h3>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{guideline.answer}</p>
                </div>
                <div className="flex space-x-2 ml-4">
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
              </div>
            </div>
          ))}
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
