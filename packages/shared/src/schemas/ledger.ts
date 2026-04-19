import { z } from 'zod';

export const LedgerQuerySchema = z.object({
  cardAccountId: z.string().cuid().optional(),
  category: z.string().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  cursor: z.string().optional(),
});

export const ManualTransactionSchema = z.object({
  cardAccountId: z.string().cuid(),
  date: z.string().date(),
  description: z.string().min(1).max(200),
  amount: z.number(),
  category: z.string(),
  merchantName: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export type LedgerQuery = z.infer<typeof LedgerQuerySchema>;
export type ManualTransactionInput = z.infer<typeof ManualTransactionSchema>;
