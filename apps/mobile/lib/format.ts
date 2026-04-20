// Small formatting helpers shared across screens.

const REWARD_CURRENCY_LABELS: Record<string, string> = {
  ULTIMATE_REWARDS: 'Chase Ultimate Rewards',
  MEMBERSHIP_REWARDS: 'Amex Membership Rewards',
  CAPITAL_ONE_MILES: 'Capital One miles',
  CITI_THANKYOU: 'Citi ThankYou points',
  HILTON_HONORS: 'Hilton Honors points',
  MARRIOTT_BONVOY: 'Marriott Bonvoy points',
  DELTA_SKYMILES: 'Delta SkyMiles',
  UNITED_MILEAGEPLUS: 'United MileagePlus',
  CASHBACK: 'cashback',
  POINTS: 'points',
};

export function rewardCurrencyLabel(code: string | null | undefined): string {
  if (!code) return 'points';
  const key = code.toUpperCase();
  return REWARD_CURRENCY_LABELS[key] ?? code.replace(/_/g, ' ').toLowerCase();
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

export function formatUSD(n: number): string {
  if (!Number.isFinite(n)) return '$0.00';
  const abs = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `-$${abs}` : `$${abs}`;
}

export function formatUSDCompact(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  const abs = Math.round(Math.abs(n)).toLocaleString('en-US');
  return n < 0 ? `-$${abs}` : `$${abs}`;
}

export function digitsOnly(s: string, max = 4): string {
  return s.replace(/\D+/g, '').slice(0, max);
}
