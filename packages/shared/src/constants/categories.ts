import type { SpendCategory } from '../types/card';

// ─── Spend Category Metadata ──────────────────────────────────────────────────

export interface CategoryMeta {
  id: SpendCategory;
  label: string;
  icon: string;    // SF Symbol / Material icon name
  emoji: string;
  color: string;   // hex
}

export const CATEGORIES: Record<SpendCategory, CategoryMeta> = {
  dining: {
    id: 'dining', label: 'Dining', icon: 'fork.knife', emoji: '🍽️', color: '#F97316',
  },
  travel: {
    id: 'travel', label: 'Travel', icon: 'airplane', emoji: '✈️', color: '#3B82F6',
  },
  groceries: {
    id: 'groceries', label: 'Groceries', icon: 'cart', emoji: '🛒', color: '#22C55E',
  },
  gas: {
    id: 'gas', label: 'Gas', icon: 'fuelpump', emoji: '⛽', color: '#EAB308',
  },
  streaming: {
    id: 'streaming', label: 'Streaming', icon: 'play.tv', emoji: '📺', color: '#A855F7',
  },
  drugstore: {
    id: 'drugstore', label: 'Drugstore', icon: 'cross.case', emoji: '💊', color: '#EC4899',
  },
  transit: {
    id: 'transit', label: 'Transit', icon: 'tram', emoji: '🚇', color: '#6366F1',
  },
  hotel: {
    id: 'hotel', label: 'Hotels', icon: 'bed.double', emoji: '🏨', color: '#14B8A6',
  },
  airfare: {
    id: 'airfare', label: 'Airfare', icon: 'airplane.departure', emoji: '🛫', color: '#0EA5E9',
  },
  entertainment: {
    id: 'entertainment', label: 'Entertainment', icon: 'ticket', emoji: '🎟️', color: '#F43F5E',
  },
  home_improvement: {
    id: 'home_improvement', label: 'Home', icon: 'hammer', emoji: '🔨', color: '#78716C',
  },
  online_shopping: {
    id: 'online_shopping', label: 'Shopping', icon: 'bag', emoji: '🛍️', color: '#8B5CF6',
  },
  wholesale: {
    id: 'wholesale', label: 'Wholesale', icon: 'building.2', emoji: '🏪', color: '#10B981',
  },
  utilities: {
    id: 'utilities', label: 'Utilities', icon: 'bolt', emoji: '⚡', color: '#F59E0B',
  },
  healthcare: {
    id: 'healthcare', label: 'Healthcare', icon: 'heart.text.square', emoji: '❤️‍🩹', color: '#EF4444',
  },
  other: {
    id: 'other', label: 'Other', icon: 'circle.grid.2x2', emoji: '⚙️', color: '#6B7280',
  },
};

export const CATEGORY_ORDER: SpendCategory[] = [
  'dining', 'travel', 'groceries', 'gas', 'streaming', 'drugstore',
  'transit', 'hotel', 'airfare', 'entertainment', 'home_improvement',
  'online_shopping', 'wholesale', 'utilities', 'healthcare', 'other',
];
