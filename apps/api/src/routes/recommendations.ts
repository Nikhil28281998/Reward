import type { FastifyInstance } from 'fastify';
import { RecommendationSearchSchema, TravelQuerySchema } from '@reward/shared';
import { prisma } from '../db/client.js';
import { rewardsService } from '../services/rewards.service.js';
import { aiService } from '../services/ai.service.js';

export async function recommendationRoutes(app: FastifyInstance) {
  // GET /v1/recommendations  — personalized card recommendations
  app.get('/v1/recommendations', { onRequest: [app.authenticate] }, async (req, reply) => {
    const query = RecommendationSearchSchema.safeParse(req.query);
    if (!query.success) return reply.status(400).send({ error: 'Validation error' });

    // Fetch user's existing cards to exclude from recommendations
    const ownedCardProductIds = (
      await prisma.cardAccount.findMany({
        where: { userId: req.user.sub, isActive: true },
        select: { cardProductId: true },
      })
    ).map((c) => c.cardProductId);

    // Get spend profile
    const spendProfile = await rewardsService.getSpendProfile(req.user.sub);

    // Score all card products the user doesn't own
    const allProducts = await prisma.cardProduct.findMany({
      where: { id: { notIn: ownedCardProductIds } },
    });

    const scored = rewardsService.scoreCards(allProducts, spendProfile);
    const top = scored.slice(0, query.data.limit);

    return reply.send({ recommendations: top });
  });

  // POST /v1/recommendations/best-card  — "which card for this purchase?"
  app.post('/v1/recommendations/best-card', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { category, amount } = req.body as { category: string; amount: number };

    const cards = await prisma.cardAccount.findMany({
      where: { userId: req.user.sub, isActive: true },
      include: { cardProduct: true },
    });

    const result = rewardsService.bestCardForPurchase(cards, category, amount);
    return reply.send({ result });
  });

  // POST /v1/recommendations/travel  — travel query
  app.post('/v1/recommendations/travel', { onRequest: [app.authenticate] }, async (req, reply) => {
    const body = TravelQuerySchema.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'Validation error' });

    const cards = await prisma.cardAccount.findMany({
      where: { userId: req.user.sub, isActive: true },
      include: { cardProduct: true },
    });

    const result = await aiService.travelQuery(body.data, cards);
    return reply.send({ result });
  });

  // GET /v1/offers  — active cashback offers
  app.get('/v1/offers', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { category } = req.query as { category?: string };

    const userCardProductIds = (
      await prisma.cardAccount.findMany({
        where: { userId: req.user.sub, isActive: true },
        select: { cardProductId: true },
      })
    ).map((c) => c.cardProductId);

    const offers = await prisma.offer.findMany({
      where: {
        isActive: true,
        OR: [
          { cardProductId: null },
          { cardProductId: { in: userCardProductIds } },
        ],
        ...(category ? { merchantCategory: category } : {}),
      },
      orderBy: { value: 'desc' },
      take: 50,
    });

    return reply.send({ offers });
  });
}
