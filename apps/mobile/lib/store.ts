import { create } from 'zustand';
import type { User } from '@reward/shared';
import { clearToken, storeToken } from './api';

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  isOnboarded: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setOnboarded: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isOnboarded: false,

  setAuth: async (user, token) => {
    await storeToken(token);
    set({ user, token });
  },

  clearAuth: async () => {
    await clearToken();
    set({ user: null, token: null, isOnboarded: false });
  },

  setUser: (user) => set({ user }),
  setOnboarded: (val) => set({ isOnboarded: val }),
}));

// ─── UI Store (non-persisted ephemeral state) ─────────────────────────────────

interface UIState {
  activeCardIndex: number;
  setActiveCardIndex: (i: number) => void;

  selectedMonth: string; // "2026-04"
  setSelectedMonth: (m: string) => void;

  assistantThreadId: string | null;
  setAssistantThreadId: (id: string | null) => void;
}

const nowMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const useUIStore = create<UIState>((set) => ({
  activeCardIndex: 0,
  setActiveCardIndex: (i) => set({ activeCardIndex: i }),

  selectedMonth: nowMonth(),
  setSelectedMonth: (m) => set({ selectedMonth: m }),

  assistantThreadId: null,
  setAssistantThreadId: (id) => set({ assistantThreadId: id }),
}));
