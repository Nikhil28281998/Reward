import type { FastifyInstance } from 'fastify';
import { LedgerQuerySchema, ManualTransactionSchema } from '@reward/shared';
import { CATEGORIES } from '@reward/shared';
import { prisma } from '../db/client.js';

export async function ledgerRoutes(app: FastifyInstance) {
  // GET /v1/ledger  — paginated transaction list
  app.get('/v1/ledger', { onRequest: [app.authenticate] }, async (req, reply) => {
    const query = LedgerQuerySchema.safeParse(req.query);
    if (!query.success) return reply.status(400).send({ error: 'Validation error' });

    const { cardAccountId, category, startDate, endDate, limit, cursor } = query.data;

    // Verify cardAccount belongs to user if specified
    if (cardAccountId) {
      const owned = await prisma.cardAccount.findFirst({
        where: { id: cardAccountId, userId: req.user.sub },
        select: { id: true },
      });
      if (!owned) return reply.status(403).send({ error: 'Forbidden' });
    }

    // Resolve all card account IDs for this user
    const userCardIds = cardAccountId
      ? [cardAccountId]
      : (
          await prisma.cardAccount.findMany({
            where: { userId: req.user.sub, isActive: true },
            select: { id: true },
          })
        ).map((c) => c.id);

    const transactions = await prisma.transactionCanonical.findMany({
      where: {
        cardAccountId: { in: userCardIds },
        ...(category ? { category } : {}),
        ...(startDate ? { date: { gte: new Date(startDate) } } : {}),
        ...(endDate ? { date: { lte: new Date(endDate) } } : {}),
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { date: 'desc' },
      take: limit + 1,
      include: {
        cardAccount: {
          select: {
            id: true,
            last4: true,
            nickname: true,
            cardProduct: { select: { id: true, name: true, issuer: true, gradient: true } },
          },
        },
      },
    });

    const hasMore = transactions.length > limit;
    const results = hasMore ? transactions.slice(0, limit) : transactions;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    return reply.send({ transactions: results, nextCursor, hasMore });
  });

  // GET /v1/ledger/spend-summary  — category breakdown for current month
  app.get('/v1/ledger/spend-summary', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { month } = req.query as { month?: string }; // "2026-04"
    const now = new Date();
    const targetMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [year, mo] = targetMonth.split('-').map(Number);
    const startDate = new Date(year, mo - 1, 1);
    const endDate = new Date(year, mo, 0, 23, 59, 59);

    const userCardIds = (
      await prisma.cardAccount.findMany({
        where: { userId: req.user.sub, isActive: true },
        select: { id: true },
      })
    ).map((c) => c.id);

    const raw = await prisma.transactionCanonical.groupBy({
      by: ['category'],
      where: {
        cardAccountId: { in: userCardIds },
        date: { gte: startDate, lte: endDate },
        isCredit: false,
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const total = raw.reduce((s, r) => s + Number(r._sum.amount ?? 0), 0);
    const categories = raw
      .map((r) => ({
        category: r.category,
        totalAmount: Number(r._sum.amount ?? 0),
        transactionCount: r._count.id,
        pct: total > 0 ? Math.round((Number(r._sum.amount ?? 0) / total) * 100) : 0,
        meta: CATEGORIES[r.category as keyof typeof CATEGORIES] ?? null,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return reply.send({ month: targetMonth, totalSpend: total, categories });
  });

  // POST /v1/ledger/transactions  — manual transaction entry
  app.post('/v1/ledger/transactions', { onRequest: [app.authenticate] }, async (req, reply) => {
    const body = ManualTransactionSchema.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'Validation error' });

    // Verify card ownership
    const card = await prisma.cardAccount.findFirst({
      where: { id: body.data.cardAccountId, userId: req.user.sub },
    });
    if (!card) return reply.status(403).send({ error: 'Forbidden' });

    const tx = await prisma.transactionCanonical.create({
      data: {
        cardAccountId: body.data.cardAccountId,
        date: new Date(body.data.date),
        description: body.data.description,
        amount: body.data.amount,
        category: body.data.category,
        merchantName: body.data.merchantName ?? null,
        notes: body.data.notes ?? null,
        isCredit: body.data.amount < 0,
      },
    });

    return reply.status(201).send({ transaction: tx });
  });
}
