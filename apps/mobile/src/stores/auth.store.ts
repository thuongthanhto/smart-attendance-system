import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Role } from '@smart-attendance/shared';
import * as authApi from '../lib/api';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  branchId: string | null;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const tokens = await authApi.login(email, password);
    await AsyncStorage.setItem('accessToken', tokens.accessToken);
    await AsyncStorage.setItem('refreshToken', tokens.refreshToken);

    const profile = await authApi.getProfile();
    set({ user: profile, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    set({ user: null, isAuthenticated: false });
  },

  initialize: async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const profile = await authApi.getProfile();
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
