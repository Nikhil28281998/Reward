import type { SpendCategory } from './card';

// ─── Transaction Types ────────────────────────────────────────────────────────

export type OcrStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface StatementUploadResult {
  statementId: string;
  status: OcrStatus;
  message: string;
}

export interface StatementStatus {
  id: string;
  ocrStatus: OcrStatus;
  periodStart: string | null;
  periodEnd: string | null;
  totalCharges: number | null;
  transactionCount: number;
  cardAccountId: string | null;
}

export interface TransactionRaw {
  id: string;
  statementId: string;
  rawDate: string | null;
  rawDescription: string | null;
  rawAmount: string | null;
  parsedDate: string | null;
  parsedAmount: number | null;
  confidence: number | null;
}

export interface Transaction {
  id: string;
  cardAccountId: string;
  date: string; // ISO-8601 date
  description: string;
  merchantName: string | null;
  merchantCity: string | null;
  amount: number; // in dollars (positive = charge, negative = credit)
  isCredit: boolean;
  category: SpendCategory;
  subcategory: string | null;
  rewardEarned: number | null; // points/miles
  rewardRate: number | null;   // effective multiplier
  tags: string[];
  notes: string | null;
  createdAt: string;
}

export interface SpendCategorySummary {
  category: SpendCategory;
  totalAmount: number;
  transactionCount: number;
  pct: number; // 0–100 share of total spend
  bestCardMultiplier: number | null;
  bestCardId: string | null;
}

export interface MonthlySpend {
  month: string; // "2026-03"
  totalSpend: number;
  totalCredits: number;
  netSpend: number;
  byCategory: SpendCategorySummary[];
}
