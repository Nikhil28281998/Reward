import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@reward/shared';
import { clearToken, storeToken } from './api';
import { isWeb } from './platform';

// â”€â”€â”€ Synchronous token read (web only) so the very first render knows we're â”€â”€
// signed in and doesn't bounce the user to the auth stack on refresh.
const TOKEN_KEY = 'labhly_auth_token';
const initialToken = (() => {
  if (!isWeb) return null;
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
  } catch {
    return null;
  }
})();

// â”€â”€â”€ Auth Store â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  token: initialToken,
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

// â”€â”€â”€ UI Store (non-persisted ephemeral state) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface UIState {
  activeCardIndex: number;
  setActiveCardIndex: (i: number) => void;

  selectedMonth: string;
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

// â”€â”€â”€ Wealth Store (debit / bank / investment â€” local-first, persisted) â”€â”€â”€â”€â”€â”€â”€â”€

export type DebitCard = {
  id: string;
  type: 'debit';
  issuer: string;
  nickname?: string;
  last4?: string;
  bankName?: string;
  rewardsNote?: string;
};

export type BankAccount = {
  id: string;
  type: 'checking' | 'savings';
  bankName: string;
  nickname?: string;
  last4?: string;
  balance: number;
  apy?: number;
};

export type Investment = {
  id: string;
  type: 'brokerage' | 'retirement' | 'crypto';
  broker: string;
  nickname?: string;
  symbol?: string;
  shares?: number;
  value: number;
  costBasis?: number;
};

interface WealthState {
  debitCards: DebitCard[];
  bankAccounts: BankAccount[];
  investments: Investment[];
  addDebitCard: (card: Omit<DebitCard, 'id' | 'type'>) => void;
  addBankAccount: (acct: Omit<BankAccount, 'id'>) => void;
  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  removeDebitCard: (id: string) => void;
  removeBankAccount: (id: string) => void;
  removeInvestment: (id: string) => void;
}

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const webStorage = createJSONStorage(() => {
  if (isWeb && typeof window !== 'undefined') return window.localStorage;
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
});

export const useWealthStore = create<WealthState>()(
  persist(
    (set) => ({
      debitCards: [],
      bankAccounts: [],
      investments: [],
      addDebitCard: (card) =>
        set((s) => ({ debitCards: [...s.debitCards, { ...card, id: genId(), type: 'debit' }] })),
      addBankAccount: (acct) =>
        set((s) => ({ bankAccounts: [...s.bankAccounts, { ...acct, id: genId() }] })),
      addInvestment: (inv) =>
        set((s) => ({ investments: [...s.investments, { ...inv, id: genId() }] })),
      removeDebitCard: (id) => set((s) => ({ debitCards: s.debitCards.filter((c) => c.id !== id) })),
      removeBankAccount: (id) =>
        set((s) => ({ bankAccounts: s.bankAccounts.filter((a) => a.id !== id) })),
      removeInvestment: (id) =>
        set((s) => ({ investments: s.investments.filter((i) => i.id !== id) })),
    }),
    {
      name: 'labhly_wealth_v1',
      storage: webStorage,
      partialize: (s) => ({
        debitCards: s.debitCards,
        bankAccounts: s.bankAccounts,
        investments: s.investments,
      }),
    },
  ),
);
