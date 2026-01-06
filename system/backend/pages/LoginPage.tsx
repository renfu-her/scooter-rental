import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { captchaApi } from '../lib/api';

interface Captcha {
  captcha_id: string;
  image: string; // Base64 encoded image
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    captchaAnswer: '',
  });
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchCaptcha();
    }
  }, []);

  const fetchCaptcha = async () => {
    setIsLoadingCaptcha(true);
    setError(null);
    try {
      const response = await captchaApi.generate();
      if (response && response.data) {
        setCaptcha(response.data);
        setFormData(prev => ({ ...prev, captchaAnswer: '' }));
      } else {
        console.error('Invalid captcha response:', response);
        setError('無法獲取驗證碼，請重新整理頁面');
      }
    } catch (error: any) {
      console.error('Failed to fetch captcha:', error);
      setError(error?.response?.data?.message || '無法獲取驗證碼，請稍後再試');
    } finally {
      setIsLoadingCaptcha(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!captcha) {
      setError('請先獲取驗證碼');
      return;
    }

    if (!formData.captchaAnswer || formData.captchaAnswer.length !== 6) {
      setError('請輸入完整的 6 位驗證碼');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(
        formData.email, 
        formData.password, 
        captcha.captcha_id, 
        formData.captchaAnswer.toUpperCase().trim()
      );
      navigate('/orders');
    } catch (err: any) {
      setError(err.message || '登入失敗，請檢查 Email 和密碼');
      // 登入失敗後重新獲取驗證碼
      fetchCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 space-y-6">
          {/* Logo/Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100">蘭光電動機車管理系統</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">請登入您的帳號</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  className={`${inputClasses} pl-11`}
                  placeholder="輸入您的 Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                密碼
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  className={`${inputClasses} pl-11`}
                  placeholder="輸入您的密碼"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                驗證碼 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 flex items-center justify-center min-h-[60px]">
                  {isLoadingCaptcha ? (
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  ) : captcha ? (
                    <img 
                      src={captcha.image} 
                      alt="驗證碼" 
                      className="h-12 w-auto select-none cursor-pointer"
                      style={{ imageRendering: 'auto' }}
                      onClick={fetchCaptcha}
                      title="點擊刷新驗證碼"
                    />
                  ) : (
                    <span className="text-sm text-gray-400">載入驗證碼中...</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={isLoadingCaptcha || isSubmitting}
                  className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all disabled:opacity-50"
                  title="重新獲取驗證碼"
                >
                  <RefreshCw size={18} className={`text-gray-600 dark:text-gray-300 ${isLoadingCaptcha ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <input
                type="text"
                className={`${inputClasses} uppercase font-mono tracking-widest text-center text-lg`}
                placeholder="輸入 6 位驗證碼"
                value={formData.captchaAnswer}
                onChange={(e) => {
                  // 只允許字母和數字，排除 O 和 0，最多 6 位，強制大寫
                  const value = e.target.value.toUpperCase().replace(/[O0]/g, '').slice(0, 6);
                  setFormData({ ...formData, captchaAnswer: value });
                }}
                required
                disabled={isSubmitting || !captcha}
                maxLength={6}
                pattern="[A-NP-Z1-9]{6}"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !captcha}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-black text-sm shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>登入中...</span>
                </>
              ) : (
                <span>登入</span>
              )}
            </button>
          </form>

          {/* Demo Account Info */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              測試帳號：admin@admin.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

