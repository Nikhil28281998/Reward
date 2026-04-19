import OpenAI from 'openai';
import type { CardAccount, CardProduct } from '@prisma/client';
import type { TravelQueryInput } from '@reward/shared';
import { config } from '../config.js';

type CardWithProduct = CardAccount & { cardProduct: CardProduct };

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

// ─── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Reward Assistant — a concise, expert credit card rewards advisor.

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
    const cardContext = params.cards
      .map(
        (c) =>
          `• ${c.cardProduct.fullName} (last4: ${c.last4 ?? '??'}) | ` +
          `Rewards: ${c.cardProduct.rewardCurrency} | ` +
          `Balance: $${Number(c.currentBalance).toFixed(2)} | ` +
          `Points: ${c.rewardBalance.toLocaleString()}`,
      )
      .join('\n');

    const userContext = `User's cards:\n${cardContext || '(no cards on file)'}`;

    const completion = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      max_tokens: 400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: userContext },
        { role: 'user', content: params.message },
      ],
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.';

    const suggestedFollowUps = this.generateFollowUps(params.message);

    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content,
        cardReferences: [],
        createdAt: new Date().toISOString(),
      },
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
