import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Shadow } from '../../constants/theme';

type Size = 'sm' | 'md' | 'lg';

const dims: Record<Size, { box: number; font: number }> = {
  sm: { box: 28, font: 14 },
  md: { box: 36, font: 18 },
  lg: { box: 48, font: 22 },
};

export function AIAvatar({ size = 'md', withGlow = false }: { size?: Size; withGlow?: boolean }) {
  const d = dims[size];
  return (
    <View
      style={[
        styles.wrap,
        { width: d.box, height: d.box, borderRadius: d.box / 2 },
        withGlow && Shadow.primaryGlow,
      ]}
    >
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: d.box / 2 }]}
      />
      <Text style={[styles.glyph, { fontSize: d.font }]}>✦</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glyph: {
    color: Colors.white,
    fontWeight: Typography.weight.bold,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
