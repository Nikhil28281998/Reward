import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUIStore } from '../lib/store';
import type { Transaction, SpendCategorySummary } from '@reward/shared';

// ─── useLedger hook ───────────────────────────────────────────────────────────

export function useLedger(cardAccountId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ledger', cardAccountId ?? 'all'],
    queryFn: async () => {
      const res = await api.ledger.list(cardAccountId ? { cardAccountId, limit: 100 } : { limit: 100 });
      return res.data.transactions as Transaction[];
    },
    staleTime: 60 * 1000, // 1 min
  });

  return { transactions: data, isLoading, error, refetch };
}

export function usePaginatedLedger(cardAccountId?: string) {
  return useInfiniteQuery({
    queryKey: ['ledger', 'paginated', cardAccountId ?? 'all'],
    queryFn: async ({ pageParam }) => {
      const res = await api.ledger.list({
        ...(cardAccountId ? { cardAccountId } : {}),
        limit: 50,
        ...(pageParam ? { cursor: pageParam } : {}),
      });
      return res.data as { transactions: Transaction[]; nextCursor: string | null; hasMore: boolean };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useSpendSummary() {
  const { selectedMonth } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['ledger', 'spend-summary', selectedMonth],
    queryFn: async () => {
      const res = await api.ledger.spendSummary(selectedMonth);
      return res.data as {
        month: string;
        totalSpend: number;
        categories: SpendCategorySummary[];
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  return { spendSummary: data, isLoading };
}
