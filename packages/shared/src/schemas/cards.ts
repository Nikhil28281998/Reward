import { z } from 'zod';

export const UpdateCardSchema = z.object({
  nickname: z.string().max(40).optional(),
  creditLimit: z.number().positive().optional(),
  statementClosingDay: z.number().min(1).max(31).optional(),
  paymentDueDay: z.number().min(1).max(31).optional(),
  rewardBalance: z.number().min(0).optional(),
});

export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;

export const CreateCardSchema = z.object({
  cardProductId: z.string().cuid(),
  last4: z.string().regex(/^\d{4}$/).optional(),
  nickname: z.string().max(40).optional(),
  creditLimit: z.number().positive().optional(),
  rewardBalance: z.number().min(0).optional(),
});

export type CreateCardInput = z.infer<typeof CreateCardSchema>;
