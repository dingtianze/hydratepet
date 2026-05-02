import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, userApi, tokenStorage } from '@services/api';
import type {
  User,
  UserStats,
  AppSettings,
  Theme,
  LoginCredentials,
  RegisterData,
} from '../types/index';

interface AuthState {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;

  // User data
  stats: UserStats | null;
  settings: AppSettings;

  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setStats: (stats: UserStats | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshUser: () => Promise<void>;

  // Profile actions
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateDailyGoal: (goal: number) => void;

  // Clear auth
  clearAuth: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'system' as Theme,
  language: 'zh',
  notifications: {
    enabled: true,
    interval: 60,
    startTime: '08:00',
    endTime: '22:00',
    soundEnabled: true,
  },
};

export const useUserStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      stats: null,
      settings: defaultSettings,

      // Basic actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setLoading: (value) => set({ isLoading: value }),
      setStats: (stats) => set({ stats }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Auth actions
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(credentials);
          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
            });
          } else {
            throw new Error(response.error || 'Login failed');
          }
        } finally {
          set({ isLoading: false });
        }
      },

      loginAsGuest: async () => {
        set({ isLoading: true });
        try {
          const response = await authApi.loginWithGuest();
          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
            });
          } else {
            throw new Error(response.error || 'Guest login failed');
          }
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
            });
          } else {
            throw new Error(response.error || 'Registration failed');
          }
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            stats: null,
          });
          tokenStorage.clear();
        }
      },

      checkAuth: async () => {
        const token = tokenStorage.getToken();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.getMe();
          if (response.success) {
            set({
              user: response.data,
              isAuthenticated: true,
              token: tokenStorage.getToken(),
            });
            return true;
          } else {
            // Token invalid, try to refresh
            const refreshed = await authApi.refreshToken();
            if (refreshed) {
              const userResponse = await authApi.getMe();
              if (userResponse.success) {
                set({
                  user: userResponse.data,
                  isAuthenticated: true,
                  token: tokenStorage.getToken(),
                });
                return true;
              }
            }
            set({ isAuthenticated: false, user: null, token: null });
            return false;
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ isAuthenticated: false, user: null, token: null });
          tokenStorage.clear();
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      refreshUser: async () => {
        try {
          const response = await userApi.getProfile();
          if (response.success) {
            set({ user: response.data });
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },

      // Profile actions
      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const response = await userApi.updateProfile(data);
          if (response.success) {
            set({ user: response.data });
          } else {
            throw new Error(response.error || 'Update failed');
          }
        } finally {
          set({ isLoading: false });
        }
      },

      updateDailyGoal: (goal) =>
        set((state) => ({
          user: state.user ? { ...state.user, dailyGoal: goal } : null,
        })),

      // Clear auth
      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          stats: null,
        });
        tokenStorage.clear();
      },
    }),
    {
      name: 'hydratepet-user-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        settings: state.settings,
      }),
    }
  )
);
