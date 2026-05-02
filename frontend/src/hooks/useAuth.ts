import { useState, useCallback } from 'react';
import { useUserStore } from '@stores/userStore';
import { authApi, tokenStorage } from '@services/api';
import type { LoginCredentials, RegisterData } from '../types/index';

export function useAuth() {
  const { setUser, logout: storeLogout } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials);
      if (response.success) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const loginAsGuest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.loginWithGuest();
      if (response.success) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register(data);
      if (response.success) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStorage.clear();
      storeLogout();
    }
  }, [storeLogout]);

  const checkAuth = useCallback(async () => {
    const token = tokenStorage.getToken();
    if (!token) return false;

    setIsLoading(true);
    try {
      const response = await authApi.getMe();
      if (response.success) {
        setUser(response.data);
        return true;
      }
      return false;
    } catch {
      tokenStorage.clear();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const refreshToken = useCallback(async () => {
    return authApi.refreshToken();
  }, []);

  return {
    login,
    loginAsGuest,
    register,
    logout,
    checkAuth,
    refreshToken,
    isLoading,
    error,
  };
}
