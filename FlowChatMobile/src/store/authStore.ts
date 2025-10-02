import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      await SecureStore.setItemAsync('authToken', token);
      set({ user, token, loading: false });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      const { token, user } = response.data;

      await SecureStore.setItemAsync('authToken', token);
      set({ user, token, loading: false });
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('authToken');
    set({ user: null, token: null });
  },

  loadAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const response = await api.get('/auth/me');
        set({ user: response.data.user, token, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Load auth error:', error);
      set({ loading: false });
    }
  },
}));
