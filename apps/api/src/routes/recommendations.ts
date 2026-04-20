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
    const body = req.body as { category?: string; amount?: number };
    const category = String(body.category ?? '');
    const amount = Number(body.amount ?? 0);
    if (!category || !Number.isFinite(amount) || amount <= 0) {
      return reply.status(400).send({ error: 'category and amount are required' });
    }

    const cards = await prisma.cardAccount.findMany({
      where: { userId: req.user.sub, isActive: true },
      include: { cardProduct: true },
    });

    const raw = rewardsService.bestCardForPurchase(cards, category, amount);
    const best = cards.find((c) => c.id === raw.bestCardId);

    if (!best) {
      return reply.send({ result: null });
    }

    const rewardCurrency = best.cardProduct.rewardCurrency;
    const rv = (best.cardProduct.redeemValues ?? []) as Array<{ centsPerPoint: number }>;
    const cpp = rv.length ? Math.max(...rv.map((r) => Number(r.centsPerPoint) || 0)) : 1;
    const estimatedReward =
      rewardCurrency === 'CASHBACK'
        ? Number(raw.bestPointsEarned ?? 0) / 100
        : Number(raw.bestPointsEarned ?? 0);

    const reasoning =
      `Earning ${raw.bestMultiplier}× on ${category} purchases, this card gives you ` +
      (rewardCurrency === 'CASHBACK'
        ? `$${estimatedReward.toFixed(2)} cashback`
        : `${Math.round(estimatedReward).toLocaleString()} ${rewardCurrency.toLowerCase()} (worth ~$${((estimatedReward * cpp) / 100).toFixed(2)})`) +
      ` on a $${amount.toFixed(0)} purchase — the highest return in your wallet.`;

    return reply.send({
      result: {
        cardAccountId: best.id,
        cardName: best.nickname ?? best.cardProduct.name,
        brand: best.cardProduct.issuer,
        last4: best.last4 ?? null,
        multiplier: raw.bestMultiplier ?? 1,
        estimatedReward,
        rewardCurrency,
        reasoning,
        alternatives: raw.alternativeCards.slice(0, 3),
      },
    });
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
