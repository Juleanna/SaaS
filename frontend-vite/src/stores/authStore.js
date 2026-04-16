import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import logger from '../services/logger';

/**
 * Auth store.
 *
 * JWT токени зберігаються як httpOnly cookies на бекенді — JavaScript не має до них доступу
 * (захист від XSS). У цьому store ми тримаємо лише дані користувача, щоб синхронно знати
 * чи він увійшов. При перезавантаженні сторінки ми перевіряємо сесію через /auth/profile/.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (credentials) => {
        try {
          const response = await api.post('/auth/login/', credentials);
          const { user } = response.data;

          set({ user, isAuthenticated: true });
          return { success: true };
        } catch (error) {
          logger.error('Login error:', error.response?.data);

          let errorMessage = 'Помилка входу';
          if (error.response?.data) {
            const errorData = error.response.data;
            if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else if (Array.isArray(errorData.non_field_errors)) {
              errorMessage = errorData.non_field_errors[0];
            } else if (errorData.detail) {
              errorMessage = errorData.detail;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (Array.isArray(errorData.email)) {
              errorMessage = errorData.email[0];
            } else if (Array.isArray(errorData.password)) {
              errorMessage = errorData.password[0];
            }
          }

          return { success: false, error: errorMessage };
        }
      },

      register: async (userData) => {
        try {
          const response = await api.post('/auth/register/', userData);
          const user = response.data?.user || response.data;
          set({ user, isAuthenticated: true });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.message || 'Помилка реєстрації',
          };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout/');
        } catch (error) {
          logger.error('Logout error:', error);
        }
        get().clearAuth();
      },

      clearAuth: () => {
        set({ user: null, isAuthenticated: false });
        sessionStorage.clear();
      },

      /** Перевірити поточну сесію (наприклад після перезавантаження сторінки) */
      checkSession: async () => {
        try {
          const response = await api.get('/auth/profile/');
          set({ user: response.data, isAuthenticated: true });
          return { success: true };
        } catch {
          get().clearAuth();
          return { success: false };
        }
      },

      updateProfile: async (profileData) => {
        try {
          await api.patch('/auth/profile/', profileData);
          const profileResponse = await api.get('/auth/profile/');
          set((state) => ({ user: { ...state.user, ...profileResponse.data } }));
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.message || 'Помилка оновлення профілю',
          };
        }
      },

      changePassword: async (passwordData) => {
        try {
          await api.post('/auth/change-password/', passwordData);
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.message || 'Помилка зміни пароля',
          };
        }
      },

      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }));
      },
    }),
    {
      name: 'auth-user',
      // Зберігаємо тільки user/isAuthenticated, токени живуть у httpOnly cookies.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
