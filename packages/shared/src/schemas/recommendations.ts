import { z } from 'zod';

export const RecommendationSearchSchema = z.object({
  category: z.string().optional(),
  spendAmount: z.number().positive().optional(),
  limit: z.coerce.number().min(1).max(20).default(10),
});

export const TravelQuerySchema = z.object({
  destination: z.string().min(1).max(200),
  departureDate: z.string().date().optional(),
  estimatedCost: z.number().positive().optional(),
});

export type RecommendationSearchInput = z.infer<typeof RecommendationSearchSchema>;
export type TravelQueryInput = z.infer<typeof TravelQuerySchema>;
