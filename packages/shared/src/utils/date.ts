// ─── Date Utilities ───────────────────────────────────────────────────────────

/**
 * Format an ISO date string for display (e.g. "Apr 19, 2026").
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format an ISO date string as short (e.g. "Apr 19").
 */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Return "2026-04" from an ISO date string.
 */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/**
 * Return a label like "This month", "Last month", or "Mar 2026".
 */
export function monthLabel(key: string): string {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  if (key === thisMonth) return 'This month';
  if (key === lastMonthKey) return 'Last month';

  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
