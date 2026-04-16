import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import type { PaginatedResponse } from '../types/models';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Читаємо CSRF-токен із cookie (not httpOnly — це за замислом double-submit)
const readCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

// Для модифікуючих запитів додаємо X-CSRF-Token з cookie
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method || 'get').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = readCookie('csrf_token');
    if (csrf && config.headers) {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});

// Єдине у пам'яті рішення про refresh — щоб паралельні 401 не створювали шторм запитів
let refreshPromise: Promise<AxiosResponse> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = (error.config || {}) as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = originalRequest.url || '';

    const isAuthEndpoint =
      url.includes('/auth/token/') ||
      url.includes('/auth/login/') ||
      url.includes('/auth/logout/');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/token/refresh/').finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        return api(originalRequest);
      } catch {
        const { useAuthStore } = await import('../stores/authStore');
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Витягує масив даних з API-відповіді (пагінована або пласка).
 */
export const getResults = <T = unknown>(data: T[] | PaginatedResponse<T> | undefined | null): T[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
};

export default api;
