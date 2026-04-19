// ─── Offer / Cashback Types ───────────────────────────────────────────────────

export type OfferType = 'CASHBACK' | 'POINTS_BONUS' | 'STATEMENT_CREDIT' | 'GIFT_CARD';
export type ValueType = 'PERCENTAGE' | 'FIXED';

export interface Offer {
  id: string;
  cardProductId: string | null; // null = card-agnostic (e.g. shopping portal)
  merchantName: string;
  merchantLogoUrl: string | null;
  merchantCategory: string;
  offerType: OfferType;
  value: number;
  valueType: ValueType;
  displayValue: string;       // e.g. "5% back" | "$10 credit"
  activationRequired: boolean;
  activationUrl: string | null;
  termsUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CashbackPortalOffer {
  merchantName: string;
  merchantLogoUrl: string | null;
  portalName: string;         // "Chase Shopping", "Amex Offers", etc.
  cashbackPct: number;
  activationUrl: string;
  requiresCardId: string | null;
}
