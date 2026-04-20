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

export type ManualCreditCard = {
  id: string;
  type: 'credit-manual';
  issuer: string;
  name: string;
  nickname?: string;
  last4?: string;
  creditLimit?: number;
  annualFee?: number;
  currentBalance?: number;
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
  manualCreditCards: ManualCreditCard[];
  addDebitCard: (card: Omit<DebitCard, 'id' | 'type'>) => void;
  addBankAccount: (acct: Omit<BankAccount, 'id'>) => void;
  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  addManualCreditCard: (card: Omit<ManualCreditCard, 'id' | 'type'>) => void;
  removeDebitCard: (id: string) => void;
  removeBankAccount: (id: string) => void;
  removeInvestment: (id: string) => void;
  removeManualCreditCard: (id: string) => void;
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
      manualCreditCards: [],
      addDebitCard: (card) =>
        set((s) => ({ debitCards: [...s.debitCards, { ...card, id: genId(), type: 'debit' }] })),
      addBankAccount: (acct) =>
        set((s) => ({ bankAccounts: [...s.bankAccounts, { ...acct, id: genId() }] })),
      addInvestment: (inv) =>
        set((s) => ({ investments: [...s.investments, { ...inv, id: genId() }] })),
      addManualCreditCard: (card) =>
        set((s) => ({
          manualCreditCards: [
            ...s.manualCreditCards,
            { ...card, id: genId(), type: 'credit-manual' },
          ],
        })),
      removeDebitCard: (id) => set((s) => ({ debitCards: s.debitCards.filter((c) => c.id !== id) })),
      removeBankAccount: (id) =>
        set((s) => ({ bankAccounts: s.bankAccounts.filter((a) => a.id !== id) })),
      removeInvestment: (id) =>
        set((s) => ({ investments: s.investments.filter((i) => i.id !== id) })),
      removeManualCreditCard: (id) =>
        set((s) => ({ manualCreditCards: s.manualCreditCards.filter((c) => c.id !== id) })),
    }),
    {
      name: 'labhly_wealth_v1',
      storage: webStorage,
      partialize: (s) => ({
        debitCards: s.debitCards,
        bankAccounts: s.bankAccounts,
        investments: s.investments,
        manualCreditCards: s.manualCreditCards,
      }),
    },
  ),
);

// ─── Plans Store (adopted financial frameworks — persisted) ─────────────────

export type AdoptedPlan = {
  id: string;
  templateId: string;       // matches Template.id in planning.tsx
  adoptedAt: number;
  params?: Record<string, number>; // e.g. { monthlyIncome: 5000, goal: 3000 }
};

interface PlansState {
  monthlyIncome: number;    // 0 means "not set yet"
  adoptedPlans: AdoptedPlan[];
  setMonthlyIncome: (v: number) => void;
  adoptPlan: (templateId: string, params?: Record<string, number>) => void;
  removePlan: (id: string) => void;
  isAdopted: (templateId: string) => boolean;
}

export const usePlansStore = create<PlansState>()(
  persist(
    (set, get) => ({
      monthlyIncome: 0,
      adoptedPlans: [],
      setMonthlyIncome: (v) => set({ monthlyIncome: Math.max(0, v) }),
      adoptPlan: (templateId, params) =>
        set((s) => {
          // toggle: if already adopted, do nothing (removal uses removePlan)
          if (s.adoptedPlans.some((p) => p.templateId === templateId)) return s;
          return {
            adoptedPlans: [
              ...s.adoptedPlans,
              { id: genId(), templateId, adoptedAt: Date.now(), params },
            ],
          };
        }),
      removePlan: (id) =>
        set((s) => ({ adoptedPlans: s.adoptedPlans.filter((p) => p.id !== id && p.templateId !== id) })),
      isAdopted: (templateId) => get().adoptedPlans.some((p) => p.templateId === templateId),
    }),
    {
      name: 'labhly_plans_v1',
      storage: webStorage,
      partialize: (s) => ({ monthlyIncome: s.monthlyIncome, adoptedPlans: s.adoptedPlans }),
    },
  ),
);

// ─── Premium Store (AI gating: $4.99/mo regular, $0.99/mo promo) ────────────

export const PREMIUM_PRICE_REGULAR_CENTS = 499;
export const PREMIUM_PRICE_PROMO_CENTS = 99;

type PremiumTier = 'free' | 'premium';

interface PremiumState {
  tier: PremiumTier;
  promoEligible: boolean; // true during launch window
  activate: () => void; // simulates purchase for MVP
  cancel: () => void;
  isPremium: () => boolean;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      promoEligible: true,
      activate: () => set({ tier: 'premium' }),
      cancel: () => set({ tier: 'free' }),
      isPremium: () => get().tier === 'premium',
    }),
    {
      name: 'labhly_premium_v1',
      storage: webStorage,
      partialize: (s) => ({ tier: s.tier, promoEligible: s.promoEligible }),
    },
  ),
);
