import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Loader2 } from 'lucide-react';
import { contactInfosApi } from '../lib/api';
import { inputClasses, labelClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface ContactInfo {
  id: number;
  store_name: string;
  address: string | null;
  phone: string | null;
  line_id: string | null;
  sort_order: number;
  is_active: boolean;
}

const ContactInfosPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContactInfo, setEditingContactInfo] = useState<ContactInfo | null>(null);
  const [contactInfos, setContactInfos] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    address: '',
    phone: '',
    line_id: '',
    sort_order: 0,
    is_active: true,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchContactInfos();
  }, []);

  const fetchContactInfos = async () => {
    setLoading(true);
    try {
      const response = await contactInfosApi.list();
      setContactInfos(response.data || []);
    } catch (error) {
      console.error('Failed to fetch contact infos:', error);
      setContactInfos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (contactInfo?: ContactInfo) => {
    if (contactInfo) {
      setEditingContactInfo(contactInfo);
      setFormData({
        store_name: contactInfo.store_name || '',
        address: contactInfo.address || '',
        phone: contactInfo.phone || '',
        line_id: contactInfo.line_id || '',
        sort_order: contactInfo.sort_order || 0,
        is_active: contactInfo.is_active ?? true,
      });
    } else {
      setEditingContactInfo(null);
      setFormData({
        store_name: '',
        address: '',
        phone: '',
        line_id: '',
        sort_order: 0,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContactInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const submitData = {
        ...formData,
        sort_order: parseInt(formData.sort_order.toString()),
      };

      if (editingContactInfo) {
        await contactInfosApi.update(editingContactInfo.id, submitData);
      } else {
        await contactInfosApi.create(submitData);
      }

      await fetchContactInfos();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save contact info:', error);
      alert(error.message || '儲存失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此聯絡資訊嗎？')) return;

    try {
      await contactInfosApi.delete(id);
      await fetchContactInfos();
    } catch (error: any) {
      console.error('Failed to delete contact info:', error);
      alert(error.message || '刪除失敗');
    }
  };

  if (loading) {
    return (
      <div className="px-6 pb-6 pt-0 dark:text-gray-100">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">聯絡我們管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理官網聯絡資訊</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={18} />
          新增聯絡資訊
        </button>
      </div>

      {contactInfos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">目前沒有聯絡資訊</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">店名</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">地址</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">電話</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">LINE ID</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">排序</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">狀態</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {contactInfos.map((contactInfo) => (
                  <tr key={contactInfo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{contactInfo.store_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{contactInfo.address || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{contactInfo.phone || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{contactInfo.line_id || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{contactInfo.sort_order}</span>
                    </td>
                    <td className="px-6 py-4">
                      {contactInfo.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          啟用
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          停用
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(contactInfo)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(contactInfo.id)}
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
                {editingContactInfo ? '編輯聯絡資訊' : '新增聯絡資訊'}
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
                <label className={labelClasses}>店名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: 蘭光電動機車小琉球店"
                />
              </div>

              <div>
                <label className={labelClasses}>地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: 屏東縣琉球鄉相埔路86之5"
                />
              </div>

              <div>
                <label className={labelClasses}>電話</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: 0911306011"
                />
              </div>

              <div>
                <label className={labelClasses}>LINE ID</label>
                <input
                  type="text"
                  value={formData.line_id}
                  onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                  className={inputClasses}
                  placeholder="例如: @623czmsm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>排序</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className={inputClasses}
                    min="0"
                  />
                </div>
                <div>
                  <label className={labelClasses}>狀態</label>
                  <select
                    value={formData.is_active ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                    className={inputClasses}
                  >
                    <option value="1">啟用</option>
                    <option value="0">停用</option>
                  </select>
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
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <span>{editingContactInfo ? '更新' : '新增'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInfosPage;
