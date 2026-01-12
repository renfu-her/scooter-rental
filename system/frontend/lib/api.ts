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
}

class FrontendApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: any = new Error(errorData.message || `API request failed: ${response.statusText}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    if (params) {
      const queryString = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      endpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    }
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new FrontendApiClient(API_BASE_URL);

// Public API endpoints (no authentication required)
export const publicApi = {
  banners: {
    list: () => api.get('/banners', { active_only: true }),
  },
  homeImages: {
    list: () => api.get('/home-images'),
  },
  environmentImages: {
    list: () => api.get('/environment-images'),
  },
  shuttleImages: {
    list: () => api.get('/shuttle-images'),
  },
  rentalPlans: {
    list: () => api.get('/rental-plans', { active_only: true }),
  },
  guidelines: {
    list: (params?: { category?: string }) => api.get('/guidelines', { active_only: true, ...params }),
  },
  locations: {
    list: () => api.get('/locations', { active_only: true }),
  },
  guesthouses: {
    list: () => api.get('/guesthouses', { active_only: true }),
    get: (id: string | number) => api.get(`/guesthouses/${id}`),
  },
  contact: {
    send: (data: { name: string; lineId: string; phone?: string; message: string; captcha_id: string; captcha_answer: string }) => 
      api.post('/contact', data),
  },
  booking: {
    send: (data: { name: string; email: string; lineId?: string; phone: string; appointmentDate: string; endDate: string; shippingCompany: string; shipArrivalTime: string; adults?: number; children?: number; scooters: Array<{ model: string; type: string; count: number }>; note?: string }) => 
      api.post('/booking', data),
  },
  scooters: {
    models: () => api.get<Array<{ model: string; type: string; label: string }>>('/scooters/models'),
  },
  partners: {
    list: () => api.get('/partners'),
  },
  captcha: {
    generate: () => api.get('/captcha/generate'),
    verify: (captchaId: string, answer: string) => api.post('/captcha/verify', { captcha_id: captchaId, answer }),
  },
};
