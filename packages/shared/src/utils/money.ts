// ─── Money Utilities ──────────────────────────────────────────────────────────

/**
 * Format a number as a USD currency string.
 * @example formatUSD(1234.5) → "$1,234.50"
 */
export function formatUSD(cents: number, options?: { compact?: boolean }): string {
  const dollars = cents;
  if (options?.compact && Math.abs(dollars) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(dollars);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Format utilization as a percentage string with color coding threshold info.
 */
export function formatUtilization(pct: number): string {
  return `${Math.round(pct)}%`;
}

/**
 * Determine utilization health: good (<10%), ok (<30%), warn (<50%), bad (>=50%).
 */
export type UtilizationHealth = 'good' | 'ok' | 'warn' | 'bad';
export function utilizationHealth(pct: number): UtilizationHealth {
  if (pct < 10) return 'good';
  if (pct < 30) return 'ok';
  if (pct < 50) return 'warn';
  return 'bad';
}
