import type { RewardCurrency } from '../types/card';

// ─── Reward Currency Metadata ─────────────────────────────────────────────────

export interface RewardCurrencyMeta {
  id: RewardCurrency;
  label: string;
  issuer: string;
  defaultCashValue: number; // cents per point at baseline redemption
  travelValue: number;      // cents per point at best travel redemption
  unit: string;             // "point" | "mile"
}

export const REWARD_CURRENCIES: Record<RewardCurrency, RewardCurrencyMeta> = {
  UR: {
    id: 'UR', label: 'Ultimate Rewards', issuer: 'Chase',
    defaultCashValue: 1.0, travelValue: 1.5, unit: 'point',
  },
  MR: {
    id: 'MR', label: 'Membership Rewards', issuer: 'Amex',
    defaultCashValue: 0.6, travelValue: 2.0, unit: 'point',
  },
  TYP: {
    id: 'TYP', label: 'ThankYou Points', issuer: 'Citi',
    defaultCashValue: 1.0, travelValue: 1.6, unit: 'point',
  },
  Cash: {
    id: 'Cash', label: 'Cash Back', issuer: 'Various',
    defaultCashValue: 1.0, travelValue: 1.0, unit: 'cent',
  },
  Miles: {
    id: 'Miles', label: 'Miles', issuer: 'Various',
    defaultCashValue: 1.0, travelValue: 1.4, unit: 'mile',
  },
  Points: {
    id: 'Points', label: 'Points', issuer: 'Various',
    defaultCashValue: 1.0, travelValue: 1.2, unit: 'point',
  },
  AA: {
    id: 'AA', label: 'AAdvantage Miles', issuer: 'American Airlines',
    defaultCashValue: 0.7, travelValue: 1.8, unit: 'mile',
  },
  UA: {
    id: 'UA', label: 'MileagePlus Miles', issuer: 'United Airlines',
    defaultCashValue: 0.7, travelValue: 1.5, unit: 'mile',
  },
  DL: {
    id: 'DL', label: 'SkyMiles', issuer: 'Delta',
    defaultCashValue: 0.6, travelValue: 1.2, unit: 'mile',
  },
  SW: {
    id: 'SW', label: 'Rapid Rewards', issuer: 'Southwest',
    defaultCashValue: 1.5, travelValue: 1.5, unit: 'point',
  },
  WN: {
    id: 'WN', label: 'Rapid Rewards', issuer: 'Southwest',
    defaultCashValue: 1.5, travelValue: 1.5, unit: 'point',
  },
  HH: {
    id: 'HH', label: 'Hilton Honors', issuer: 'Hilton',
    defaultCashValue: 0.5, travelValue: 0.6, unit: 'point',
  },
  MR_BonvoyPoints: {
    id: 'MR_BonvoyPoints', label: 'Bonvoy Points', issuer: 'Marriott',
    defaultCashValue: 0.7, travelValue: 0.9, unit: 'point',
  },
  WoH: {
    id: 'WoH', label: 'World of Hyatt', issuer: 'Hyatt',
    defaultCashValue: 1.7, travelValue: 2.3, unit: 'point',
  },
};
