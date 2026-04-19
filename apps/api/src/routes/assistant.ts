import type { FastifyInstance } from 'fastify';
import { AssistantQuerySchema } from '@reward/shared';
import { prisma } from '../db/client.js';
import { aiService } from '../services/ai.service.js';

export async function assistantRoutes(app: FastifyInstance) {
  // POST /v1/assistant/query
  app.post('/v1/assistant/query', { onRequest: [app.authenticate] }, async (req, reply) => {
    const body = AssistantQuerySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Validation error', issues: body.error.flatten() });
    }

    // Load user context: cards + recent spend
    const cards = await prisma.cardAccount.findMany({
      where: {
        userId: req.user.sub,
        isActive: true,
        ...(body.data.cardAccountIds?.length
          ? { id: { in: body.data.cardAccountIds } }
          : {}),
      },
      include: { cardProduct: true },
    });

    const response = await aiService.assistantQuery({
      userId: req.user.sub,
      message: body.data.message,
      threadId: body.data.threadId,
      cards,
    });

    return reply.send(response);
  });
}
