// ─── Plan Types ───────────────────────────────────────────────────────────────

export type PlanStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface PlanInstance {
  id: string;
  userId: string;
  name: string;
  destination: string | null;
  targetDate: string | null;
  pointsGoal: number | null;
  currentPoints: number | null;
  progressPct: number | null; // 0–100
  status: PlanStatus;
  recommendations: Array<{
    cardId: string;
    cardName: string;
    action: string;
    estimatedPoints: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cardReferences: string[];   // card IDs mentioned
  createdAt: string;
}

export interface AssistantResponse {
  message: AssistantMessage;
  suggestedFollowUps: string[];
}
