import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (credentials) => {
        try {
          const response = await api.post('/auth/login/', credentials);
          const { access, refresh, user } = response.data;
          
          set({
            user,
            token: access,
            isAuthenticated: true,
          });
          
          // Зберігаємо refresh токен безпечно
          localStorage.setItem('refreshToken', refresh);
          
          return { success: true };
        } catch (error) {
          console.error('Login error:', error.response?.data);
          
          let errorMessage = 'Помилка входу';
          
          if (error.response?.data) {
            const errorData = error.response.data;
            
            // Обробляємо різні формати помилок від Django REST Framework
            if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
              // Для ValidationError від серіалізатора
              errorMessage = errorData.non_field_errors[0];
            } else if (errorData.detail) {
              errorMessage = errorData.detail;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.email && Array.isArray(errorData.email)) {
              errorMessage = errorData.email[0];
            } else if (errorData.password && Array.isArray(errorData.password)) {
              errorMessage = errorData.password[0];
            }
          }
          
          return { 
            success: false, 
            error: errorMessage
          };
        }
      },
      
      register: async (userData) => {
        try {
          const response = await api.post('/auth/register/', userData);
          const { access, refresh, user } = response.data;
          
          set({
            user,
            token: access,
            isAuthenticated: true,
          });
          
          localStorage.setItem('refreshToken', refresh);
          
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.message || 'Помилка реєстрації' 
          };
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        
        // Очищаємо всі токени
        localStorage.removeItem('refreshToken');
        sessionStorage.clear();
      },
      
      refreshToken: async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token');
          }
          
          const response = await api.post('/auth/token/refresh/', {
            refresh: refreshToken,
          });
          
          set({
            token: response.data.access,
          });
          
          return { success: true };
        } catch (error) {
          get().logout();
          return { success: false };
        }
      },
      
      updateProfile: async (profileData) => {
        try {
          const response = await api.patch('/auth/update/', profileData);
          set({
            user: response.data,
          });
          
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.message || 'Помилка оновлення профілю' 
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
            error: error.response?.data?.message || 'Помилка зміни пароля' 
          };
        }
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
); 