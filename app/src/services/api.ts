import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt token refresh on 401, and only once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear tokens and let the app handle it gracefully
          // Do NOT redirect to /login (there's no router — would break the SPA)
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Dispatch a custom event so the auth store can react
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      } else {
        // No refresh token — clear stale access token silently
        localStorage.removeItem('accessToken');
      }
    }

    return Promise.reject(error);
  }
);

// News API
export const newsApi = {
  getNews: (filters = {}) => api.get('/news', { params: filters }),
  getArticle: (id: string) => api.get(`/news/${id}`),
  getBreakingNews: () => api.get('/news/breaking'),
  getTrendingTopics: () => api.get('/news/trending'),
  getMapPoints: () => api.get('/news/map'),
  searchNews: (query: string, page = 1, limit = 20) =>
    api.get('/news/search', { params: { q: query, page, limit } }),
  getRelatedArticles: (id: string, limit = 5) =>
    api.get(`/news/${id}/related`, { params: { limit } }),
};

// TV API
export const tvApi = {
  getChannels: (filters = {}) => api.get('/tv/channels', { params: filters }),
  getChannel: (id: string) => api.get(`/tv/channels/${id}`),
  getStreamUrl: (id: string) => api.get(`/tv/channels/${id}/stream`),
  checkStreamHealth: (id: string) => api.get(`/tv/channels/${id}/health`),
  getCategories: () => api.get('/tv/categories'),
  getCountries: () => api.get('/tv/countries'),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, username: string) =>
    api.post('/auth/register', { email, password, username }),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  getMe: () => api.get('/auth/me'),
};

// Analytics API
export const analyticsApi = {
  getDashboard: (timeRange = '24h') =>
    api.get('/analytics/dashboard', { params: { timeRange } }),
  getStreamStats: () => api.get('/analytics/streams'),
  getSourceStats: () => api.get('/analytics/sources'),
  getTraffic: (timeRange = '24h') =>
    api.get('/analytics/traffic', { params: { timeRange } }),
  getTrending: () => api.get('/analytics/trending'),
  getCategories: () => api.get('/analytics/categories'),
};

export default api;
