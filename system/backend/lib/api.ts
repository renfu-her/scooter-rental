const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
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
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
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
  delete: (id: string | number) => api.delete(`/orders/${id}`),
  statistics: (month: string) => api.get('/orders/statistics', { month }),
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

