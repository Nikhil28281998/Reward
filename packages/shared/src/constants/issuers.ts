// ─── Card Issuers ─────────────────────────────────────────────────────────────

export const ISSUERS = [
  'American Express',
  'Bank of America',
  'Barclays',
  'Capital One',
  'Chase',
  'Citi',
  'Discover',
  'US Bank',
  'Wells Fargo',
  'HSBC',
  'Navy Federal',
  'PenFed',
  'Goldman Sachs',
  'Synchrony',
  'Bread Financial',
] as const;

export type Issuer = (typeof ISSUERS)[number];
