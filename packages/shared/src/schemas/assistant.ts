import { z } from 'zod';

export const AssistantQuerySchema = z.object({
  message: z.string().min(1).max(1000),
  threadId: z.string().optional(),
  cardAccountIds: z.array(z.string().cuid()).optional(),
});

export type AssistantQueryInput = z.infer<typeof AssistantQuerySchema>;
