import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Edit2, Trash2, X, Loader2, Calendar, MessageCircle, Phone, CheckCircle, XCircle, Clock, Plus, Minus, ArrowLeft } from 'lucide-react';
import { bookingsApi } from '../lib/api';
import { inputClasses, labelClasses, modalCancelButtonClasses, modalSubmitButtonClasses } from '../styles';

interface ScooterSelection {
  model: string;
  count: number;
}

interface Booking {
  id: number;
  name: string;
  line_id: string | null;
  phone: string | null;
  scooter_type: string | null;
  booking_date: string;
  end_date: string | null;
  rental_days: string | null;
  shipping_company: string | null;
  ship_arrival_time: string | null;
  adults: number | null;
  children: number | null;
  scooters: ScooterSelection[] | null;
  note: string | null;
  status: '預約中' | '執行中' | '已經回覆' | '取消' | '已轉訂單';
  created_at: string;
  updated_at: string;
}

const BookingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailId = searchParams.get('detail');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    line_id: '',
    phone: '',
    scooter_type: '',
    booking_date: '',
    end_date: '',
    rental_days: '',
    shipping_company: '',
    ship_arrival_time: '',
    adults: '',
    children: '',
    scooters: [] as ScooterSelection[],
    note: '',
    status: '預約中' as '預約中' | '執行中' | '已經回覆' | '取消' | '已轉訂單',
  });

  useEffect(() => {
    fetchBookings();
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (detailId) {
      fetchBookingDetail(parseInt(detailId));
    } else {
      setDetailBooking(null);
    }
  }, [detailId]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      const response = await bookingsApi.list(params);
      setBookings(response.data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const response = await bookingsApi.get(id);
      setDetailBooking(response.data);
    } catch (error) {
      console.error('Failed to fetch booking detail:', error);
      alert('載入預約詳情失敗');
      setSearchParams({});
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSearchParams({});
    setDetailBooking(null);
  };

  const handleOpenModal = (booking?: Booking) => {
    if (booking) {
      setEditingBooking(booking);
      // 格式化日期
      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };
      const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
      };
      setFormData({
        name: booking.name,
        line_id: booking.line_id || '',
        phone: booking.phone || '',
        scooter_type: booking.scooter_type || '',
        booking_date: formatDate(booking.booking_date),
        end_date: formatDate(booking.end_date),
        rental_days: booking.rental_days || '',
        shipping_company: booking.shipping_company || '',
        ship_arrival_time: formatDateTime(booking.ship_arrival_time),
        adults: booking.adults?.toString() || '',
        children: booking.children?.toString() || '',
        scooters: booking.scooters && Array.isArray(booking.scooters) ? booking.scooters : [],
        note: booking.note || '',
        status: booking.status,
      });
    } else {
      setEditingBooking(null);
      setFormData({
        name: '',
        line_id: '',
        phone: '',
        scooter_type: '',
        booking_date: '',
        end_date: '',
        rental_days: '',
        shipping_company: '',
        ship_arrival_time: '',
        adults: '',
        children: '',
        scooters: [],
        note: '',
        status: '預約中',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData: any = {
        name: formData.name,
        line_id: formData.line_id || null,
        phone: formData.phone || null,
        booking_date: formData.booking_date,
        end_date: formData.end_date || null,
        rental_days: formData.rental_days || null,
        shipping_company: formData.shipping_company || null,
        ship_arrival_time: formData.ship_arrival_time || null,
        adults: formData.adults ? parseInt(formData.adults) : null,
        children: formData.children ? parseInt(formData.children) : null,
        scooters: formData.scooters.length > 0 ? formData.scooters : null,
        note: formData.note || null,
        status: formData.status,
      };
      
      // 如果沒有 scooters，保留舊的 scooter_type
      if (formData.scooter_type) {
        submitData.scooter_type = formData.scooter_type;
      }

      if (editingBooking) {
        await bookingsApi.update(editingBooking.id, submitData);
      }

      await fetchBookings();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save booking:', error);
      alert(error.message || '儲存失敗');
    }
  };

  const addScooter = () => {
    setFormData({
      ...formData,
      scooters: [...formData.scooters, { model: '', count: 1 }],
    });
  };

  const removeScooter = (index: number) => {
    setFormData({
      ...formData,
      scooters: formData.scooters.filter((_, i) => i !== index),
    });
  };

  const updateScooter = (index: number, field: 'model' | 'count', value: string | number) => {
    const updatedScooters = [...formData.scooters];
    updatedScooters[index] = {
      ...updatedScooters[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      scooters: updatedScooters,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此預約嗎？')) return;

    try {
      await bookingsApi.delete(id);
      await fetchBookings();
    } catch (error: any) {
      console.error('Failed to delete booking:', error);
      alert(error.message || '刪除失敗');
    }
  };

  const handleStatusChange = async (id: number, status: '預約中' | '執行中' | '已經回覆' | '取消' | '已轉訂單') => {
    try {
      await bookingsApi.updateStatus(id, status);
      await fetchBookings();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert(error.message || '更新狀態失敗');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '預約中':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case '執行中':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case '已經回覆':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case '取消':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case '已轉訂單':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '預約中':
        return <Clock size={14} className="mr-1" />;
      case '執行中':
        return <Clock size={14} className="mr-1" />;
      case '已經回覆':
        return <CheckCircle size={14} className="mr-1" />;
      case '取消':
        return <XCircle size={14} className="mr-1" />;
      case '已轉訂單':
        return <CheckCircle size={14} className="mr-1" />;
      default:
        return null;
    }
  };

  if (loading && bookings.length === 0 && !detailId) {
    return (
      <div className="px-6 pb-6 pt-0 dark:text-gray-100">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
      </div>
    );
  }

  // 顯示詳情視圖
  if (detailId) {
    if (detailLoading) {
      return (
        <div className="px-6 pb-6 pt-0 dark:text-gray-100">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-orange-600" size={32} />
          </div>
        </div>
      );
    }

    if (!detailBooking) {
      return (
        <div className="px-6 pb-6 pt-0 dark:text-gray-100">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">找不到此預約資料</p>
            <button
              onClick={handleCloseDetail}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              返回列表
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 pb-6 pt-0 dark:text-gray-100">
        <div className="mb-6">
          <button
            onClick={handleCloseDetail}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回列表</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">預約詳情</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(detailBooking.status)}`}>
                {getStatusIcon(detailBooking.status)}
                {detailBooking.status}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">姓名</label>
                <div className="text-base text-gray-800 dark:text-gray-100">{detailBooking.name}</div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">LINE ID</label>
                <div className="text-base text-gray-800 dark:text-gray-100">{detailBooking.line_id || '-'}</div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">電話</label>
                <div className="text-base text-gray-800 dark:text-gray-100">{detailBooking.phone || '-'}</div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">預約日期</label>
                <div className="text-base text-gray-800 dark:text-gray-100">
                  {new Date(detailBooking.booking_date).toLocaleDateString('zh-TW')}
                </div>
              </div>
              {detailBooking.end_date && (
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">結束日期</label>
                  <div className="text-base text-gray-800 dark:text-gray-100">
                    {new Date(detailBooking.end_date).toLocaleDateString('zh-TW')}
                  </div>
                </div>
              )}
              {detailBooking.rental_days && (
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">租借天數</label>
                  <div className="text-base text-gray-800 dark:text-gray-100">{detailBooking.rental_days}</div>
                </div>
              )}
              {detailBooking.shipping_company && (
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">船運公司</label>
                  <div className="text-base text-gray-800 dark:text-gray-100">{detailBooking.shipping_company}</div>
                </div>
              )}
              {detailBooking.ship_arrival_time && (
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">船班時間（來）</label>
                  <div className="text-base text-gray-800 dark:text-gray-100">
                    {new Date(detailBooking.ship_arrival_time).toLocaleString('zh-TW')}
                  </div>
                </div>
              )}
              {detailBooking.adults !== null && (
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">大人 / 人數</label>
                  <div className="text-base text-gray-800 dark:text-gray-100">{detailBooking.adults}</div>
                </div>
              )}
              {detailBooking.children !== null && (
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">小孩 (12歲以下) / 人數</label>
                  <div className="text-base text-gray-800 dark:text-gray-100">{detailBooking.children}</div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">租車類型/數量</label>
              {detailBooking.scooters && Array.isArray(detailBooking.scooters) && detailBooking.scooters.length > 0 ? (
                <div className="space-y-2">
                  {detailBooking.scooters.map((scooter, idx) => (
                    <div key={idx} className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-base text-gray-800 dark:text-gray-100">
                        {scooter.model} x {scooter.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-base text-gray-800 dark:text-gray-100">{detailBooking.scooter_type || '-'}</div>
              )}
            </div>

            {detailBooking.note && (
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">備註</label>
                <div className="text-base text-gray-800 dark:text-gray-100 whitespace-pre-line">{detailBooking.note}</div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>建立時間：{new Date(detailBooking.created_at).toLocaleString('zh-TW')}</span>
                <span>更新時間：{new Date(detailBooking.updated_at).toLocaleString('zh-TW')}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleCloseDetail}
                className={modalCancelButtonClasses}
              >
                返回列表
              </button>
              <button
                onClick={() => handleOpenModal(detailBooking)}
                className={modalSubmitButtonClasses}
              >
                編輯
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 pt-0 dark:text-gray-100">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">預約管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理線上預約資料</p>
        </div>
      </div>

      {/* 搜尋和篩選 */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋姓名、LINE ID、電話..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-gray-200"
        >
          <option value="">全部狀態</option>
          <option value="預約中">預約中</option>
          <option value="執行中">執行中</option>
          <option value="已經回覆">已經回覆</option>
          <option value="取消">取消</option>
          <option value="已轉訂單">已轉訂單</option>
        </select>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">目前沒有預約資料</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">姓名</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">LINE ID</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">電話</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">車款</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">預約日期</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">租借天數</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">狀態</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">建立時間</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{booking.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{booking.line_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{booking.phone || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.scooters && Array.isArray(booking.scooters) && booking.scooters.length > 0 ? (
                          <div className="space-y-1">
                            {booking.scooters.map((scooter, idx) => (
                              <div key={idx}>{scooter.model} x {scooter.count}</div>
                            ))}
                          </div>
                        ) : (
                          <span>{booking.scooter_type || '-'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{booking.booking_date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{booking.rental_days}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(booking.created_at).toLocaleString('zh-TW')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(booking)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="編輯"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="刪除"
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

      {/* 編輯 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingBooking ? '編輯預約' : '新增預約'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className={labelClasses}>姓名 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>LINE ID</label>
                <input
                  type="text"
                  value={formData.line_id}
                  onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>電話</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>預約日期 *</label>
                <input
                  type="date"
                  required
                  value={formData.booking_date}
                  onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>結束日期</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  min={formData.booking_date}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>租借天數</label>
                <select
                  value={formData.rental_days}
                  onChange={(e) => setFormData({ ...formData, rental_days: e.target.value })}
                  className={inputClasses}
                >
                  <option value="">請選擇</option>
                  <option value="1">1 天 (24小時)</option>
                  <option value="2">2 天 1 夜</option>
                  <option value="3">3 天 2 夜</option>
                  <option value="4">4 天以上</option>
                </select>
              </div>

              <div>
                <label className={labelClasses}>船運公司</label>
                <select
                  value={formData.shipping_company}
                  onChange={(e) => setFormData({ ...formData, shipping_company: e.target.value })}
                  className={inputClasses}
                >
                  <option value="">請選擇</option>
                  <option value="泰富">泰富</option>
                  <option value="藍白">藍白</option>
                  <option value="聯營">聯營</option>
                  <option value="大福">大福</option>
                </select>
              </div>

              <div>
                <label className={labelClasses}>船班時間（來）</label>
                <input
                  type="datetime-local"
                  value={formData.ship_arrival_time}
                  onChange={(e) => setFormData({ ...formData, ship_arrival_time: e.target.value })}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>大人 / 人數</label>
                <input
                  type="number"
                  min="0"
                  value={formData.adults}
                  onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>小孩 (12歲以下) / 人數</label>
                <input
                  type="number"
                  min="0"
                  value={formData.children}
                  onChange={(e) => setFormData({ ...formData, children: e.target.value })}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>所需租車類型/數量</label>
                <div className="space-y-2">
                  {formData.scooters.map((scooter, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        type="text"
                        placeholder="機車型號"
                        value={scooter.model}
                        onChange={(e) => updateScooter(index, 'model', e.target.value)}
                        className={inputClasses}
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="數量"
                        value={scooter.count}
                        onChange={(e) => updateScooter(index, 'count', parseInt(e.target.value) || 1)}
                        className={`${inputClasses} w-24`}
                      />
                      <button
                        type="button"
                        onClick={() => removeScooter(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addScooter}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Plus size={18} />
                    新增租車項目
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClasses}>車款（舊欄位，僅供參考）</label>
                <select
                  value={formData.scooter_type}
                  onChange={(e) => setFormData({ ...formData, scooter_type: e.target.value })}
                  className={inputClasses}
                >
                  <option value="">請選擇</option>
                  <option value="白牌">白牌 (Heavy)</option>
                  <option value="綠牌">綠牌 (Light)</option>
                  <option value="電輔車">電輔車 (E-Bike)</option>
                  <option value="三輪車">三輪車 (Tricycle)</option>
                </select>
              </div>

              <div>
                <label className={labelClasses}>備註</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={4}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>狀態 *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as '預約中' | '執行中' | '已經回覆' | '取消' | '已轉訂單' })}
                  className={inputClasses}
                >
                  <option value="預約中">預約中</option>
                  <option value="執行中">執行中</option>
                  <option value="已經回覆">已經回覆</option>
                  <option value="取消">取消</option>
                  <option value="已轉訂單">已轉訂單</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={handleCloseModal} className={modalCancelButtonClasses}>
                  取消
                </button>
                <button type="submit" className={modalSubmitButtonClasses}>
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
