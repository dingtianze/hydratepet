/**
 * Auth Store - 认证状态管理
 *
 * 该文件是 userStore 的专门用于认证相关功能的出口
 * 提供登录、注册、游客模式、登出等功能
 *
 * 使用 Zustand 进行状态管理，支持持久化存储
 *
 * @example
 * ```tsx
 * import { useAuthStore } from '@stores/authStore';
 *
 * function MyComponent() {
 *   const { isAuthenticated, login, logout } = useAuthStore();
 *   // ...
 * }
 * ```
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, tokenStorage } from '@services/api';
import type {
  User,
  UserStats,
  AppSettings,
  Theme,
  LoginCredentials,
  RegisterData,
} from '../types/index';

/**
 * 认证状态接口定义
 */
interface AuthState {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;

  // User data
  stats: UserStats | null;
  settings: AppSettings;

  // Basic Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setStats: (stats: UserStats | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Auth Actions
  /**
   * 手机号登录
   * @param credentials - 登录凭证（手机号和验证码）
   */
  login: (credentials: LoginCredentials) => Promise<void>;

  /**
   * 游客模式登录
   * 创建临时用户，数据仅保存在本地
   */
  loginAsGuest: () => Promise<void>;

  /**
   * 用户注册
   * @param data - 注册信息
   */
  register: (data: RegisterData) => Promise<void>;

  /**
   * 登出
   */
  logout: () => Promise<void>;

  /**
   * 检查登录状态
   * @returns 是否已登录
   */
  checkAuth: () => Promise<boolean>;

  /**
   * 刷新用户信息
   */
  refreshUser: () => Promise<void>;

  // Profile Actions
  /**
   * 更新用户资料
   * @param data - 要更新的字段
   */
  updateProfile: (data: Partial<User>) => Promise<void>;

  /**
   * 更新每日饮水目标
   * @param goal - 目标饮水量（ml）
   */
  updateDailyGoal: (goal: number) => void;

  /**
   * 清除认证信息
   */
  clearAuth: () => void;
}

/**
 * 默认应用设置
 */
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

/**
 * 认证状态存储
 *
 * 使用 Zustand 创建，包含 persist 中间件实现数据持久化
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
            throw new Error(response.message || '登录失败');
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
            throw new Error(response.message || '游客登录失败');
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
            throw new Error(response.message || '注册失败');
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
          const { user } = get();
          if (!user) return;

          const response = await authApi.getMe();
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
          // Import userApi dynamically to avoid circular dependency
          const { userApi } = await import('@services/api');
          const response = await userApi.updateProfile(data);
          if (response.success) {
            set({ user: response.data });
          } else {
            throw new Error(response.message || '更新失败');
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
      name: 'hydratepet-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        settings: state.settings,
      }),
    }
  )
);

/**
 * 保持向下兼容：同时导出 useUserStore 别名
 * 这样既可以用 useAuthStore 也可以用 useUserStore
 */
export const useUserStore = useAuthStore;

/**
 * Auth store 选择器 Hook
 * 提供精细化的状态访问
 */
export const useAuth = () => {
  const {
    isAuthenticated,
    isLoading,
    user,
    login,
    loginAsGuest,
    register,
    logout,
    checkAuth,
  } = useAuthStore();

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    loginAsGuest,
    register,
    logout,
    checkAuth,
    isGuest: user?.isGuest ?? false,
    userId: user?.id,
    nickname: user?.nickname,
    dailyGoal: user?.dailyGoal ?? 1500,
  };
};

/**
 * 用户资料 Hook
 */
export const useUserProfile = () => {
  const { user, updateProfile, refreshUser } = useAuthStore();

  return {
    user,
    updateProfile,
    refreshUser,
    weight: user?.weight,
    gender: user?.gender,
    workStartTime: user?.workStartTime,
    workEndTime: user?.workEndTime,
  };
};

/**
 * 应用设置 Hook
 */
export const useAppSettings = () => {
  const { settings, updateSettings } = useAuthStore();

  return {
    settings,
    updateSettings,
    theme: settings.theme,
    language: settings.language,
    notifications: settings.notifications,
  };
};
