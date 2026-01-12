// 根據當前域名自動判斷 API 基礎 URL
const getApiBaseUrl = () => {
  // 如果設置了環境變數，優先使用
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 根據當前域名自動判斷
  const hostname = window.location.hostname;
  
  if (hostname === 'languangsmart.com' || hostname === 'www.languangsmart.com') {
    return 'https://languangsmart.com/api';
  }
  
  if (hostname === 'scooter-rental.ai-tracks.com' || hostname === 'www.scooter-rental.ai-tracks.com') {
    return 'https://scooter-rental.ai-tracks.com/api';
  }
  
  // 開發環境默認值
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('auth_token');
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // 如果是 401 未授權錯誤，清除 token 並跳轉到登入頁面
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          if (window.location.hash !== '#/login') {
            window.location.hash = '/login';
          }
        }
        
        // 創建一個包含完整錯誤資訊的錯誤物件
        const error: any = new Error(data.message || 'API request failed');
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: data,
        };
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    if (!params) {
      return this.request<T>(endpoint, { method: 'GET' });
    }
    
    // 過濾掉 undefined 和 null 值
    const filteredParams: Record<string, string> = {};
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        filteredParams[key] = String(value);
      }
    });
    
    const queryString = Object.keys(filteredParams).length > 0
      ? '?' + new URLSearchParams(filteredParams).toString()
      : '';
    return this.request<T>(endpoint + queryString, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'photo'
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('auth_token');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        if (window.location.hash !== '#/login') {
          window.location.hash = '/login';
        }
      }
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  }

  async uploadFiles<T>(
    endpoint: string,
    files: File[],
    fieldName: string = 'images'
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(`${fieldName}[]`, file);
    });

    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('auth_token');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        if (window.location.hash !== '#/login') {
          window.location.hash = '/login';
        }
      }
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  }
}

export const api = new ApiClient(API_BASE_URL);

// API endpoints
export const ordersApi = {
  list: (params?: { month?: string; search?: string; page?: number }) =>
    api.get('/orders', params),
  get: (id: string | number) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  update: (id: string | number, data: any) => api.put(`/orders/${id}`, data),
  updateStatus: (id: string | number, status: string) => api.patch(`/orders/${id}/status`, { status }),
  delete: (id: string | number) => api.delete(`/orders/${id}`),
  statistics: (month: string) => api.get('/orders/statistics', { month }),
  getYears: () => api.get<number[]>('/orders/years'),
  getMonthsByYear: (year: number) => api.get<number[]>('/orders/months', { year }),
};

export const partnersApi = {
  list: (params?: { search?: string }) => api.get('/partners', params),
  get: (id: string | number) => api.get(`/partners/${id}`),
  create: (data: any) => api.post('/partners', data),
  update: (id: string | number, data: any) => api.put(`/partners/${id}`, data),
  delete: (id: string | number) => api.delete(`/partners/${id}`),
  uploadPhoto: (id: string | number, file: File) =>
    api.uploadFile(`/partners/${id}/upload-photo`, file),
};

export const storesApi = {
  list: (params?: { search?: string }) => api.get('/stores', params),
  get: (id: string | number) => api.get(`/stores/${id}`),
  create: (data: any) => api.post('/stores', data),
  update: (id: string | number, data: any) => api.put(`/stores/${id}`, data),
  delete: (id: string | number) => api.delete(`/stores/${id}`),
  uploadPhoto: (id: string | number, file: File) =>
    api.uploadFile(`/stores/${id}/upload-photo`, file),
};

export const scootersApi = {
  list: (params?: { status?: string; search?: string }) =>
    api.get('/scooters', params),
  available: () => api.get('/scooters/available'),
  get: (id: string | number) => api.get(`/scooters/${id}`),
  create: (data: any) => api.post('/scooters', data),
  update: (id: string | number, data: any) => api.put(`/scooters/${id}`, data),
  delete: (id: string | number) => api.delete(`/scooters/${id}`),
  uploadPhoto: (id: string | number, file: File) =>
    api.uploadFile(`/scooters/${id}/upload-photo`, file),
};

export const scooterModelColorsApi = {
  list: () => api.get('/scooter-model-colors'),
  getColor: (model: string) => api.get(`/scooter-model-colors/${model}`),
  getColors: (models: string[]) => api.post('/scooter-model-colors/get-colors', { models }),
  update: (model: string, color: string) => api.put(`/scooter-model-colors/${model}`, { color }),
  delete: (model: string) => api.delete(`/scooter-model-colors/${model}`),
};

export const finesApi = {
  list: (params?: { payment_status?: string; search?: string }) =>
    api.get('/fines', params),
  get: (id: string | number) => api.get(`/fines/${id}`),
  create: (data: any) => api.post('/fines', data),
  update: (id: string | number, data: any) => api.put(`/fines/${id}`, data),
  delete: (id: string | number) => api.delete(`/fines/${id}`),
  uploadPhoto: (id: string | number, file: File) =>
    api.uploadFile(`/fines/${id}/upload-photo`, file),
};

export const accessoriesApi = {
  list: (params?: { category?: string; status?: string; search?: string }) =>
    api.get('/accessories', params),
  get: (id: string | number) => api.get(`/accessories/${id}`),
  create: (data: any) => api.post('/accessories', data),
  update: (id: string | number, data: any) => api.put(`/accessories/${id}`, data),
  delete: (id: string | number) => api.delete(`/accessories/${id}`),
  statistics: () => api.get('/accessories/statistics'),
};

export const usersApi = {
  list: (params?: { role?: string; status?: string; search?: string }) =>
    api.get('/users', params),
  get: (id: string | number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string | number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string | number) => api.delete(`/users/${id}`),
};

export const authApi = {
  login: (email: string, password: string, captchaId: string, captchaAnswer: string) => 
    api.post('/login', { email, password, captcha_id: captchaId, captcha_answer: captchaAnswer }),
  me: () => api.get('/me'),
  logout: () => api.post('/logout'),
};

export const captchaApi = {
  generate: () => api.get('/captcha/generate'),
  verify: (captchaId: string, answer: string) => api.post('/captcha/verify', { captcha_id: captchaId, answer }),
};

export const bannersApi = {
  list: (params?: { active_only?: boolean; search?: string }) =>
    api.get('/banners', params),
  get: (id: string | number) => api.get(`/banners/${id}`),
  create: (data: any) => api.post('/banners', data),
  update: (id: string | number, data: any) => api.put(`/banners/${id}`, data),
  delete: (id: string | number) => api.delete(`/banners/${id}`),
  uploadImage: (id: string | number, file: File) =>
    api.uploadFile(`/banners/${id}/upload-image`, file, 'image'),
};

export const rentalPlansApi = {
  list: (params?: { active_only?: boolean; search?: string }) =>
    api.get('/rental-plans', params),
  get: (id: string | number) => api.get(`/rental-plans/${id}`),
  create: (data: any) => api.post('/rental-plans', data),
  update: (id: string | number, data: any) => api.put(`/rental-plans/${id}`, data),
  delete: (id: string | number) => api.delete(`/rental-plans/${id}`),
  uploadImage: (id: string | number, file: File) =>
    api.uploadFile(`/rental-plans/${id}/upload-image`, file, 'image'),
};

export const guidelinesApi = {
  list: (params?: { active_only?: boolean; category?: string; search?: string }) =>
    api.get('/guidelines', params),
  get: (id: string | number) => api.get(`/guidelines/${id}`),
  create: (data: any) => api.post('/guidelines', data),
  update: (id: string | number, data: any) => api.put(`/guidelines/${id}`, data),
  delete: (id: string | number) => api.delete(`/guidelines/${id}`),
};

export const locationsApi = {
  list: (params?: { active_only?: boolean; search?: string }) =>
    api.get('/locations', params),
  get: (id: string | number) => api.get(`/locations/${id}`),
  create: (data: any) => api.post('/locations', data),
  update: (id: string | number, data: any) => api.put(`/locations/${id}`, data),
  delete: (id: string | number) => api.delete(`/locations/${id}`),
  uploadImage: (id: string | number, file: File) =>
    api.uploadFile(`/locations/${id}/upload-image`, file, 'image'),
};

export const guesthousesApi = {
  list: (params?: { active_only?: boolean; search?: string }) =>
    api.get('/guesthouses', params),
  get: (id: string | number) => api.get(`/guesthouses/${id}`),
  create: (data: any) => api.post('/guesthouses', data),
  update: (id: string | number, data: any) => api.put(`/guesthouses/${id}`, data),
  delete: (id: string | number) => api.delete(`/guesthouses/${id}`),
  uploadImage: (id: string | number, file: File) =>
    api.uploadFile(`/guesthouses/${id}/upload-image`, file, 'image'),
  uploadImages: (id: string | number, files: File[]) =>
    api.uploadFiles(`/guesthouses/${id}/upload-images`, files, 'images'),
  deleteImage: (id: string | number, imagePath: string) =>
    api.delete(`/guesthouses/${id}/delete-image`, { image_path: imagePath }),
};

export const homeImagesApi = {
  list: () => api.get('/home-images'),
  get: (key: string) => api.get(`/home-images/${key}`),
  update: (key: string, data: { alt_text?: string }) => api.put(`/home-images/${key}`, data),
  uploadImage: (key: string, file: File) =>
    api.uploadFile(`/home-images/${key}/upload-image`, file, 'image'),
};

export const environmentImagesApi = {
  list: () => api.get('/environment-images'),
  create: async (file: File, sortOrder: number) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('sort_order', sortOrder.toString());

    const url = `${API_BASE_URL}/environment-images`;
    const token = localStorage.getItem('auth_token');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        if (window.location.hash !== '#/login') {
          window.location.hash = '/login';
        }
      }
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  },
  update: (id: number, data: { alt_text?: string | null; sort_order?: number }) =>
    api.put(`/environment-images/${id}`, data),
  delete: (id: number) => api.delete(`/environment-images/${id}`),
};

export const shuttleImagesApi = {
  list: () => api.get('/shuttle-images'),
  create: async (file: File, sortOrder: number) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('sort_order', sortOrder.toString());

    const url = `${API_BASE_URL}/shuttle-images`;
    const token = localStorage.getItem('auth_token');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        if (window.location.hash !== '#/login') {
          window.location.hash = '/login';
        }
      }
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  },
  update: (id: number, data: { sort_order: number }) =>
    api.put(`/shuttle-images/${id}`, data),
  delete: (id: number) => api.delete(`/shuttle-images/${id}`),
};

export const bookingsApi = {
  list: (params?: { search?: string; status?: string }) =>
    api.get('/bookings', params),
  get: (id: string | number) => api.get(`/bookings/${id}`),
  update: (id: string | number, data: any) => api.put(`/bookings/${id}`, data),
  updateStatus: (id: string | number, status: string) =>
    api.patch(`/bookings/${id}/status`, { status }),
  delete: (id: string | number) => api.delete(`/bookings/${id}`),
  pending: () => api.get('/bookings/pending'),
  pendingCount: () => api.get('/bookings/pending/count'),
  convertToOrder: (id: string | number, data: any) =>
    api.post(`/bookings/${id}/convert-to-order`, data),
};

export const contactsApi = {
  list: (params?: { search?: string; status?: string }) =>
    api.get('/contacts', params),
  get: (id: string | number) => api.get(`/contacts/${id}`),
  update: (id: string | number, data: any) => api.put(`/contacts/${id}`, data),
  updateStatus: (id: string | number, status: string) =>
    api.patch(`/contacts/${id}/status`, { status }),
  delete: (id: string | number) => api.delete(`/contacts/${id}`),
};

