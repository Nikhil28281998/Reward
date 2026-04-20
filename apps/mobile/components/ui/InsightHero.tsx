import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
  interpolate, withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale } from '../../lib/responsive';

export interface Insight {
  emoji: string;
  headline: string;
  body: string;
  // Optional value chip e.g. "+$34/mo"
  chip?: string;
}

interface InsightHeroProps {
  insights: Insight[];
  rotateMs?: number;
  style?: ViewStyle;
}

/**
 * Animated AI insight banner. Rotates through insights every `rotateMs`
 * with a subtle fade + slide. The aurora gradient pulses gently to feel alive.
 */
export function InsightHero({ insights, rotateMs = 6000, style }: InsightHeroProps) {
  const safe = insights.length > 0 ? insights : [
    { emoji: '🤖', headline: 'Connect a card to unlock insights', body: 'Labhly will spot earning gaps & missed bonuses for you.' },
  ];

  const fade = useSharedValue(1);
  const aurora = useSharedValue(0);
  const aurora2 = useSharedValue(0);
  const orb1 = useSharedValue(0);
  const orb2 = useSharedValue(0);
  const [jsIdx, setJsIdx] = React.useState(0);

  useEffect(() => {
    aurora.value = withRepeat(withTiming(1, { duration: 4500, easing: Easing.inOut(Easing.sin) }), -1, true);
    aurora2.value = withRepeat(withTiming(1, { duration: 6800, easing: Easing.inOut(Easing.sin) }), -1, true);
    orb1.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.quad) }), -1, true);
    orb2.value = withRepeat(withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.quad) }), -1, true);
    if (safe.length <= 1) return;
    const id = setInterval(() => {
      fade.value = withSequence(
        withTiming(0, { duration: 250 }),
        withTiming(1, { duration: 350 }),
      );
      setTimeout(() => setJsIdx((i) => (i + 1) % safe.length), 260);
    }, rotateMs);
    return () => clearInterval(id);
  }, [rotateMs, safe.length, fade, aurora, aurora2, orb1, orb2]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: interpolate(fade.value, [0, 1], [6, 0]) }],
  }));

  const auroraStyle = useAnimatedStyle(() => ({
    opacity: interpolate(aurora.value, [0, 1], [0.55, 1]),
    transform: [{ translateX: interpolate(aurora.value, [0, 1], [-30, 30]) }],
  }));

  const aurora2Style = useAnimatedStyle(() => ({
    opacity: interpolate(aurora2.value, [0, 1], [0.3, 0.75]),
    transform: [
      { translateX: interpolate(aurora2.value, [0, 1], [40, -40]) },
      { translateY: interpolate(aurora2.value, [0, 1], [10, -10]) },
    ],
  }));

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb1.value, [0, 1], [-20, 180]) },
      { translateY: interpolate(orb1.value, [0, 1], [-10, 40]) },
    ],
    opacity: interpolate(orb1.value, [0, 0.5, 1], [0.4, 0.7, 0.4]),
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb2.value, [0, 1], [220, 20]) },
      { translateY: interpolate(orb2.value, [0, 1], [80, 20]) },
    ],
    opacity: interpolate(orb2.value, [0, 0.5, 1], [0.25, 0.55, 0.25]),
  }));

  const current = safe[jsIdx];

  return (
    <View style={[styles.container, style]}>
      {/* Aurora background */}
      <View style={styles.auroraWrap} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, auroraStyle]}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED', '#10B981']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, aurora2Style]}>
          <LinearGradient
            colors={['#F59E0B', '#EC4899', '#3B82F6']}
            start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        {/* Floating light orbs */}
        <Animated.View style={[styles.orb, styles.orbA, orb1Style]} />
        <Animated.View style={[styles.orb, styles.orbB, orb2Style]} />
        {/* Frosted overlay */}
        <View style={styles.frost} />
      </View>

      {/* Header pill */}
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={[styles.kicker, { fontSize: moderateScale(10) }]}>LABHLY · LIVE INSIGHT</Text>
        {current.chip ? (
          <View style={styles.chip}>
            <Text style={[styles.chipText, { fontSize: moderateScale(11) }]}>{current.chip}</Text>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <Animated.View style={fadeStyle}>
        <Text style={[styles.headline, { fontSize: moderateScale(17) }]}>
          {current.emoji}  {current.headline}
        </Text>
        <Text style={[styles.body, { fontSize: moderateScale(13) }]}>{current.body}</Text>
      </Animated.View>

      {/* Page dots */}
      {safe.length > 1 ? (
        <View style={styles.dots}>
          {safe.map((_, i) => (
            <View key={i} style={[styles.pageDot, i === jsIdx && styles.pageDotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius['2xl'],
    padding: Spacing['5'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.35)',
    minHeight: 140,
    ...Shadow.primaryGlow,
  },
  auroraWrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  frost: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9,9,11,0.72)' },
  orb: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  orbA: { backgroundColor: 'rgba(168, 85, 247, 0.45)', top: -30, left: -20 },
  orbB: { backgroundColor: 'rgba(59, 130, 246, 0.35)', top: 20, right: -40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing['2'], marginBottom: Spacing['3'] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, ...Shadow.accentGlow },
  kicker: { color: Colors.textSecondary, letterSpacing: 1.4, fontWeight: Typography.weight.bold, flex: 1 },
  chip: { backgroundColor: 'rgba(16, 185, 129, 0.18)', borderRadius: Radius.full, paddingHorizontal: Spacing['3'], paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)' },
  chipText: { color: Colors.accentLight, fontWeight: Typography.weight.bold },
  headline: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.3, lineHeight: 24 },
  body: { color: Colors.textSecondary, marginTop: Spacing['2'], lineHeight: 19 },
  dots: { flexDirection: 'row', gap: 5, marginTop: Spacing['3'] },
  pageDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.borderLight },
  pageDotActive: { backgroundColor: Colors.primaryLight, width: 16 },
});
