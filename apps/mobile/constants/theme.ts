import { Platform } from 'react-native';

// ─── Color Palette (dark-first, inspired by best competitors) ─────────────────
// MaxRewards: clean dark card surface
// Copilot: premium zinc/slate dark mode
// Monarch: vibrant accent on dark background

export const Colors = {
  // ── Brand
  primary: '#7C3AED',       // Violet 600 — main CTA
  primaryLight: '#A78BFA',  // Violet 400
  primaryDark: '#5B21B6',   // Violet 800
  primaryMuted: '#2D1B69',  // Violet 950 — for subtle tints

  // ── Accent / Rewards
  accent: '#10B981',        // Emerald 500 — positive, rewards, gains
  accentLight: '#34D399',   // Emerald 400
  accentDark: '#059669',    // Emerald 600
  accentMuted: '#064E3B',   // Emerald 950

  // ── Semantic
  warning: '#F59E0B',       // Amber 500 — attention
  warningLight: '#FCD34D',  // Amber 300
  warningMuted: '#451A03',  // Amber 950
  danger: '#EF4444',        // Red 500 — negative
  dangerLight: '#FCA5A5',   // Red 300
  dangerMuted: '#450A0A',   // Red 950
  info: '#3B82F6',          // Blue 500

  // ── Backgrounds (true dark palette)
  background: '#09090B',    // Zinc 950 — page bg
  surface: '#18181B',       // Zinc 900 — cards, modals
  surfaceAlt: '#27272A',    // Zinc 800 — input fields, rows
  surfaceRaised: '#3F3F46', // Zinc 700 — hover states

  // ── Borders
  border: '#27272A',        // Zinc 800
  borderLight: '#3F3F46',   // Zinc 700

  // ── Text
  text: '#FAFAFA',          // Zinc 50
  textSecondary: '#A1A1AA', // Zinc 400
  textMuted: '#71717A',     // Zinc 500
  textInverse: '#09090B',   // for use on light backgrounds

  // ── Static
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // ── Card gradients (one per issuer family)
  gradients: {
    chase: ['#1A56DB', '#1C64F2'] as [string, string],
    amex: ['#111827', '#374151'] as [string, string],
    citi: ['#B91C1C', '#DC2626'] as [string, string],
    capitalOne: ['#B45309', '#D97706'] as [string, string],
    discover: ['#D97706', '#F59E0B'] as [string, string],
    boa: ['#1E3A8A', '#1D4ED8'] as [string, string],
    default: ['#5B21B6', '#7C3AED'] as [string, string],
  },
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const Typography = {
  fontSans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  fontMono: Platform.select({
    ios: 'Courier New',
    android: 'monospace',
    default: 'monospace',
  }),

  // Size scale (base = 16)
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // Weight names
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },

  // Line heights
  leading: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  '0': 0,
  px: 1,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const Radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  primaryGlow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
  accentGlow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────────

export const ZIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  modal: 200,
  toast: 300,
  overlay: 400,
} as const;
