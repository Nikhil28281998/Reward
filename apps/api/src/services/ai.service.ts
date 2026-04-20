import OpenAI from 'openai';
import type { CardAccount, CardProduct } from '@prisma/client';
import type { TravelQueryInput } from '@reward/shared';
import { config } from '../config.js';
import { prisma } from '../db/client.js';

type CardWithProduct = CardAccount & { cardProduct: CardProduct };

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  ...(config.OPENAI_BASE_URL ? { baseURL: config.OPENAI_BASE_URL } : {}),
});

// ─── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Labhly — a concise, expert credit card rewards advisor.
Labhly (from Sanskrit "labha" — gain, profit) helps users squeeze every point and cashback dollar from their wallet.

RULES (never break):
1. You ONLY advise on credit card rewards optimization, points, miles, and travel.
2. Never give investment, tax, or legal advice.
3. Never recommend taking on debt or carrying a balance.
4. Always label sponsored card suggestions as "Partner offer" if applicable.
5. Keep answers under 200 words. Use bullet points.
6. For math (points earned, annual fee value, utilization), defer to the deterministic data provided — do not calculate yourself.
7. If asked about anything outside rewards/travel, reply: "I can only help with credit card rewards and travel planning."`;

class AiService {
  /**
   * Handle a natural-language assistant query with user card context.
   */
  async assistantQuery(params: {
    userId: string;
    message: string;
    threadId: string | undefined;
    cards: CardWithProduct[];
  }) {
    // ── Build rich user context: cards + category rates + recent spend
    const cardContext = params.cards
      .map((c) => {
        const rates = (c.cardProduct.categoryRates ?? []) as Array<{ category: string; multiplier: number }>;
        const topRates = rates
          .slice()
          .sort((a, b) => Number(b.multiplier) - Number(a.multiplier))
          .slice(0, 4)
          .map((r) => `${r.category} ${r.multiplier}x`)
          .join(', ');
        return (
          `• ${c.cardProduct.fullName} (•••${c.last4 ?? '????'}) — ` +
          `${c.cardProduct.rewardCurrency} · ${c.rewardBalance.toLocaleString()} pts · ` +
          `balance $${Number(c.currentBalance).toFixed(2)} · best: ${topRates || 'flat 1x'}`
        );
      })
      .join('\n');

    // Recent spend by category (last 60 days)
    const since = new Date();
    since.setDate(since.getDate() - 60);
    const spendRows = await prisma.transactionCanonical.groupBy({
      by: ['category'],
      where: { userId: params.userId, type: 'PURCHASE', postedAt: { gte: since } },
      _sum: { amount: true },
    }).catch(() => [] as Array<{ category: string; _sum: { amount: unknown } }>);

    const topSpend = spendRows
      .map((r) => ({ cat: r.category, amt: Number((r._sum as { amount: unknown }).amount ?? 0) }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 5)
      .map((r) => `${r.cat} $${r.amt.toFixed(0)}`)
      .join(', ');

    const totalPts = params.cards.reduce((s, c) => s + (c.rewardBalance ?? 0), 0);
    const totalLimit = params.cards.reduce((s, c) => s + Number(c.creditLimit ?? 0), 0);
    const totalBal = params.cards.reduce((s, c) => s + Number(c.currentBalance), 0);
    const util = totalLimit > 0 ? Math.round((totalBal / totalLimit) * 100) : 0;

    const userContext =
      `USER WALLET:\n${cardContext || '(no cards yet — suggest adding one from our catalog)'}\n\n` +
      `WALLET TOTALS: ${totalPts.toLocaleString()} pts · utilization ${util}%\n` +
      `LAST 60D SPEND: ${topSpend || '(no recent transactions)'}`;

    const completion = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      max_tokens: 420,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: userContext },
        { role: 'user', content: params.message },
      ],
      temperature: 0.4,
    });

    const answer =
      completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.';
    const suggestedFollowUps = this.generateFollowUps(params.message);

    return {
      answer,
      threadId: params.threadId ?? crypto.randomUUID(),
      suggestedFollowUps,
    };
  }

  /**
   * Generate a travel query response with card-specific recommendations.
   */
  async travelQuery(query: TravelQueryInput, cards: CardWithProduct[]) {
    const cardSummary = cards
      .map((c) => `${c.cardProduct.fullName}: ${c.cardProduct.rewardCurrency} (${c.rewardBalance.toLocaleString()} pts)`)
      .join(', ');

    const prompt = `The user wants to travel to ${query.destination}${
      query.departureDate ? ` on ${query.departureDate}` : ''
    }${
      query.estimatedCost ? ` with an estimated budget of $${query.estimatedCost}` : ''
    }. Their cards: ${cardSummary || 'none'}. Recommend how to maximize rewards for this trip in under 150 words.`;

    const completion = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    return {
      destination: query.destination,
      aiSummary: completion.choices[0]?.message?.content ?? '',
      bestCards: cards.slice(0, 3).map((c) => c.cardProduct),
    };
  }

  private generateFollowUps(message: string): string[] {
    const lower = message.toLowerCase();
    if (lower.includes('travel') || lower.includes('fly') || lower.includes('hotel')) {
      return [
        'Which cards transfer to airline partners?',
        'How do I use my points for flights?',
        'What is the best hotel card for Hyatt?',
      ];
    }
    if (lower.includes('dining') || lower.includes('restaurant')) {
      return [
        'Which card gives the most on restaurants?',
        'Do any cards give 4x on dining?',
      ];
    }
    return [
      'Which card should I use for groceries?',
      'How do I maximize my welcome bonus?',
      'What cards have no foreign transaction fees?',
    ];
  }
}

export const aiService = new AiService();
