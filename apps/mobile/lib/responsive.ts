import { Dimensions, PixelRatio } from 'react-native';

// ─── Responsive Scaling Utilities ────────────────────────────────────────────
// Design reference: iPhone 14 Pro (390 × 844 logical pixels)
// All screens — iPhone SE (375) → 14 Pro Max (430) → iPad (768+)

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

function getDimensions() {
  const { width, height } = Dimensions.get('window');
  return { width, height };
}

/** Percentage of screen width. wp(90) = 90% of screen width */
export function wp(pct: number): number {
  return (getDimensions().width * pct) / 100;
}

/** Percentage of screen height. hp(50) = 50% of screen height */
export function hp(pct: number): number {
  return (getDimensions().height * pct) / 100;
}

/** Scales linearly with screen width. Good for spacing and layout. */
export function scale(size: number): number {
  return (getDimensions().width / BASE_WIDTH) * size;
}

/** Scales linearly with screen height. Good for vertical spacing. */
export function verticalScale(size: number): number {
  return (getDimensions().height / BASE_HEIGHT) * size;
}

/**
 * Moderates scaling — interpolates between a fixed size and a fully scaled size.
 * @param size Base size at 390px width
 * @param factor 0 = no scaling (fixed), 1 = full linear scaling. Default 0.5
 *
 * Best for: font sizes, icon sizes, padding — elements that shouldn't change too dramatically.
 */
export function moderateScale(size: number, factor = 0.5): number {
  return size + (scale(size) - size) * factor;
}

/** Moderate vertical scale */
export function moderateVerticalScale(size: number, factor = 0.5): number {
  return size + (verticalScale(size) - size) * factor;
}

// ─── Breakpoints ──────────────────────────────────────────────────────────────

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

const BREAKPOINTS: Record<Breakpoint, number> = {
  sm: 375,  // iPhone SE
  md: 390,  // iPhone 14 Pro (design reference)
  lg: 430,  // iPhone 14 Pro Max / Plus
  xl: 768,  // iPad
};

export function getBreakpoint(): Breakpoint {
  const { width } = getDimensions();
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  return 'sm';
}

export function isTablet(): boolean {
  return getDimensions().width >= BREAKPOINTS.xl;
}

/**
 * Pick a responsive value based on breakpoint.
 * @example responsive({ sm: 12, md: 16, lg: 20 })
 */
export function responsive<T>(values: Partial<Record<Breakpoint, T>> & { sm: T }): T {
  const bp = getBreakpoint();
  return values[bp] ?? values.lg ?? values.md ?? values.sm;
}

// ─── Font Pixel Density ───────────────────────────────────────────────────────

/** Normalize font size to pixel density — prevents blurry text on high-DPI screens */
export function normalizeFontSize(size: number): number {
  const newSize = moderateScale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}
