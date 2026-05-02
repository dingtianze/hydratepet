import type {
  ApiResponse,
  User,
  Pet,
  WaterRecord,
  UserStats,
  Achievement,
  LoginCredentials,
  RegisterData,
} from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token management
const TOKEN_KEY = 'hydratepet_token';
const REFRESH_TOKEN_KEY = 'hydratepet_refresh_token';

export const tokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 1
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = tokenStorage.getToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle 401 - Token expired
      if (response.status === 401 && retryCount > 0) {
        const refreshed = await authApi.refreshToken();
        if (refreshed) {
          // Retry the original request
          return request<T>(endpoint, options, retryCount - 1);
        }
      }
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await request<{ user: User; token: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );
    if (response.success && response.data.token) {
      tokenStorage.setToken(response.data.token);
      if (response.data.refreshToken) {
        tokenStorage.setRefreshToken(response.data.refreshToken);
      }
    }
    return response;
  },

  loginWithGuest: async () => {
    const response = await request<{ user: User; token: string; refreshToken: string }>(
      '/auth/guest',
      {
        method: 'POST',
      }
    );
    if (response.success && response.data.token) {
      tokenStorage.setToken(response.data.token);
      if (response.data.refreshToken) {
        tokenStorage.setRefreshToken(response.data.refreshToken);
      }
    }
    return response;
  },

  sendVerificationCode: (phone: string) =>
    request<void>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  register: async (data: RegisterData) => {
    const response = await request<{ user: User; token: string; refreshToken: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    if (response.success && response.data.token) {
      tokenStorage.setToken(response.data.token);
      if (response.data.refreshToken) {
        tokenStorage.setRefreshToken(response.data.refreshToken);
      }
    }
    return response;
  },

  logout: async () => {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } finally {
      tokenStorage.clear();
    }
  },

  getMe: () => request<User>('/auth/me'),

  refreshToken: async (): Promise<boolean> => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await request<{ token: string; refreshToken: string }>(
        '/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }
      );
      if (response.success) {
        tokenStorage.setToken(response.data.token);
        tokenStorage.setRefreshToken(response.data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  },
};

// User API
export const userApi = {
  getProfile: () => request<User>('/users/profile'),

  updateProfile: (data: Partial<User>) =>
    request<User>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateSettings: (settings: { dailyGoal?: number; notifications?: boolean }) =>
    request<User>('/users/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),

  getStats: () => request<UserStats>('/users/stats'),
};

// Pet API
export const petApi = {
  getPet: () => request<Pet>('/pets'),

  createPet: (data: { name: string; type: string }) =>
    request<Pet>('/pets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  rename: (name: string) =>
    request<Pet>('/pets/rename', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  interact: () =>
    request<{ message: string; mood: string }>('/pets/interact', {
      method: 'POST',
    }),

  feed: (amount: number) =>
    request<Pet>('/pets/feed', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  toggleSleep: () => request<Pet>('/pets/sleep', { method: 'POST' }),

  equipAccessory: (accessoryId: string) =>
    request<Pet>(`/pets/accessories/${accessoryId}`, { method: 'POST' }),

  changeTitle: (titleId: string) =>
    request<Pet>(`/pets/titles/${titleId}`, { method: 'POST' }),
};

// Water Records API
export const waterApi = {
  getRecords: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return request<WaterRecord[]>(`/water-records${query}`);
  },

  createRecord: (data: { amount: number; type: string; drinkTime: string }) =>
    request<WaterRecord>('/water-records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteRecord: (id: string) =>
    request<void>(`/water-records/${id}`, { method: 'DELETE' }),

  getTodayStats: () =>
    request<{ amount: number; goal: number; percentage: number }>('/water-records/today'),
};

// Achievements API
export const achievementApi = {
  getAchievements: () => request<Achievement[]>('/achievements'),

  checkAchievements: () =>
    request<{ unlocked: Achievement[] }>('/achievements/check', { method: 'POST' }),
};

// Titles & Badges API
export const titlesApi = {
  getAll: () =>
    request<{ current: any; unlocked: any[]; locked: any[] }>('/titles'),

  getBadges: () =>
    request<{ unlocked: any[]; locked: any[] }>('/titles/badges'),

  equip: (id: string) =>
    request<void>(`/titles/${id}/equip`, { method: 'POST' }),
};

// Share API
export const shareApi = {
  generate: () =>
    request<any>('/share/card', { method: 'POST' }),
};

// Export API
export const exportApi = {
  exportData: () =>
    request<any>('/export/data'),

  importData: (data: any) =>
    request<any>('/export/import', {
      method: 'POST',
      body: JSON.stringify({ data }),
    }),
};

// Notification API
export const notificationApi = {
  subscribe: (subscription: PushSubscription) =>
    request<void>('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    }),

  unsubscribe: () =>
    request<void>('/notifications/unsubscribe', { method: 'POST' }),

  test: () => request<void>('/notifications/test', { method: 'POST' }),
};
