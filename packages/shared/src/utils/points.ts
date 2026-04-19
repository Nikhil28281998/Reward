import type { RewardCurrency } from '../types/card';
import { REWARD_CURRENCIES } from '../constants/rewardCurrencies';

// ─── Points / Miles Utilities ─────────────────────────────────────────────────

/**
 * Format a raw point/mile balance as a human-readable string.
 * @example formatPoints(125000, 'UR') → "125,000 UR"
 */
export function formatPoints(amount: number, currency: RewardCurrency): string {
  const meta = REWARD_CURRENCIES[currency];
  return `${amount.toLocaleString()} ${meta.id}`;
}

/**
 * Estimate the dollar value of a point balance at the best travel redemption.
 * Returns value in dollars.
 */
export function estimateValue(
  points: number,
  currency: RewardCurrency,
  redemption: 'cashback' | 'travel' = 'travel',
): number {
  const meta = REWARD_CURRENCIES[currency];
  const centsPerPoint =
    redemption === 'travel' ? meta.travelValue : meta.defaultCashValue;
  return (points * centsPerPoint) / 100;
}

/**
 * Given a spend amount and a multiplier, calculate raw points earned.
 */
export function calculatePointsEarned(spendDollars: number, multiplier: number): number {
  return Math.floor(spendDollars * multiplier);
}
