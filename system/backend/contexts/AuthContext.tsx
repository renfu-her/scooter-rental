import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
  phone: string | null;
  status: 'active' | 'inactive';
  store_id: number | null;
  can_manage_stores: boolean;
  can_manage_content: boolean;
  store?: {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    manager: string;
    photo_path: string | null;
    notice: string | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, captchaId: string, captchaAnswer: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.me();
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string, captchaId: string, captchaAnswer: string) => {
    try {
      const response = await authApi.login(email, password, captchaId, captchaAnswer);
      const { user: userData, token } = response.data;
      
      localStorage.setItem('auth_token', token);
      setUser(userData);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '登入失敗，請檢查 Email 和密碼';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

