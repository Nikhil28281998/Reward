import type { FastifyInstance } from 'fastify';
import { UpdateCardSchema } from '@reward/shared';
import { prisma } from '../db/client.js';

export async function cardRoutes(app: FastifyInstance) {
  // GET /v1/cards  — list all card accounts for the authenticated user
  app.get('/v1/cards', { onRequest: [app.authenticate] }, async (req, reply) => {
    const cards = await prisma.cardAccount.findMany({
      where: { userId: req.user.sub, isActive: true },
      include: { cardProduct: true },
      orderBy: { createdAt: 'asc' },
    });

    // Compute utilization
    const enriched = cards.map((c) => {
      const limit = Number(c.creditLimit ?? 0);
      const balance = Number(c.currentBalance);
      return {
        ...c,
        utilizationPct: limit > 0 ? Math.round((balance / limit) * 100) : null,
        currentBalance: balance,
        statementBalance: Number(c.statementBalance),
        creditLimit: limit > 0 ? limit : null,
        availableCredit: limit > 0 ? limit - balance : null,
      };
    });

    return reply.send({ cards: enriched });
  });

  // GET /v1/cards/summary
  app.get('/v1/cards/summary', { onRequest: [app.authenticate] }, async (req, reply) => {
    const cards = await prisma.cardAccount.findMany({
      where: { userId: req.user.sub, isActive: true },
      select: {
        currentBalance: true,
        creditLimit: true,
        rewardBalance: true,
        cardProduct: { select: { rewardCurrency: true, redeemValues: true } },
      },
    });

    const totalBalance = cards.reduce((s, c) => s + Number(c.currentBalance), 0);
    const totalLimit = cards.reduce((s, c) => s + Number(c.creditLimit ?? 0), 0);
    const totalPoints = cards.reduce((s, c) => s + c.rewardBalance, 0);

    // Estimate value using average 1.5 cpp (conservative mixed-portfolio estimate)
    const estimatedValue = totalPoints * 0.015;

    return reply.send({
      summary: {
        totalCards: cards.length,
        totalCreditLimit: totalLimit,
        totalBalance,
        overallUtilizationPct: totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0,
        totalRewardBalance: totalPoints,
        estimatedRewardValue: estimatedValue,
      },
    });
  });

  // GET /v1/cards/:id
  app.get('/v1/cards/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const card = await prisma.cardAccount.findFirst({
      where: { id, userId: req.user.sub },
      include: { cardProduct: true },
    });
    if (!card) return reply.status(404).send({ error: 'Card not found' });
    return reply.send({ card });
  });

  // PATCH /v1/cards/:id
  app.patch('/v1/cards/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = UpdateCardSchema.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'Validation error' });

    const existing = await prisma.cardAccount.findFirst({ where: { id, userId: req.user.sub } });
    if (!existing) return reply.status(404).send({ error: 'Card not found' });

    const updated = await prisma.cardAccount.update({
      where: { id },
      data: body.data,
    });
    return reply.send({ card: updated });
  });

  // DELETE /v1/cards/:id  (soft delete)
  app.delete('/v1/cards/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.cardAccount.findFirst({ where: { id, userId: req.user.sub } });
    if (!existing) return reply.status(404).send({ error: 'Card not found' });

    await prisma.cardAccount.update({ where: { id }, data: { isActive: false, closedAt: new Date() } });
    return reply.status(204).send();
  });

  // GET /v1/cards/products/search  — search card catalog
  app.get('/v1/cards/products/search', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { q, issuer, network } = req.query as Record<string, string | undefined>;

    const products = await prisma.cardProduct.findMany({
      where: {
        ...(q ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } },
            { issuer: { contains: q, mode: 'insensitive' } },
          ],
        } : {}),
        ...(issuer ? { issuer: { contains: issuer, mode: 'insensitive' } } : {}),
        ...(network ? { network } : {}),
      },
      orderBy: { signupBonus: 'desc' },
      take: 20,
    });

    return reply.send({ products });
  });
}
