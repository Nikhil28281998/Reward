import type { CardProduct } from './card';

// ─── Recommendation Types ─────────────────────────────────────────────────────

export type RecommendationCategory =
  | 'UPGRADE'
  | 'COMPLEMENT'
  | 'REPLACE'
  | 'FIRST_CARD'
  | 'TRAVEL'
  | 'CASHBACK'
  | 'DINING'
  | 'GAS';

export interface CardRecommendation {
  id: string;
  cardProduct: CardProduct;
  matchScore: number;        // 0–100
  estimatedAnnualValue: number; // $ value after annual fee
  reasoning: string[];       // bullet points explaining why
  category: RecommendationCategory;
  isSponsored: boolean;      // must label affiliate recommendations
  referralUrl: string | null;
  expiresAt: string | null;
}

export interface BestCardForPurchase {
  category: string;
  amount: number;
  bestCardId: string;
  bestCardName: string;
  bestMultiplier: number;
  bestPointsEarned: number;
  alternativeCards: Array<{
    cardId: string;
    cardName: string;
    multiplier: number;
    pointsEarned: number;
  }>;
}

export interface TravelRecommendation {
  destination: string;
  departureDate: string | null;
  estimatedCost: number | null;
  bestCards: CardProduct[];
  transferPartners: Array<{
    partnerName: string;
    ratio: string;
    estimatedValue: number;
  }>;
  aiSummary: string;
}
