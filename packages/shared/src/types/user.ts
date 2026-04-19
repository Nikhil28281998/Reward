// ─── User ───────────────────────────────────────────────────────────────────

export type FilingStatus =
  | 'SINGLE'
  | 'MARRIED_JOINT'
  | 'MARRIED_SEPARATE'
  | 'HEAD_OF_HOUSEHOLD';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string; // ISO-8601
  updatedAt: string;
}

export interface UserIncomeProfile {
  id: string;
  userId: string;
  annualIncome: number;
  filingStatus: FilingStatus;
  state: string | null;
  estimatedTaxRate: number | null;
  updatedAt: string;
}

export interface AuthPayload {
  user: User;
  token: string;
}
