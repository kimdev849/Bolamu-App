import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import type { User } from '../types/user';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { user, tokens } = response.data.data;
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    set({ user: user as unknown as User, token: tokens.accessToken, refreshToken: tokens.refreshToken, isAuthenticated: true });
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (token && userStr) {
        set({ user: JSON.parse(userStr), token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setUser: (user: User) => {
    set({ user });
    AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },
}));

