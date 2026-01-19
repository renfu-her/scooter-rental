import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storesApi } from '../lib/api';

interface Store {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  manager: string;
  photo_path: string | null;
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
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    try {
      const response = await storesApi.list();
      setStores(response.data || []);
      
      // 如果沒有當前選擇的商店，且商店列表不為空，選擇第一個
      if (!currentStore && response.data && response.data.length > 0) {
        const savedStoreId = localStorage.getItem('current_store_id');
        if (savedStoreId) {
          const savedStore = response.data.find((s: Store) => s.id === parseInt(savedStoreId));
          if (savedStore) {
            setCurrentStoreState(savedStore);
          } else {
            setCurrentStoreState(response.data[0]);
            localStorage.setItem('current_store_id', String(response.data[0].id));
          }
        } else {
          setCurrentStoreState(response.data[0]);
          localStorage.setItem('current_store_id', String(response.data[0].id));
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
  }, []);

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
