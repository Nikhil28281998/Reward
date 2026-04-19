import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../lib/store';
import { api, clearToken, getStoredToken } from '../lib/api';
import type { User } from '@reward/shared';

// ─── useAuth hook ─────────────────────────────────────────────────────────────

export function useAuth() {
  const { user, token, setAuth, clearAuth, setUser } = useAuthStore();

  const { isLoading: meLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const stored = await getStoredToken();
      if (!stored) return null;
      const res = await api.auth.me();
      setUser(res.data.user as User);
      return res.data.user as User;
    },
    enabled: !user, // only fetch if no user in memory
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await api.auth.signIn({ email, password });
      const { user: u, token: t } = res.data as { user: User; token: string };
      await setAuth(u, t);
      return u;
    },
    [setAuth],
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const res = await api.auth.signUp({ email, password, fullName });
      const { user: u, token: t } = res.data as { user: User; token: string };
      await setAuth(u, t);
      return u;
    },
    [setAuth],
  );

  const signOut = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  return {
    user,
    token,
    isAuthenticated: !!user || !!token,
    isLoading: meLoading,
    signIn,
    signUp,
    signOut,
  };
}
