import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { CATEGORIES } from '@reward/shared';
import type { SpendCategorySummary } from '@reward/shared';
import { formatUSD } from '@reward/shared';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SVG_SIZE = 200;
const CENTER = SVG_SIZE / 2;
const RING_STROKE = 10;
const RING_GAP = 4;
const MAX_RINGS = 5;

function Ring({
  radius,
  color,
  pct,
  delay,
}: {
  radius: number;
  color: string;
  pct: number;
  delay: number;
}) {
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withTiming(pct, { duration: 900, easing: Easing.out(Easing.quad) });
    }, delay);
    return () => clearTimeout(timer);
  }, [pct, delay, progress]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
      {/* Track */}
      <Circle
        cx={CENTER}
        cy={CENTER}
        r={radius}
        stroke={Colors.surfaceAlt}
        strokeWidth={RING_STROKE}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={0}
        strokeLinecap="round"
      />
      {/* Fill */}
      <AnimatedCircle
        cx={CENTER}
        cy={CENTER}
        r={radius}
        stroke={color}
        strokeWidth={RING_STROKE}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animProps}
        strokeLinecap="round"
      />
    </G>
  );
}

interface SpendRingsProps {
  categories: SpendCategorySummary[];
  totalSpend: number;
  isLoading?: boolean;
  style?: ViewStyle;
}

export function SpendRings({ categories, totalSpend, isLoading, style }: SpendRingsProps) {
  const sorted = [...categories].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, MAX_RINGS);
  const maxAmount = sorted[0]?.totalAmount ?? 1;

  const RING_COLORS = [
    Colors.primary,
    Colors.accent,
    Colors.warning,
    '#EC4899',
    '#06B6D4',
  ];

  return (
    <View style={[styles.container, style]}>
      {/* SVG Rings */}
      <View style={styles.svgWrapper}>
        <Svg width={SVG_SIZE} height={SVG_SIZE}>
          {sorted.map((cat, i) => {
            const radius = CENTER - RING_STROKE / 2 - i * (RING_STROKE + RING_GAP);
            const pct = maxAmount > 0 ? cat.totalAmount / maxAmount : 0;
            return (
              <Ring
                key={cat.category}
                radius={Math.max(radius, 8)}
                color={RING_COLORS[i] ?? Colors.textMuted}
                pct={pct}
                delay={i * 80}
              />
            );
          })}
        </Svg>

        {/* Center total */}
        <View style={styles.centerText}>
          <Text style={[styles.totalSpend, { fontSize: moderateScale(20) }]}>
            {formatUSD(totalSpend)}
          </Text>
          <Text style={[styles.totalLabel, { fontSize: moderateScale(11) }]}>total</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {sorted.map((cat, i) => {
          const meta = CATEGORIES[cat.category as keyof typeof CATEGORIES];
          const pct = totalSpend > 0 ? Math.round((cat.totalAmount / totalSpend) * 100) : 0;
          return (
            <View key={cat.category} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: RING_COLORS[i] ?? Colors.textMuted }]} />
              <Text style={[styles.legendEmoji]}>{meta?.emoji ?? '💰'}</Text>
              <Text style={[styles.legendLabel, { fontSize: moderateScale(13) }]}>
                {meta?.label ?? cat.category}
              </Text>
              <Text style={[styles.legendAmount, { fontSize: moderateScale(13) }]}>
                {formatUSD(cat.totalAmount)}
              </Text>
              <Text style={[styles.legendPct, { fontSize: moderateScale(12) }]}>{pct}%</Text>
            </View>
          );
        })}
        {categories.length === 0 && !isLoading && (
          <Text style={[styles.emptyText, { fontSize: moderateScale(13) }]}>
            No spend data yet
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing['4'], borderWidth: 1, borderColor: Colors.border },
  svgWrapper: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  centerText: { position: 'absolute', alignItems: 'center' },
  totalSpend: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.5 },
  totalLabel: { color: Colors.textMuted },
  legend: { marginTop: Spacing['4'], gap: Spacing['2'] },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['2'] },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendEmoji: { fontSize: 16 },
  legendLabel: { flex: 1, color: Colors.textSecondary },
  legendAmount: { color: Colors.text, fontWeight: Typography.weight.semibold },
  legendPct: { color: Colors.textMuted, width: 36, textAlign: 'right' },
  emptyText: { color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing['4'] },
});
