import axios, { type AxiosInstance, type AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── API Client ───────────────────────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'reward_auth_token';

let _api: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (_api) return _api;

  _api = axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // ── Request: inject JWT
  _api.interceptors.request.use(async (cfg) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
  });

  // ── Response: surface error messages
  _api.interceptors.response.use(
    (res) => res,
    (err: AxiosError<{ error?: string }>) => {
      const message = err.response?.data?.error ?? err.message ?? 'Unknown error';
      return Promise.reject(new Error(message));
    },
  );

  return _api;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

// ─── Typed endpoint helpers ───────────────────────────────────────────────────

export const api = {
  auth: {
    signUp: (data: unknown) => getApiClient().post('/v1/auth/signup', data),
    signIn: (data: unknown) => getApiClient().post('/v1/auth/signin', data),
    me: () => getApiClient().get('/v1/auth/me'),
  },
  onboarding: {
    uploadStatement: (form: FormData) =>
      getApiClient().post('/v1/onboarding/statements/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      }),
    statementStatus: (id: string) =>
      getApiClient().get(`/v1/onboarding/statements/${id}/status`),
    confirmCard: (data: unknown) => getApiClient().post('/v1/onboarding/cards/confirm', data),
    setIncome: (data: unknown) => getApiClient().post('/v1/onboarding/income', data),
  },
  cards: {
    list: () => getApiClient().get('/v1/cards'),
    summary: () => getApiClient().get('/v1/cards/summary'),
    get: (id: string) => getApiClient().get(`/v1/cards/${id}`),
    update: (id: string, data: unknown) => getApiClient().patch(`/v1/cards/${id}`, data),
    remove: (id: string) => getApiClient().delete(`/v1/cards/${id}`),
    searchProducts: (params: Record<string, string>) =>
      getApiClient().get('/v1/cards/products/search', { params }),
  },
  ledger: {
    list: (params?: Record<string, unknown>) => getApiClient().get('/v1/ledger', { params }),
    spendSummary: (month?: string) =>
      getApiClient().get('/v1/ledger/spend-summary', { params: month ? { month } : {} }),
    addManual: (data: unknown) => getApiClient().post('/v1/ledger/transactions', data),
  },
  recommendations: {
    list: (params?: Record<string, unknown>) =>
      getApiClient().get('/v1/recommendations', { params }),
    bestCard: (data: unknown) =>
      getApiClient().post('/v1/recommendations/best-card', data),
    travel: (data: unknown) =>
      getApiClient().post('/v1/recommendations/travel', data),
    offers: (params?: Record<string, unknown>) =>
      getApiClient().get('/v1/offers', { params }),
  },
  assistant: {
    query: (data: unknown) => getApiClient().post('/v1/assistant/query', data),
  },
};
