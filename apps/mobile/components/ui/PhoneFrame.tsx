import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Colors } from '../../constants/theme';

const PHONE_MAX = 480;

/**
 * On wide screens (web / tablets > 768px) this wrapper caps the content width
 * so the layout keeps a native-phone proportion. On narrow screens it is a
 * pass-through (no extra chrome).
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 768;

  if (!isWide) return <>{children}</>;

  return (
    <View style={styles.outer}>
      <View style={[styles.frame, { maxWidth: PHONE_MAX }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#030303',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.background,
    overflow: 'hidden',
    // subtle device silhouette on desktop
    ...Platform.select({
      web: {
        // @ts-expect-error web-only
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(79,70,229,0.18)',
        borderRadius: 0,
      },
    }),
  },
});
