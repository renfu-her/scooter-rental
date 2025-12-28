import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, Phone, Mail, User, X, Loader2, Shield } from 'lucide-react';
import { usersApi } from '../lib/api';
import { inputClasses as sharedInputClasses, labelClasses, searchInputClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';
interface Member {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
}

const MembersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'active' as 'active' | 'inactive',
  });
  const inputClasses = sharedInputClasses;

  useEffect(() => {
    fetchMembers();
  }, [searchTerm]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await usersApi.list({
        role: 'member',
        search: searchTerm || undefined,
      });
      setMembers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (member?: Member) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        email: member.email,
        phone: member.phone || '',
        password: '',
        status: member.status,
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      status: 'active',
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert('請填寫必填欄位');
      return;
    }

    if (!editingMember && !formData.password) {
      alert('請輸入密碼');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: 'member',
        status: formData.status,
      };

      if (formData.password) {
        submitData.password = formData.password;
      }

      if (editingMember) {
        await usersApi.update(editingMember.id, submitData);
      } else {
        await usersApi.create(submitData);
      }
      handleCloseModal();
      fetchMembers();
    } catch (error: any) {
      console.error('Failed to save member:', error);
      const errorMessage = error?.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(', ')
        : (error?.response?.data?.message || '儲存失敗，請檢查輸入資料');
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此會員嗎？')) return;

    try {
      await usersApi.delete(id);
      fetchMembers();
    } catch (error) {
      console.error('Failed to delete member:', error);
      alert('刪除失敗');
    }
  };

  return (
    <div className="p-6 dark:text-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">會員管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理一般會員帳號</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>新增會員</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜尋姓名、Email 或電話..."
              className={`w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-orange-600" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">載入中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-5">姓名</th>
                  <th className="px-6 py-5">Email</th>
                  <th className="px-6 py-5">電話</th>
                  <th className="px-6 py-5">狀態</th>
                  <th className="px-6 py-5 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      目前沒有會員資料
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-5 font-bold text-gray-900 dark:text-gray-100">{member.name}</td>
                      <td className="px-6 py-5 text-gray-600 dark:text-gray-400">{member.email}</td>
                      <td className="px-6 py-5 text-gray-600 dark:text-gray-400">{member.phone || '-'}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {member.status === 'active' ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(member)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-500 transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingMember ? '編輯會員' : '新增會員'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={labelClasses}>
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  placeholder="輸入會員姓名"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClasses}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className={inputClasses}
                  placeholder="輸入 Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClasses}>
                  電話
                </label>
                <input
                  type="tel"
                  className={inputClasses}
                  placeholder="輸入電話號碼"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClasses}>
                  {editingMember ? '新密碼（留空則不修改）' : '密碼'} <span className="text-red-500">{!editingMember ? '*' : ''}</span>
                </label>
                <input
                  type="password"
                  className={inputClasses}
                  placeholder={editingMember ? '留空則不修改密碼' : '輸入密碼'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClasses}>
                  狀態
                </label>
                <select
                  className={inputClasses}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                >
                  <option value="active">啟用</option>
                  <option value="inactive">停用</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end space-x-4">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-10 py-2.5 bg-orange-600 rounded-xl text-sm font-black text-white hover:bg-orange-700 shadow-lg transition-all disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    儲存中...
                  </>
                ) : (
                  '儲存'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;

