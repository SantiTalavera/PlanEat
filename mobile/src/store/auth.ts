// mobile/src/store/auth.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import api, { setBearerToken } from '../api/client';

type User = Record<string, unknown> | null;

type AuthState = {
  token: string | null;
  user: User;
  loading: boolean;
  error?: string;
};

type AuthActions = {
  /** Guarda/elimina token (SecureStore + header Authorization en axios) */
  setToken: (t: string | null) => Promise<void>;
  /** Setea el usuario en memoria */
  setUser: (u: User) => void;
  /** Limpia sesión por completo */
  logout: () => Promise<void>;
  /** Login con credenciales */
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  /** Registro + login */
  signup: (email: string, password: string, name?: string) => Promise<boolean>;
};

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: false,

      /** ---- Actions ---- */
      async setToken(t) {
        if (t) {
          await SecureStore.setItemAsync('token', t);
        } else {
          await SecureStore.deleteItemAsync('token');
        }
        setBearerToken(t);
        set({ token: t });
      },

      setUser(u) {
        set({ user: u });
      },

      async logout() {
        await get().setToken(null);
        set({ user: null, error: undefined });
      },

      async loginWithCredentials(email, password) {
        try {
          set({ loading: true, error: undefined });
          const { data } = await api.post('/auth/login', { email, password });

          // Ajustá estos campos a tu respuesta real:
          const token: string =
            data?.token ?? data?.accessToken ?? data?.jwt ?? '';

          if (!token) throw new Error('Token ausente en la respuesta');

          await get().setToken(token);
          set({ user: data?.user ?? null, loading: false });
          return true;
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'Error de login' });
          return false;
        }
      },

      async signup(email, password, name) {
        try {
          set({ loading: true, error: undefined });
          const { data } = await api.post('/auth/signup', { email, password, name });

          const token: string =
            data?.token ?? data?.accessToken ?? data?.jwt ?? '';

          if (!token) throw new Error('Token ausente en la respuesta');

          await get().setToken(token);
          set({ user: data?.user ?? { email, name }, loading: false });
          return true;
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'Error de registro' });
          return false;
        }
      },
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => secureStorage),
      // Qué persiste en disco:
      partialize: (s) => ({ token: s.token, user: s.user }),
      // Al rehidratar, aplicamos el token al axios client:
      onRehydrateStorage: () => (state) => {
        setBearerToken(state?.token ?? null);
      },
    }
  )
);
