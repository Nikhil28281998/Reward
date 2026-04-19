import { z } from 'zod';

export const IncomeProfileSchema = z.object({
  annualIncome: z.number().min(0).max(100_000_000),
  filingStatus: z.enum(['SINGLE', 'MARRIED_JOINT', 'MARRIED_SEPARATE', 'HEAD_OF_HOUSEHOLD']),
  state: z.string().length(2).optional(),
});

export const CardConfirmSchema = z.object({
  statementId: z.string().cuid(),
  cardProductId: z.string().cuid(),
  last4: z.string().length(4).optional(),
  nickname: z.string().max(40).optional(),
  creditLimit: z.number().positive().optional(),
});

export type IncomeProfileInput = z.infer<typeof IncomeProfileSchema>;
export type CardConfirmInput = z.infer<typeof CardConfirmSchema>;
