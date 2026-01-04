const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

class FrontendApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
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
}

export const api = new FrontendApiClient(API_BASE_URL);

// Public API endpoints (no authentication required)
export const publicApi = {
  banners: {
    list: () => api.get('/banners', { active_only: true }),
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
  },
};
