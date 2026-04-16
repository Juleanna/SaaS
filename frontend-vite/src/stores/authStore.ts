import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import logger from '../services/logger';
import type { User } from '../types/models';

export interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<LoginResult>;
  register: (userData: Record<string, unknown>) => Promise<LoginResult>;
  logout: () => Promise<void>;
  clearAuth: () => void;
  checkSession: () => Promise<{ success: boolean }>;
  updateProfile: (profileData: Partial<User>) => Promise<LoginResult>;
  changePassword: (passwordData: Record<string, string>) => Promise<LoginResult>;
  updateUser: (userData: Partial<User>) => void;
}

const errorFromResponse = (errorData: unknown): string => {
  if (!errorData) return 'Помилка входу';
  if (typeof errorData === 'string') return errorData;
  const data = errorData as Record<string, unknown>;
  if (Array.isArray(data.non_field_errors)) return String(data.non_field_errors[0]);
  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);
  if (Array.isArray(data.email)) return String(data.email[0]);
  if (Array.isArray(data.password)) return String(data.password[0]);
  return 'Помилка входу';
};

/**
 * Auth store. JWT — у httpOnly cookies; тут лише user.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (credentials) => {
        try {
          const response = await api.post('/auth/login/', credentials);
          const user = (response.data as { user: User }).user;
          set({ user, isAuthenticated: true });
          return { success: true };
        } catch (error: unknown) {
          const responseData = (error as { response?: { data?: unknown } })?.response?.data;
          logger.error('Login error:', responseData);
          return { success: false, error: errorFromResponse(responseData) };
        }
      },

      register: async (userData) => {
        try {
          const response = await api.post('/auth/register/', userData);
          const user = (response.data as { user?: User })?.user || (response.data as User);
          set({ user, isAuthenticated: true });
          return { success: true };
        } catch (error: unknown) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
          return { success: false, error: message || 'Помилка реєстрації' };
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

      checkSession: async () => {
        try {
          const response = await api.get('/auth/profile/');
          set({ user: response.data as User, isAuthenticated: true });
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
          set((state) => ({ user: { ...state.user, ...(profileResponse.data as User) } }));
          return { success: true };
        } catch (error: unknown) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
          return { success: false, error: message || 'Помилка оновлення профілю' };
        }
      },

      changePassword: async (passwordData) => {
        try {
          await api.post('/auth/change-password/', passwordData);
          return { success: true };
        } catch (error: unknown) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
          return { success: false, error: message || 'Помилка зміни пароля' };
        }
      },

      updateUser: (userData) => {
        set((state) => ({ user: state.user ? { ...state.user, ...userData } : (userData as User) }));
      },
    }),
    {
      name: 'auth-user',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
