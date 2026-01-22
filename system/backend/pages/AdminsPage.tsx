import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit3, Trash2, Phone, Mail, Shield, X, Loader2, MoreHorizontal } from 'lucide-react';
import { usersApi, storesApi } from '../lib/api';
import { inputClasses as sharedInputClasses, labelClasses, searchInputClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface Store {
  id: number;
  name: string;
}

interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'super_admin' | 'admin';
  status: 'active' | 'inactive';
  store_id: number | null;
  can_manage_stores: boolean;
  can_manage_content: boolean;
  store?: Store | null;
}

const AdminsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin' as 'super_admin' | 'admin',
    status: 'active' as 'active' | 'inactive',
    store_id: null as number | null,
    can_manage_stores: false,
    can_manage_content: false,
  });
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const inputClasses = sharedInputClasses;

  useEffect(() => {
    fetchAdmins();
    fetchStores();
  }, [searchTerm]);

  const fetchStores = async () => {
    try {
      const response = await storesApi.list();
      setStores(response.data || []);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      setStores([]);
    }
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // 獲取 super_admin 和 admin 角色
      const [superAdminResponse, adminResponse] = await Promise.all([
        usersApi.list({ role: 'super_admin', search: searchTerm || undefined }),
        usersApi.list({ role: 'admin', search: searchTerm || undefined }),
      ]);
      const allAdmins = [...(superAdminResponse.data || []), ...(adminResponse.data || [])];
      setAdmins(allAdmins);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        name: admin.name,
        email: admin.email,
        phone: admin.phone || '',
        password: '',
        role: admin.role,
        status: admin.status,
        store_id: admin.store_id,
        can_manage_stores: admin.can_manage_stores,
        can_manage_content: admin.can_manage_content,
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'admin',
        status: 'active',
        store_id: null,
        can_manage_stores: false,
        can_manage_content: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'admin',
      status: 'active',
      store_id: null,
      can_manage_stores: false,
      can_manage_content: false,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert('請填寫必填欄位');
      return;
    }

    if (!editingAdmin && !formData.password) {
      alert('請輸入密碼');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        status: formData.status,
        store_id: formData.store_id,
        can_manage_stores: formData.can_manage_stores,
        can_manage_content: formData.can_manage_content,
      };

      if (formData.password) {
        submitData.password = formData.password;
      }

      if (editingAdmin) {
        await usersApi.update(editingAdmin.id, submitData);
      } else {
        await usersApi.create(submitData);
      }
      handleCloseModal();
      fetchAdmins();
    } catch (error: any) {
      console.error('Failed to save admin:', error);
      const errorMessage = error?.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(', ')
        : (error?.response?.data?.message || '儲存失敗，請檢查輸入資料');
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, email: string) => {
    // 禁止刪除 admin@admin.com
    if (email === 'admin@admin.com') {
      alert('無法刪除預設管理員帳號');
      return;
    }

    if (!confirm('確定要刪除此系統管理者嗎？')) return;

    try {
      await usersApi.delete(id);
      fetchAdmins();
    } catch (error: any) {
      console.error('Failed to delete admin:', error);
      const errorMessage = error?.response?.data?.message || '刪除失敗';
      alert(errorMessage);
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleEdit = (admin: Admin) => {
    handleOpenModal(admin);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const toggleDropdown = (adminId: number) => {
    if (openDropdownId === adminId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[adminId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          right: window.innerWidth - rect.right,
        });
      }
      setOpenDropdownId(adminId);
    }
  };

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

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">系統管理者管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理系統管理者帳號</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
        >
          <Plus size={18} />
          <span>新增管理者</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜尋姓名、Email 或電話..."
              className={searchInputClasses}
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
                  <th className="px-6 py-5">角色</th>
                  <th className="px-6 py-5">商店</th>
                  <th className="px-6 py-5">授權</th>
                  <th className="px-6 py-5">狀態</th>
                  <th className="px-6 py-5 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      目前沒有系統管理者資料
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-5 font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <Shield size={16} className="mr-2 text-orange-600" />
                        {admin.name}
                      </td>
                      <td className="px-6 py-5 text-gray-600 dark:text-gray-400">{admin.email}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          admin.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {admin.role === 'super_admin' ? '最高管理者' : '管理者'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-gray-600 dark:text-gray-400">
                        {admin.store?.name || '-'}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          {admin.role === 'super_admin' ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400">全部授權</span>
                          ) : (
                            <>
                              {admin.can_manage_stores && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded">商店管理</span>
                              )}
                              {admin.can_manage_content && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded">內容管理</span>
                              )}
                              {!admin.can_manage_stores && !admin.can_manage_content && (
                                <span className="text-xs text-gray-400">無授權</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          admin.status === 'active'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {admin.status === 'active' ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="relative">
                          <button 
                            ref={(el) => { buttonRefs.current[admin.id] = el; }}
                            onClick={() => toggleDropdown(admin.id)}
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingAdmin ? '編輯系統管理者' : '新增系統管理者'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div>
                <label className={labelClasses}>
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  placeholder="輸入管理者姓名"
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
                  className={`${inputClasses} ${editingAdmin ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60' : ''}`}
                  placeholder="輸入 Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  readOnly={!!editingAdmin}
                  disabled={!!editingAdmin}
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
                  {editingAdmin ? '新密碼（留空則不修改）' : '密碼'} <span className="text-red-500">{!editingAdmin ? '*' : ''}</span>
                </label>
                <input
                  type="password"
                  className={inputClasses}
                  placeholder={editingAdmin ? '留空則不修改密碼' : '輸入密碼'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClasses}>
                  角色 <span className="text-red-500">*</span>
                </label>
                <select
                  className={inputClasses}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'super_admin' | 'admin' })}
                >
                  <option value="admin">管理者</option>
                  <option value="super_admin">最高管理者</option>
                </select>
              </div>

              {formData.role === 'admin' && (
                <>
                  <div>
                    <label className={labelClasses}>
                      所屬商店
                    </label>
                    <select
                      className={inputClasses}
                      value={formData.store_id || ''}
                      onChange={(e) => setFormData({ ...formData, store_id: e.target.value ? parseInt(e.target.value) : null })}
                    >
                      <option value="">選擇商店</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClasses}>
                      授權設定
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.can_manage_stores}
                          onChange={(e) => setFormData({ ...formData, can_manage_stores: e.target.checked })}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">授權商店管理</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.can_manage_content}
                          onChange={(e) => setFormData({ ...formData, can_manage_content: e.target.checked })}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">授權網站內容管理</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {formData.role === 'super_admin' && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    最高管理者擁有所有權限，包括建立帳號、建立店家、設定授權等。
                  </p>
                </div>
              )}

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

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end space-x-4 flex-shrink-0">
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

      {/* 操作下拉菜單使用 fixed 定位，避免被表格 overflow 裁剪 */}
      {openDropdownId !== null && dropdownPosition && admins.find(a => a.id === openDropdownId) && (
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
            ref={(el) => { if (openDropdownId) dropdownRefs.current[openDropdownId] = el; }}
          >
            {(() => {
              const admin = admins.find(a => a.id === openDropdownId);
              if (!admin) return null;
              return (
                <>
                  <button
                    onClick={() => handleEdit(admin)}
                    className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Edit3 size={16} className="text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium">編輯</span>
                  </button>
                  {admin.email !== 'admin@admin.com' && (
                    <button
                      onClick={() => handleDelete(admin.id, admin.email)}
                      className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium">刪除</span>
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminsPage;

