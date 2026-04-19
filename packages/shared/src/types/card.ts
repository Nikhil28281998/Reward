// ─── Card Types ───────────────────────────────────────────────────────────────

export type CardNetwork = 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Other';

export type RewardCurrency =
  | 'UR'      // Chase Ultimate Rewards
  | 'MR'      // Amex Membership Rewards
  | 'TYP'     // Citi ThankYou Points
  | 'Cash'    // Cash back (cents)
  | 'Miles'   // Generic airline miles
  | 'Points'  // Generic points
  | 'AA'      // American Airlines
  | 'UA'      // United Airlines
  | 'DL'      // Delta SkyMiles
  | 'SW'      // Southwest Rapid Rewards
  | 'WN'      // Southwest (alias)
  | 'HH'      // Hilton Honors
  | 'MR_BonvoyPoints' // Marriott Bonvoy
  | 'WoH';    // World of Hyatt

export type SpendCategory =
  | 'dining'
  | 'travel'
  | 'groceries'
  | 'gas'
  | 'streaming'
  | 'drugstore'
  | 'transit'
  | 'hotel'
  | 'airfare'
  | 'entertainment'
  | 'home_improvement'
  | 'online_shopping'
  | 'wholesale'
  | 'utilities'
  | 'healthcare'
  | 'other';

export interface CategoryRate {
  category: SpendCategory;
  multiplier: number; // e.g. 3 = 3x
}

export interface RedeemValue {
  redemptionType: 'cashback' | 'travel' | 'transfer' | 'gift_card' | 'statement_credit';
  centsPerPoint: number; // e.g. 1.5 = $0.015/point
  label: string;
}

export interface CardBenefit {
  title: string;
  description: string;
  annualValue: number | null; // estimated $ value, null if hard to quantify
  category: 'travel' | 'lounge' | 'insurance' | 'credit' | 'purchase' | 'hotel' | 'other';
}

export interface CardProduct {
  id: string;
  issuer: string;
  name: string;
  fullName: string; // e.g. "Chase Sapphire Preferred® Card"
  network: CardNetwork;
  annualFee: number;
  signupBonus: number | null;
  signupSpendReq: number | null;
  signupMonths: number | null;
  rewardCurrency: RewardCurrency;
  baseEarnRate: number;
  categoryRates: CategoryRate[];
  redeemValues: RedeemValue[];
  benefits: CardBenefit[];
  foreignTransFee: number;
  creditScoreMin: number | null;
  referralUrl: string | null; // affiliate link
  imageUrl: string | null;
  gradient: [string, string]; // card visual gradient colors
  createdAt: string;
  updatedAt: string;
}

export interface CardAccount {
  id: string;
  userId: string;
  cardProductId: string;
  cardProduct: CardProduct;
  last4: string | null;
  nickname: string | null;
  creditLimit: number | null;
  currentBalance: number;
  statementBalance: number;
  availableCredit: number | null;
  rewardBalance: number; // points/miles/cents
  utilizationPct: number | null; // 0–100
  statementClosingDay: number | null;
  paymentDueDay: number | null;
  isActive: boolean;
  openedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CardAccountSummary {
  totalCards: number;
  totalCreditLimit: number;
  totalBalance: number;
  overallUtilizationPct: number;
  totalRewardBalance: number;
  estimatedRewardValue: number; // in cents
}
