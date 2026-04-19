import type { CardAccount, CardProduct } from '@prisma/client';
import type { SpendCategorySummary } from '@reward/shared';
import { prisma } from '../db/client.js';

type CardWithProduct = CardAccount & { cardProduct: CardProduct };

class RewardsService {
  /**
   * Build a spend-by-category profile for the last 90 days for a given user.
   * Returns only charges (not credits), grouped by category.
   */
  async getSpendProfile(userId: string): Promise<SpendCategorySummary[]> {
    const userCardIds = (
      await prisma.cardAccount.findMany({
        where: { userId, isActive: true },
        select: { id: true },
      })
    ).map((c) => c.id);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const raw = await prisma.transactionCanonical.groupBy({
      by: ['category'],
      where: {
        cardAccountId: { in: userCardIds },
        date: { gte: cutoff },
        isCredit: false,
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const total = raw.reduce((s, r) => s + Number(r._sum.amount ?? 0), 0);
    return raw.map((r) => ({
      category: r.category as SpendCategorySummary['category'],
      totalAmount: Number(r._sum.amount ?? 0),
      transactionCount: r._count.id,
      pct: total > 0 ? Math.round((Number(r._sum.amount ?? 0) / total) * 100) : 0,
      bestCardMultiplier: null,
      bestCardId: null,
    }));
  }

  /**
   * Score card products against a spend profile and return ranked list with
   * estimated annual value.
   * IMPORTANT: all math is deterministic — no AI involved.
   */
  scoreCards(
    products: CardProduct[],
    spendProfile: SpendCategorySummary[],
  ): Array<{ cardProduct: CardProduct; matchScore: number; estimatedAnnualValue: number; reasoning: string[] }> {
    // Scale spend to annualized (profile covers 90 days → multiply by ~4)
    const annualized = spendProfile.map((s) => ({ ...s, totalAmount: s.totalAmount * (365 / 90) }));
    const totalAnnualSpend = annualized.reduce((s, c) => s + c.totalAmount, 0);

    return products
      .map((p) => {
        const categoryRates = p.categoryRates as Array<{ category: string; multiplier: number }>;
        const redeemValues = p.redeemValues as Array<{ redemptionType: string; centsPerPoint: number }>;
        const bestRedeemValue = Math.max(...redeemValues.map((r) => r.centsPerPoint), 0.01);

        // Calculate gross annual reward value
        let grossValue = 0;
        const reasoning: string[] = [];

        for (const spend of annualized) {
          const catRate = categoryRates.find((cr) => cr.category === spend.category);
          const rate = catRate?.multiplier ?? Number(p.baseEarnRate);
          const pointsEarned = spend.totalAmount * rate;
          const valueFromCategory = (pointsEarned * bestRedeemValue) / 100;
          grossValue += valueFromCategory;

          if (catRate && catRate.multiplier > 1) {
            reasoning.push(
              `${catRate.multiplier}x on ${spend.category} = ~$${valueFromCategory.toFixed(0)}/yr`,
            );
          }
        }

        // Add signup bonus value if present
        const bonusValue = p.signupBonus ? (p.signupBonus * bestRedeemValue) / 100 : 0;

        const netValue = grossValue - Number(p.annualFee);
        const matchScore = Math.min(100, Math.max(0, Math.round((netValue / Math.max(totalAnnualSpend * 0.03, 1)) * 100)));

        if (p.signupBonus) {
          reasoning.unshift(`${p.signupBonus.toLocaleString()} pt welcome bonus ≈ $${bonusValue.toFixed(0)}`);
        }
        if (Number(p.annualFee) > 0) {
          reasoning.push(`$${p.annualFee} annual fee`);
        }

        return {
          cardProduct: p,
          matchScore,
          estimatedAnnualValue: Math.round(netValue),
          reasoning: reasoning.slice(0, 5),
        };
      })
      .sort((a, b) => b.estimatedAnnualValue - a.estimatedAnnualValue);
  }

  /**
   * Find the best card in a user's wallet for a specific purchase.
   * 100% deterministic — no AI.
   */
  bestCardForPurchase(
    cards: CardWithProduct[],
    category: string,
    amount: number,
  ) {
    const redeemValueFor = (p: CardProduct): number => {
      const rv = p.redeemValues as Array<{ redemptionType: string; centsPerPoint: number }>;
      return Math.max(...rv.map((r) => r.centsPerPoint), 0.01);
    };

    const scored = cards.map((c) => {
      const rates = c.cardProduct.categoryRates as Array<{ category: string; multiplier: number }>;
      const catRate = rates.find((r) => r.category === category);
      const multiplier = catRate?.multiplier ?? Number(c.cardProduct.baseEarnRate);
      const pointsEarned = Math.floor(amount * multiplier);
      const redeemValue = redeemValueFor(c.cardProduct);
      const dollarValue = (pointsEarned * redeemValue) / 100;

      return {
        cardId: c.id,
        cardName: c.nickname ?? c.cardProduct.name,
        multiplier,
        pointsEarned,
        dollarValue,
      };
    });

    scored.sort((a, b) => b.dollarValue - a.dollarValue);

    return {
      category,
      amount,
      bestCardId: scored[0]?.cardId ?? null,
      bestCardName: scored[0]?.cardName ?? null,
      bestMultiplier: scored[0]?.multiplier ?? null,
      bestPointsEarned: scored[0]?.pointsEarned ?? null,
      alternativeCards: scored.slice(1),
    };
  }
}

export const rewardsService = new RewardsService();
