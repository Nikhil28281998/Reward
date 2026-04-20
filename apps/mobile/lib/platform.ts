/**
 * Single source of truth for platform-aware wrappers.
 * Native (iOS/Android) → real Expo modules. Web → graceful fallbacks so we never crash.
 */

import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = !isWeb;

// ─── Secure key/value storage ─────────────────────────────────────────────────

let _SecureStore: typeof import('expo-secure-store') | null = null;
if (isNative) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _SecureStore = require('expo-secure-store');
}

export const storage = {
  async get(key: string): Promise<string | null> {
    if (isWeb) {
      try { return window.localStorage.getItem(key); } catch { return null; }
    }
    return _SecureStore!.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (isWeb) {
      try { window.localStorage.setItem(key, value); } catch { /* private mode */ }
      return;
    }
    await _SecureStore!.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (isWeb) {
      try { window.localStorage.removeItem(key); } catch { /* ignore */ }
      return;
    }
    await _SecureStore!.deleteItemAsync(key);
  },
};

// ─── Haptics ──────────────────────────────────────────────────────────────────

let _Haptics: typeof import('expo-haptics') | null = null;
if (isNative) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _Haptics = require('expo-haptics');
  } catch { /* not installed */ }
}

export const haptics = {
  light(): void {
    if (!_Haptics) return;
    void _Haptics.impactAsync(_Haptics.ImpactFeedbackStyle.Light);
  },
  medium(): void {
    if (!_Haptics) return;
    void _Haptics.impactAsync(_Haptics.ImpactFeedbackStyle.Medium);
  },
  success(): void {
    if (!_Haptics) return;
    void _Haptics.notificationAsync(_Haptics.NotificationFeedbackType.Success);
  },
  error(): void {
    if (!_Haptics) return;
    void _Haptics.notificationAsync(_Haptics.NotificationFeedbackType.Error);
  },
};

// ─── Responsive helpers (web-aware breakpoints) ──────────────────────────────

export const Breakpoint = {
  sm: 640,
  md: 768,
  lg: 900,   // sidebar appears above this on web
  xl: 1200,
  '2xl': 1440,
} as const;

export function isDesktopWidth(width: number): boolean {
  return isWeb && width >= Breakpoint.lg;
}
