import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CardRecommendation, Offer, TravelRecommendation } from '@reward/shared';

// ─── useRecommendations hook ──────────────────────────────────────────────────

export function useRecommendations() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const res = await api.recommendations.list({ limit: 10 });
      return res.data.recommendations as CardRecommendation[];
    },
    staleTime: 5 * 60 * 1000, // 5 min — recommendations don't change often
  });

  return { recommendations: data, isLoading, error };
}

export function useOffers() {
  const { data, isLoading } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const res = await api.recommendations.offers();
      return res.data.offers as Offer[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return { offers: data, isLoading };
}

export function useBestCardQuery() {
  return useMutation({
    mutationFn: async ({ category, amount }: { category: string; amount: number }) => {
      const res = await api.recommendations.bestCard({ category, amount });
      return res.data as { cardAccount: import('@reward/shared').CardAccount; multiplier: number; pointsEarned: number; cashValue: number };
    },
  });
}

export function useTravelQuery() {
  return useMutation({
    mutationFn: (data: { destination: string; departureDate?: string; estimatedCost?: number }) =>
      api.recommendations.travel(data),
    select: (res: { data: { result: TravelRecommendation } }) => res.data.result,
  });
}
