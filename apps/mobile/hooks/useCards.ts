import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CardAccount, CardAccountSummary } from '@reward/shared';

// ─── useCards hook ────────────────────────────────────────────────────────────

export function useCards() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const res = await api.cards.list();
      return res.data.cards as CardAccount[];
    },
    staleTime: 2 * 60 * 1000, // 2 min
  });

  return { cards: data, isLoading, error, refetch };
}

export function useCardSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['cards', 'summary'],
    queryFn: async () => {
      const res = await api.cards.summary();
      return res.data.summary as CardAccountSummary;
    },
    staleTime: 2 * 60 * 1000,
  });

  return { summary: data, isLoading };
}

export function useCard(id: string) {
  return useQuery({
    queryKey: ['cards', id],
    queryFn: async () => {
      const res = await api.cards.get(id);
      return res.data.card as CardAccount;
    },
    enabled: !!id,
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.cards.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

export function useCardCatalog(query?: string) {
  return useQuery({
    queryKey: ['cards', 'catalog', query ?? ''],
    queryFn: async () => {
      const res = await api.cards.searchProducts(query ? { q: query } : undefined);
      return res.data.products as import('@reward/shared').CardProduct[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@reward/shared').CreateCardInput) =>
      api.cards.create(data).then((r) => r.data.card as CardAccount),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}
