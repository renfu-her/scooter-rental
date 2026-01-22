import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storesApi } from '../lib/api';
import { useAuth } from './AuthContext';

interface Store {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  manager: string;
  photo_path: string | null;
  notice: string | null;
}

interface StoreContextType {
  currentStore: Store | null;
  stores: Store[];
  loading: boolean;
  setCurrentStore: (store: Store | null) => void;
  fetchStores: () => Promise<void>;
  createStore: (data: Partial<Store>) => Promise<Store>;
  updateStore: (id: number, data: Partial<Store>) => Promise<Store>;
  deleteStore: (id: number) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    try {
      const response = await storesApi.list();
      const sortedStores = (response.data || []).sort((a: Store, b: Store) => a.id - b.id);
      setStores(sortedStores);
      
      // 根據用戶角色和 store_id 選擇商店
      if (sortedStores && sortedStores.length > 0) {
        // 如果是 admin 且有 store_id，優先選擇其 store_id 對應的商店
        if (user && user.role === 'admin' && user.store_id) {
          const userStore = sortedStores.find((s: Store) => s.id === user.store_id);
          if (userStore) {
            setCurrentStoreState(userStore);
            localStorage.setItem('current_store_id', String(userStore.id));
            return;
          }
        }
        
        // 如果是 super_admin，使用預設的 store_id 3，如果沒有則使用第一個
        if (user && user.role === 'super_admin') {
          const defaultStore = sortedStores.find((s: Store) => s.id === 3) || sortedStores[0];
          setCurrentStoreState(defaultStore);
          localStorage.setItem('current_store_id', String(defaultStore.id));
          return;
        }
        
        // 如果沒有當前選擇的商店，使用保存的或第一個
        if (!currentStore) {
          const savedStoreId = localStorage.getItem('current_store_id');
          if (savedStoreId) {
            const savedStore = sortedStores.find((s: Store) => s.id === parseInt(savedStoreId));
            if (savedStore) {
              setCurrentStoreState(savedStore);
            } else {
              setCurrentStoreState(sortedStores[0]);
              localStorage.setItem('current_store_id', String(sortedStores[0].id));
            }
          } else {
            setCurrentStoreState(sortedStores[0]);
            localStorage.setItem('current_store_id', String(sortedStores[0].id));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentStore = (store: Store | null) => {
    setCurrentStoreState(store);
    if (store) {
      localStorage.setItem('current_store_id', String(store.id));
    } else {
      localStorage.removeItem('current_store_id');
    }
  };

  const createStore = async (data: Partial<Store>): Promise<Store> => {
    const response = await storesApi.create(data);
    await fetchStores();
    return response.data;
  };

  const updateStore = async (id: number, data: Partial<Store>): Promise<Store> => {
    const response = await storesApi.update(id, data);
    await fetchStores();
    // 如果更新的是當前商店，更新當前商店狀態
    if (currentStore && currentStore.id === id) {
      setCurrentStoreState(response.data);
    }
    return response.data;
  };

  const deleteStore = async (id: number): Promise<void> => {
    await storesApi.delete(id);
    await fetchStores();
    // 如果刪除的是當前商店，選擇第一個商店
    if (currentStore && currentStore.id === id) {
      if (stores.length > 1) {
        const remainingStores = stores.filter(s => s.id !== id);
        setCurrentStore(remainingStores[0]);
      } else {
        setCurrentStore(null);
      }
    }
  };

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <StoreContext.Provider value={{
      currentStore,
      stores,
      loading,
      setCurrentStore,
      fetchStores,
      createStore,
      updateStore,
      deleteStore,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
