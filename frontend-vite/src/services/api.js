import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true, // httpOnly cookies надсилаються автоматично
  headers: {
    'Content-Type': 'application/json',
  },
});

// Єдине у пам'яті рішення про те, чи робимо refresh — щоб паралельні 401
// не створювали шторм refresh-запитів.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const url = originalRequest.url || '';

    // Не пробуємо рефрешити для auth-endpoints (інакше loop)
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
      } catch (refreshError) {
        // Імпортуємо store динамічно, щоб уникнути циклічного імпорту
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
export const getResults = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.results && Array.isArray(data.results)) return data.results;
  return [];
};

export default api;
